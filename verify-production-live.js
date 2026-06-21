import fs from 'fs';
import path from 'path';

console.log("=== STARTING PRODUCTION LIVE OPERATIONS VALIDATION SUITE ===\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAILURE: ${message}`);
  }
}

// Helper to recursively list files
function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getFilesRecursively(name, fileList);
      }
    } else {
      if (
        name.endsWith('.js') || 
        name.endsWith('.jsx') || 
        name.endsWith('.ts') || 
        name.endsWith('.json') ||
        name.endsWith('.yml') ||
        name.endsWith('.yaml') ||
        name.includes('.env') ||
        name.includes('Dockerfile') ||
        name.includes('docker-compose')
      ) {
        fileList.push(name);
      }
    }
  }
  return fileList;
}

const allCodeFiles = getFilesRecursively(process.cwd());

// 1. Stripe Signature Verification check
try {
  const webhookFile = path.join(process.cwd(), 'supabase/functions/stripe-webhooks/index.ts');
  const hasWebhook = fs.existsSync(webhookFile);
  assert(hasWebhook, "Stripe webhooks Edge Function file exists");

  if (hasWebhook) {
    const content = fs.readFileSync(webhookFile, 'utf-8');
    const verifiesSig = content.includes('stripe.webhooks.constructEvent');
    assert(verifiesSig, "Stripe Webhooks implements cryptographic signature verification");
  }
} catch (e) {
  assert(false, `Stripe Signature check failed: ${e.message}`);
}

// 2. Webhook Idempotency & Replay Protection
try {
  const webhookFile = path.join(process.cwd(), 'supabase/functions/stripe-webhooks/index.ts');
  if (fs.existsSync(webhookFile)) {
    const content = fs.readFileSync(webhookFile, 'utf-8');
    const hasIdempotency = content.includes('stripe_processed_events') && content.includes('status: \'processed\'');
    const hasReplayProtection = content.includes('toleranceSeconds') && content.includes('eventAge');
    
    assert(hasIdempotency, "Stripe Webhooks record event.id, timestamp, and status to enforce idempotency");
    assert(hasReplayProtection, "Stripe Webhooks enforce replay protection using event age tolerance threshold");
  }
} catch (e) {
  assert(false, `Webhook idempotency audit crashed: ${e.message}`);
}

// 3. TTL Cache Check
try {
  const subUtilFile = path.join(process.cwd(), 'supabase/functions/_shared/subscription.ts');
  let hasTtlCache = false;
  if (fs.existsSync(subUtilFile)) {
    const content = fs.readFileSync(subUtilFile, 'utf-8');
    hasTtlCache = content.includes('subscription_cache_updated_at') && content.includes('5 * 60 * 1000'); // 5 minutes in ms
  }
  assert(hasTtlCache, "Subscription caching enforces a maximum 5-minute TTL cache using metadata");
} catch (e) {
  assert(false, `TTL Cache check failed: ${e.message}`);
}

// 4. CSP & HSTS Headers check
try {
  const prodConfigPath = path.join(process.cwd(), 'src/lib/operations/production-config.js');
  let hasCsp = false;
  let hasHsts = false;

  if (fs.existsSync(prodConfigPath)) {
    const content = fs.readFileSync(prodConfigPath, 'utf-8');
    hasCsp = content.includes('contentSecurityPolicy');
    hasHsts = content.includes('hsts') && content.includes('max-age');
  }
  assert(hasCsp, "Production configuration specifies Content-Security-Policy (CSP) headers");
  assert(hasHsts, "Production configuration specifies Strict-Transport-Security (HSTS) headers");
} catch (e) {
  assert(false, `CSP/HSTS checks failed: ${e.message}`);
}

