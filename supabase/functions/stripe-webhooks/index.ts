import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import Stripe from "https://esm.sh/stripe?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!stripeKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing production secrets on server" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);

    console.log(`[Stripe Webhook] Received event: ${event.type}, ID: ${event.id}`);

    // 1. Replay Protection: reject events created more than 5 minutes (300 seconds) ago
    const toleranceSeconds = 300;
    const eventAge = (Date.now() / 1000) - event.created;
    if (eventAge > toleranceSeconds) {
      console.warn(`[Stripe Webhook] Replay attack detected. Event age is ${eventAge} seconds (threshold: ${toleranceSeconds}).`);
      return new Response(JSON.stringify({ error: "Event timestamp out of window" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2. Webhook Idempotency: verify if event.id was already processed
    const { data: existingEvent, error: selectError } = await supabaseAdmin
      .from('stripe_processed_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`[Stripe Webhook] Duplicate event detected. Event ${event.id} already processed.`);
      return new Response(JSON.stringify({ received: true, status: 'ignored_duplicate' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the event ID, timestamp, and status immediately to enforce idempotency
    const { error: insertError } = await supabaseAdmin
      .from('stripe_processed_events')
      .insert([{
        id: event.id,
        processed_at: new Date().toISOString(),
        status: 'processed'
      }]);

    if (insertError) {
      console.warn(`[Stripe Webhook] Failed to record event ID in db (perhaps already written):`, insertError.message);
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ received: true, status: 'ignored_duplicate' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Process Webhook Event Types
    let userId = "";
    let customerId = "";
    let subscriptionId = "";
    let tier = "free";
    let interval = "monthly";
    let isTrial = false;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        userId = session.metadata?.userId || "";
        customerId = session.customer || "";
        subscriptionId = session.subscription || "";
        tier = session.metadata?.tier || "pro";
        interval = session.metadata?.interval || "monthly";

        if (userId) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              subscription_interval: interval,
              subscription_is_trial: false,
              subscription_cache_updated_at: new Date().toISOString()
            }
          });
          console.log(`[Stripe Webhook] Subscribed user ${userId} to ${tier} (${interval})`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        customerId = subscription.customer;
        subscriptionId = subscription.id;
        isTrial = subscription.status === 'trialing';

        const items = subscription.items?.data || [];
        const priceId = items[0]?.price?.id || "";
        tier = "pro"; 
        if (priceId && (priceId === Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || priceId === 'price_premium_monthly_id' || priceId === 'price_premium_annual_id')) {
          tier = "premium";
        }

        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError && usersList && usersList.users) {
          const matchingUser = usersList.users.find(
            (u) => u.user_metadata?.stripe_customer_id === customerId
          );
          if (matchingUser) {
            userId = matchingUser.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...matchingUser.user_metadata,
                stripe_subscription_id: subscriptionId,
                subscription_tier: subscription.status === 'active' || isTrial ? tier : 'free',
                subscription_interval: subscription.plan?.interval || 'monthly',
                subscription_is_trial: isTrial,
                subscription_cache_updated_at: new Date().toISOString()
              }
            });
            console.log(`[Stripe Webhook] Updated subscription for user ${userId} to status: ${subscription.status}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        customerId = subscription.customer;

        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError && usersList && usersList.users) {
          const matchingUser = usersList.users.find(
            (u) => u.user_metadata?.stripe_customer_id === customerId
          );
          if (matchingUser) {
            userId = matchingUser.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...matchingUser.user_metadata,
                subscription_tier: 'free',
                subscription_is_trial: false,
                subscription_cache_updated_at: new Date().toISOString()
              }
            });
            console.log(`[Stripe Webhook] Cancelled subscription for user ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        customerId = invoice.customer;
        
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError && usersList && usersList.users) {
          const matchingUser = usersList.users.find(
            (u) => u.user_metadata?.stripe_customer_id === customerId
          );
          if (matchingUser) {
            userId = matchingUser.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...matchingUser.user_metadata,
                subscription_tier: 'free',
                subscription_is_trial: false,
                subscription_cache_updated_at: new Date().toISOString()
              }
            });
            console.warn(`[Stripe Webhook] Payment failed for user ${userId}. Downgrading to free.`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`[Stripe Webhook] Error:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
