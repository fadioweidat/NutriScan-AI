import fs from 'fs';
import path from 'path';
import SubscriptionManager, { SUBSCRIPTION_TIERS } from './src/lib/operations/subscription-manager.js';
import AnalyticsManager from './src/lib/operations/analytics-manager.js';
import errorMonitorClient from './src/lib/logger/error-monitor-client.js';
import EmailTemplates from './src/lib/operations/email-templates.js';

console.log("=== STARTING COMMERCIAL SAAS & STORE READY VALIDATION ===\n");

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

// 1. Subscription Tiers & Feature Gates
try {
  // Free tier limits
  assert(SubscriptionManager.getMaxDailyOcrUploads(SUBSCRIPTION_TIERS.FREE) === 3, "Free tier limits OCR uploads to 3");
  assert(SubscriptionManager.getMaxDailyAiPrompts(SUBSCRIPTION_TIERS.FREE) === 5, "Free tier limits AI Chat prompts to 5");
  assert(SubscriptionManager.getMaxMealPlannerDays(SUBSCRIPTION_TIERS.FREE) === 1, "Free tier limits visible Meal Planner to 1 day");

  // Pro tier limits
  assert(SubscriptionManager.getMaxDailyOcrUploads(SUBSCRIPTION_TIERS.PRO) === Infinity, "Pro tier grants unlimited OCR uploads");
  assert(SubscriptionManager.getMaxDailyAiPrompts(SUBSCRIPTION_TIERS.PRO) === Infinity, "Pro tier grants unlimited AI Chat prompts");
  assert(SubscriptionManager.getMaxMealPlannerDays(SUBSCRIPTION_TIERS.PRO) === 7, "Pro tier grants full weekly Meal Planner");
  assert(SubscriptionManager.canSyncWearables(SUBSCRIPTION_TIERS.PRO) === true, "Pro tier sbloocks Wearables synchronization");
  assert(SubscriptionManager.canUseDigitalTwin(SUBSCRIPTION_TIERS.PRO) === false, "Pro tier does NOT allow Digital Twin features");

  // Premium tier limits
  assert(SubscriptionManager.canSyncWearables(SUBSCRIPTION_TIERS.PREMIUM) === true, "Premium tier allows Wearables synchronization");
  assert(SubscriptionManager.canUseDigitalTwin(SUBSCRIPTION_TIERS.PREMIUM) === true, "Premium tier sbloocks Digital Twin simulation and forecasting");
} catch (e) {
  assert(false, `Subscription layer test crashed: ${e.message}`);
}

// 2. Client Write Block Assertions
try {
  let threwWriteError = false;
  try {
    SubscriptionManager.assertClientWriteBlock(SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PRO);
  } catch (err) {
    threwWriteError = err.message.includes("modified server-side");
  }
  assert(threwWriteError === true, "Client side write blocked: direct billing updates throws server-side requirements exception");
} catch (e) {
  assert(false, `Client write check crashed: ${e.message}`);
}

// 3. Analytics Whitelisting and Sanitization
try {
  // Test allowed SaaS event
  const trackAllowed = AnalyticsManager.track('plan_selected', { planName: 'pro', interval: 'annual' });
  assert(trackAllowed.success === true, "Allowed tracking of generic SaaS price selection");

  // Test clinical event tracking block
  let blockedSensitive = false;
  try {
    AnalyticsManager.track('onboarding_completed', { 
      email: 'user@example.com',
      biomarkers: [{ name: 'vitamina_d', value: 12 }]
    });
  } catch (err) {
    blockedSensitive = err.message.includes("Clinical health metrics");
  }
  assert(blockedSensitive === true, "Blocked tracking of health parameters (biomarkers/meals/medications) to analytics");
} catch (e) {
  assert(false, `Analytics test crashed: ${e.message}`);
}

// 4. Sentry Crash Reporter Sanitization
try {
  const sensitiveError = new Error("Failed to load Metformin daily dosages");
  const sensitiveContext = {
    medications: ['Metformin', 'Aspirin'],
    biomarkers: [{ iron: 45 }],
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
  };

  const sentryEvent = errorMonitorClient.sendToSentry(sensitiveError, sensitiveContext);
  assert(sentryEvent.message.includes("dosages") && !sentryEvent.message.includes("Metformin"), "Sentry error message is sanitized");
  assert(sentryEvent.request === undefined, "Scrubbed request context from event payload");
  assert(sentryEvent.user === null, "Scrubbed user PII context from event payload");
} catch (e) {
  assert(false, `Sentry validation crashed: ${e.message}`);
}

// 5. Email Templates Validation
try {
  const welcomeHtml = EmailTemplates.getWelcomeEmail("Mario Rossi");
  const resetHtml = EmailTemplates.getResetPasswordEmail("Mario Rossi", "https://reset");
  const subHtml = EmailTemplates.getSubscriptionConfirmedEmail("Mario Rossi", "premium", "annual");

  const combinedHtmls = welcomeHtml + resetHtml + subHtml;
  const containsClinical = combinedHtmls.includes("biomarker") || combinedHtmls.includes("medication") || combinedHtmls.includes("pasto") || combinedHtmls.includes("ferro");
  
  assert(containsClinical === false, "Email templates contain no clinical, biomarker, or meal-logging data");
} catch (e) {
  assert(false, `Email validation crashed: ${e.message}`);
}

// 6. Verification of Legal, Landing Page, and Admin Components
const requiredFiles = [
  'security.md',
  'deployment.md',
  'operations.md',
  'backup.md',
  'privacy.md',
  'incident-response.md',
  'versioning.md',
  'changelog.md',
  'release-notes.md',
  'release-checklist.md',
  'src/pages/LandingPage.jsx',
  'src/pages/ResetPasswordPage.jsx',
  'src/components/BillingSettings.jsx',
  'src/components/AdminConsoleCard.jsx'
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  assert(fs.existsSync(filePath), `Required release module [${file}] exists in workspace`);
});

// Final Summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Passed: ${testsPassed} / ${totalTests} tests`);

console.log("\n⚠️ Stripe billing architecture notice:");
console.log(`"Billing UI mock / Stripe architecture prepared, not production billing."`);

if (testsPassed === totalTests) {
  console.log("\n⭐️ ALL COMMERCIAL SAAS VALIDATION CHECKS PASSED SUCCESSFULLY! ⭐️\n");
  process.exit(0);
} else {
  console.error("\n❌ COMMERCIAL SAAS VALIDATION CHECKS FAILED. Please review output above.\n");
  process.exit(1);
}