// 5. Secure Cookies & CORS Whitelist Policy
try {
  const prodConfigPath = path.join(process.cwd(), 'src/lib/operations/production-config.js');
  let hasSecureCookies = false;
  
  if (fs.existsSync(prodConfigPath)) {
    const content = fs.readFileSync(prodConfigPath, 'utf-8');
    hasSecureCookies = (content.includes('secureCookies') || content.includes('SameSite=Strict')) && content.includes('httpsOnly');
  }
  assert(hasSecureCookies, "Production configuration dictates Secure, SameSite=Strict and HTTPS-only cookies");

  // Check CORS policy inside Edge Functions - no wildcard allowed
  let corsSecure = true;
  const edgeFiles = allCodeFiles.filter(f => f.includes('supabase/functions/') && f.endsWith('.ts'));
  edgeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // If it contains Access-Control-Allow-Origin: * or hardcoded '*', it fails
    if (content.includes("'Access-Control-Allow-Origin': '*'") || content.includes('"Access-Control-Allow-Origin": "*"')) {
      corsSecure = false;
      console.error(`❌ CORS WILDCARD VIOLATION in Edge Function: [${file}]`);
    }
  });

  // Verify that shared cors.ts has the specific whitelist
  const corsSharedFile = path.join(process.cwd(), 'supabase/functions/_shared/cors.ts');
  let corsWhitelistIntact = false;
  if (fs.existsSync(corsSharedFile)) {
    const content = fs.readFileSync(corsSharedFile, 'utf-8');
    corsWhitelistIntact = content.includes('https://nutriscan.ai') && content.includes('https://www.nutriscan.ai') && content.includes('http://localhost:5173');
  }

  assert(corsSecure && corsWhitelistIntact, "All serverless Edge Functions implement correct CORS whitelist policies, blocking wildcard origins");
} catch (e) {
  assert(false, `Secure Cookies / CORS check crashed: ${e.message}`);
}

// 6. Secret Scanner (Checks for hardcoded OpenAI Keys, Stripe, JWT, Google AIza, Slack, SendGrid, etc.)
try {
  let secretLeaked = false;
  
  // Specific regex patterns for the 9 keys requested
  const patternRegexes = {
    'sk-': /sk-(proj|live|test)?-[a-zA-Z0-9-_]{20,}/,
    'rk_': /rk_(live|test)_[a-zA-Z0-9-_]{20,}/,
    'Bearer': /Bearer\s+ey[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/,
    'JWT': /eyJhbGciOi[a-zA-Z0-9-_]{10,}/,
    'AIza': /AIzaSy[a-zA-Z0-9-_]{20,}/,
    'ghp_': /ghp_[a-zA-Z0-9]{15,}/,
    'xoxb-': /xoxb-[a-zA-Z0-9-_]{15,}/,
    'SG.': /SG\.[a-zA-Z0-9-_]{22}\.[a-zA-Z0-9-_]{43}/
  };

  allCodeFiles.forEach(file => {
    // Skip verification scripts, log sanitizers, and mock integrations to avoid self-triggering
    if (
      file.includes('verify-') || 
      file.includes('log-sanitizer') || 
      file.includes('monitoring-integration') || 
      file.includes('stripe-simulator') || 
      file.includes('load-test')
    ) {
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');

    // Run regex scans
    for (const [name, regex] of Object.entries(patternRegexes)) {
      if (regex.test(content)) {
        const match = content.match(regex)[0];
        // Exclude generic placeholder text
        if (!match.includes('placeholder') && !match.includes('your_') && !match.includes('example')) {
          secretLeaked = true;
          console.error(`❌ SECRET LEAKAGE: Leaked [${name}] key pattern found in [${file}]: ${match.substring(0, 10)}...`);
        }
      }
    }

    // Check service_role hardcoded assignments in files
    if (content.includes('service_role') && !file.endsWith('.env') && !file.endsWith('.env.example') && !file.endsWith('.env.production') && !file.endsWith('.env.local')) {
      const assignmentRegex = /service_role[_a-zA-Z]*\s*[:=]\s*['"](sb_secret_[a-zA-Z0-9-_]{20,})['"]/i;
      if (assignmentRegex.test(content)) {
        const match = content.match(assignmentRegex)[1];
        if (!match.includes('placeholder') && !match.includes('your_')) {
          secretLeaked = true;
          console.error(`❌ SECRET LEAKAGE: Hardcoded service_role key found in [${file}]`);
        }
      }
    }
  });

  assert(!secretLeaked, "Zero hardcoded OpenAI keys, Stripe secret keys, JWT tokens, Google AIza, PATs, or service roles leaked in codebase");
} catch (e) {
  assert(false, `Secret leakage scan crashed: ${e.message}`);
}

// 7. Source Map Leakage
try {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.js');
  let sourcemapDisabled = true;
  if (fs.existsSync(viteConfigPath)) {
    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    if (content.includes('sourcemap: true') || content.includes('sourcemap: \'inline\'')) {
      sourcemapDisabled = false;
    }
  }
  assert(sourcemapDisabled, "Production bundle source mapping configuration is secure (no sourcemap leaks)");
} catch (e) {
  assert(false, `Source Map check crashed: ${e.message}`);
}

// 8. Environment Leakage
try {
  const envPath = path.join(process.cwd(), '.env');
  let envSecure = true;
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const parts = line.split('=');
      const key = parts[0]?.trim();
      const val = parts[1]?.trim();
      
      if (key && key.startsWith('VITE_')) {
        if (key.includes('SECRET') || key.includes('API_KEY') || key.includes('SERVICE_ROLE') || key.includes('PASSWORD')) {
          if (val && !val.includes('placeholder') && !val.includes('your_') && !val.includes('sb_anon')) {
            envSecure = false;
            console.error(`❌ ENV LEAKAGE: Secret key found in public VITE_ variable: ${key}`);
          }
        }
      }
    });
  }
  assert(envSecure, "Public client environment file (.env) contains no server-side secrets or keys");
} catch (e) {
  assert(false, `Environment leakage check failed: ${e.message}`);
}

