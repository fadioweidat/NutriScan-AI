import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium'
};

/**
 * Authoritatively retrieves the user's active subscription tier directly from Stripe.
 * Utilizes a 5-minute TTL cache stored in Supabase Auth metadata.
 */
export async function getAuthoritativeUserTier(user: any): Promise<string> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";

  // 1. Check if cache exists and is within 5 minutes TTL
  const cachedTier = user?.user_metadata?.subscription_tier;
  const cacheUpdatedAtStr = user?.user_metadata?.subscription_cache_updated_at;
  
  if (cachedTier && cacheUpdatedAtStr) {
    try {
      const cacheUpdatedAt = new Date(cacheUpdatedAtStr).getTime();
      const now = Date.now();
      const ageMs = now - cacheUpdatedAt;
      const ttlMs = 5 * 60 * 1000; // 5 minutes

      if (ageMs > 0 && ageMs < ttlMs) {
        console.log(`[Subscription Server] Cache hit. Serving cached tier [${cachedTier}] (age: ${Math.round(ageMs / 1000)}s)`);
        return cachedTier;
      }
      console.log(`[Subscription Server] Cache expired (age: ${Math.round(ageMs / 1000)}s). Re-verifying with Stripe...`);
    } catch (e) {
      console.warn("[Subscription Server] Failed parsing cache timestamp:", e.message);
    }
  }

  // If Stripe Key is not set, we cannot query Stripe (e.g. testing / offline)
  if (!stripeKey) {
    console.warn("[Subscription Server] STRIPE_SECRET_KEY missing. Serving cached metadata.");
    return user?.user_metadata?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    let stripeCustomerId = user?.user_metadata?.stripe_customer_id;

    if (!stripeCustomerId && user?.email) {
      // Find customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      }
    }

    let activeTier = SUBSCRIPTION_TIERS.FREE;
    let activeInterval = 'monthly';

    if (stripeCustomerId) {
      // Check active subscriptions in Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1
      });

      let activeSub = subscriptions.data[0];
      if (!activeSub) {
        // Also check trialing subscriptions
        const trialing = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'trialing',
          limit: 1
        });
        activeSub = trialing.data[0];
      }

      if (activeSub) {
        const priceId = activeSub.items?.data[0]?.price?.id;
        const premiumPriceId = Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || "price_premium_monthly_id";
        const premiumAnnualPriceId = Deno.env.get("STRIPE_PREMIUM_ANNUAL_PRICE_ID") || "price_premium_annual_id";

        if (priceId === premiumPriceId || priceId === premiumAnnualPriceId) {
          activeTier = SUBSCRIPTION_TIERS.PREMIUM;
        } else {
          activeTier = SUBSCRIPTION_TIERS.PRO;
        }
        activeInterval = activeSub.plan?.interval || 'monthly';
      }
    }

    // 2. Update Auth Metadata cache on Supabase Server
    if (supabaseUrl && supabaseServiceKey && user?.id) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });

      console.log(`[Subscription Server] Syncing and updating user_metadata cache for user ${user.id}: tier=${activeTier}`);
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          subscription_tier: activeTier,
          subscription_interval: activeInterval,
          subscription_cache_updated_at: new Date().toISOString()
        }
      });
    }

    return activeTier;
  } catch (err) {
    console.error("[Subscription Server] Stripe verification failed. Serving fallback cache:", err.message);
    return user?.user_metadata?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  }
}
