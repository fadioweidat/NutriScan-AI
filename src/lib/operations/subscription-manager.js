/**
 * Subscription Manager (Phase 10)
 * Manages central feature flags, tiers, and limits for SaaS plans.
 * 
 * NOTE: The final source of truth for the subscription plan is always managed 
 * server-side by Stripe Webhooks. The client can only read the state of the plan.
 */

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium'
};

export const SubscriptionManager = {
  // Get active tier from user profile metadata
  getUserTier(user) {
    if (!user) return SUBSCRIPTION_TIERS.FREE;
    // Read from user_metadata synced from backend
    return user.user_metadata?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  },

  // Feature Check: Can sync wearables
  canSyncWearables(tier) {
    return tier === SUBSCRIPTION_TIERS.PRO || tier === SUBSCRIPTION_TIERS.PREMIUM;
  },

  // Feature Check: Can use Digital Twin (twin dashboard, predictions, simulations)
  canUseDigitalTwin(tier) {
    return tier === SUBSCRIPTION_TIERS.PREMIUM;
  },

  // Limit Check: Max daily OCR uploads for blood tests or recipes
  getMaxDailyOcrUploads(tier) {
    if (tier === SUBSCRIPTION_TIERS.FREE) return 3;
    return Infinity; // Pro and Premium are unlimited
  },

  // Limit Check: Max daily AI chat prompts
  getMaxDailyAiPrompts(tier) {
    if (tier === SUBSCRIPTION_TIERS.FREE) return 5;
    return Infinity; // Pro and Premium are unlimited
  },

  // Limit Check: Max meal planner visible days (1 day vs 7 days)
  getMaxMealPlannerDays(tier) {
    if (tier === SUBSCRIPTION_TIERS.FREE) return 1;
    return 7; // Pro and Premium get full week
  },

  // Check if client is attempting to modify subscription directly
  assertClientWriteBlock(currentTier, targetTier) {
    if (currentTier !== targetTier) {
      throw new Error("Client write blocked: Subscription tiers can only be modified server-side via Stripe Webhooks.");
    }
    return true;
  }
};

export default SubscriptionManager;
