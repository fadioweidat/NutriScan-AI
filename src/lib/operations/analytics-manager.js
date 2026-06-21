/**
 * Privacy-Compliant Analytics Manager (Phase 10)
 * 
 * Enforces strict compliance bounds:
 * - NO tracking of raw health metrics, daily logs, meals, biomarkers, or chat contents.
 * - Only tracks generic SaaS funnel milestones (onboarding, billing, page openings).
 */

const ALLOWED_EVENTS = [
  'onboarding_completed',
  'plan_selected',
  'billing_opened',
  'subscription_changed',
  'ai_chat_opened',
  'meal_planner_opened'
];

const BANNED_KEYS = [
  'biomarkers',
  'meals',
  'pasti',
  'referti',
  'medications',
  'prescriptions',
  'diagnoses',
  'allergies',
  'chat_content',
  'nutrients',
  'blood_tests'
];

export const AnalyticsManager = {
  // Check if properties contain any sensitive medical keys
  isSanitary(properties) {
    if (!properties) return true;
    
    // Check property keys
    const keys = Object.keys(properties).map(k => k.toLowerCase());
    for (const key of keys) {
      if (BANNED_KEYS.some(banned => key.includes(banned))) {
        return false;
      }
    }

    // Check stringified content
    const valuesStr = JSON.stringify(properties).toLowerCase();
    for (const banned of BANNED_KEYS) {
      if (valuesStr.includes(`"${banned}"`) || valuesStr.includes(`:${banned}`)) {
        return false;
      }
    }

    return true;
  },

  track(eventName, properties = {}) {
    // 1. Verify event name is whitelisted
    if (!ALLOWED_EVENTS.includes(eventName)) {
      console.warn(`[Analytics Blocked] Event [${eventName}] is not in the allowed SaaS analytics whitelist.`);
      return { success: false, reason: 'unauthorized_event' };
    }

    // 2. Audit properties for medical/PII leakage
    if (!this.isSanitary(properties)) {
      console.error(`[Analytics Blocked] Event [${eventName}] contains clinical/private payload keys.`);
      throw new Error(`Security Exception: Clinical health metrics cannot be tracked in analytics.`);
    }

    // 3. Log event (Simulated PostHog / privacy-friendly tracker)
    console.log(`[Analytics Event] Tracked: ${eventName}`, properties);

    return {
      success: true,
      eventName,
      properties,
      timestamp: new Date().toISOString()
    };
  }
};

export default AnalyticsManager;
