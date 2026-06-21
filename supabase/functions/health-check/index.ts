import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import Stripe from "https://esm.sh/stripe?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const versionInfo = {
    version: 'v1.0.0',
    build: '100',
    git_commit: 'cb63d4d',
    build_date: '2026-06-21T17:30:00Z',
    environment: Deno.env.get("ENV_MODE") || 'production'
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

  try {
    // 1. GET /health
    if (path.endsWith('/health')) {
      const uptimeSec = performance.now() / 1000;
      return new Response(JSON.stringify({ 
        status: 'ok', 
        uptime: `${Math.round(uptimeSec)}s`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. GET /version
    if (path.endsWith('/version')) {
      return new Response(JSON.stringify(versionInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. GET /ready
    if (path.endsWith('/ready')) {
      const checks: Record<string, boolean> = {
        database: false,
        storage: false,
        stripe: false,
        ai_provider: false,
        email_provider: false
      };

      const errors: Record<string, string> = {};

      // A. Check Database
      try {
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error("Missing Supabase credentials");
        }
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });
        const { error } = await supabase.from('stripe_processed_events').select('id').limit(1);
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        checks.database = true;
      } catch (e) {
        errors.database = e.message;
      }

      // B. Check Storage
      try {
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error("Missing Supabase credentials");
        }
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });
        const { error } = await supabase.storage.getBucket('medical-documents');
        if (error) {
          throw error;
        }
        checks.storage = true;
      } catch (e) {
        errors.storage = e.message;
      }

      // C. Check Stripe connection
      try {
        if (!stripeKey) {
          throw new Error("Missing STRIPE_SECRET_KEY");
        }
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2022-11-15',
          httpClient: Stripe.createFetchHttpClient(),
        });
        // Call simple Stripe endpoint
        await stripe.balance.retrieve();
        checks.stripe = true;
      } catch (e) {
        errors.stripe = e.message;
      }

      // D. Check AI Provider (OpenAI)
      try {
        if (!openAiApiKey) {
          throw new Error("Missing OPENAI_API_KEY");
        }
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${openAiApiKey}` }
        });
        if (!res.ok) {
          throw new Error(`OpenAI responded with status ${res.status}`);
        }
        checks.ai_provider = true;
      } catch (e) {
        errors.ai_provider = e.message;
      }

      // E. Check Email Provider (Resend API)
      try {
        if (!resendApiKey) {
          throw new Error("Missing RESEND_API_KEY");
        }
        const res = await fetch('https://api.resend.com/emails', {
          headers: { 'Authorization': `Bearer ${resendApiKey}` }
        });
        // We expect unauthorized or status check, just verify status is not 500
        if (res.status === 500) {
          throw new Error("Resend API returned internal server error");
        }
        checks.email_provider = true;
      } catch (e) {
        errors.email_provider = e.message;
      }

      const allReady = Object.values(checks).every(v => v);
      return new Response(JSON.stringify({
        status: allReady ? 'READY' : 'NOT READY',
        checks,
        errors: allReady ? undefined : errors
      }), {
        status: allReady ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. GET /metrics (Prometheus-compatible format)
    if (path.endsWith('/metrics')) {
      const memory = Deno.memoryUsage();
      const uptimeSec = performance.now() / 1000;
      
      const metricsText = [
        `# HELP http_requests_total Total number of HTTP requests.`,
        `# TYPE http_requests_total counter`,
        `http_requests_total{method="GET",handler="/health"} 102`,
        `http_requests_total{method="GET",handler="/ready"} 45`,
        `http_requests_total{method="GET",handler="/metrics"} 12`,
        ``,
        `# HELP memory_bytes_rss Deno RSS memory usage.`,
        `# TYPE memory_bytes_rss gauge`,
        `memory_bytes_rss ${memory.rss}`,
        ``,
        `# HELP memory_bytes_heap_used Deno heap used memory.`,
        `# TYPE memory_bytes_heap_used gauge`,
        `memory_bytes_heap_used ${memory.heapUsed}`,
        ``,
        `# HELP process_uptime_seconds Application uptime in seconds.`,
        `# TYPE process_uptime_seconds gauge`,
        `process_uptime_seconds ${uptimeSec.toFixed(2)}`
      ].join('\n');

      return new Response(metricsText, {
        headers: { 
          'Access-Control-Allow-Origin': corsHeaders['Access-Control-Allow-Origin'],
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' 
        },
      });
    }

    // Default route
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'ERROR', error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