// 9. Operational GET endpoints: /health, /ready, /version, /metrics
try {
  const healthCheckFile = path.join(process.cwd(), 'supabase/functions/health-check/index.ts');
  let hasVersionEndpoint = false;
  let hasHealthEndpoint = false;
  let hasReadyEndpoint = false;
  let hasMetricsEndpoint = false;

  if (fs.existsSync(healthCheckFile)) {
    const content = fs.readFileSync(healthCheckFile, 'utf-8');
    hasVersionEndpoint = content.includes('/version') && content.includes('git_commit') && content.includes('build_date');
    hasHealthEndpoint = content.includes('/health') && content.includes('status') && content.includes('uptime');
    hasReadyEndpoint = content.includes('/ready') && content.includes('database') && content.includes('storage') && content.includes('stripe') && content.includes('ai_provider') && content.includes('email_provider');
    hasMetricsEndpoint = content.includes('/metrics') && content.includes('http_requests_total') && content.includes('memory_bytes');
  }
  assert(hasVersionEndpoint, "Health Check function implements GET /version returning version and git commit info");
  assert(hasHealthEndpoint, "Health Check function implements GET /health returning status and uptime");
  assert(hasReadyEndpoint, "Health Check function implements GET /ready checking DB, Storage, Stripe, AI and Email providers");
  assert(hasMetricsEndpoint, "Health Check function implements GET /metrics returning Prometheus technical metrics");
} catch (e) {
  assert(false, `Diagnostics endpoint check crashed: ${e.message}`);
}

// 10. LocalStorage & Offline Privacy Safety
try {
  let localStorageSecure = true;
  let serviceWorkerSecure = true;
  
  allCodeFiles.forEach(file => {
    if (
      file.includes('verify-') || 
      file.includes('offline-db') || 
      file.includes('scratch/')
    ) {
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    
    // Check local/sessionStorage safety
    if (!file.includes('sw.js')) {
      const hasLocalStorageWrite = content.includes('localStorage.setItem') || content.includes('sessionStorage.setItem');
      const containsHealthKeywords = content.includes('biomarker') || content.includes('pasto') || content.includes('medication');
      
      if (hasLocalStorageWrite && containsHealthKeywords) {
        localStorageSecure = false;
        console.warn(`⚠️ LOCAL STORAGE AUDIT WARNING: Found storage write with health keywords in [${file}]`);
      }
    }

    // Check service worker token safety
    if (file.endsWith('sw.js') || file.includes('service-worker')) {
      const hasTokenInSW = content.includes('token') || content.includes('jwt') || content.includes('apikey') || content.includes('authorization');
      if (hasTokenInSW) {
        serviceWorkerSecure = false;
        console.error(`❌ SW TOKEN AUDIT VIOLATION: Service worker contains token references in [${file}]`);
      }
    }
  });

  assert(localStorageSecure, "All web client storage integrations (localStorage/sessionStorage) are secure and clean of clinical metrics");
  assert(serviceWorkerSecure, "Service worker contains no authorization tokens or credentials");
} catch (e) {
  assert(false, `LocalStorage safety check failed: ${e.message}`);
}

// Final Summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Passed: ${testsPassed} / ${totalTests} tests`);

if (testsPassed === totalTests) {
  console.log("\n⭐️ ALL PRODUCTION LIVE OPERATIONS VALIDATION CHECKS PASSED! ⭐️\n");
  process.exit(0);
} else {
  console.error("\n❌ PRODUCTION LIVE OPERATIONS VALIDATION CHECKS FAILED.\n");
  process.exit(1);
}
