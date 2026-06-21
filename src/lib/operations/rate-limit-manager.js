/**
 * Client-Side Rate Limit Manager (Phase 9)
 * Protects UX and handles anti-double-click and frontend request spacing.
 */

class RateLimitManager {
  constructor() {
    this.limits = {}; // endpoint -> timestamp
    this.clickLocks = new Set(); // actionId locks
  }

  /**
   * Anti-double-click lock
   * Returns true if lock was successfully acquired, false if already locked.
   */
  acquireClickLock(actionId, durationMs = 1000) {
    if (this.clickLocks.has(actionId)) {
      return false;
    }
    
    this.clickLocks.add(actionId);
    setTimeout(() => {
      this.clickLocks.delete(actionId);
    }, durationMs);
    
    return true;
  }

  /**
   * Standard client spacing rate limiter
   * Returns true if allowed, false if rate limited.
   */
  checkLimit(endpoint, cooldownMs = 1500) {
    const now = Date.now();
    const lastCalled = this.limits[endpoint] || 0;

    if (now - lastCalled < cooldownMs) {
      return false;
    }

    this.limits[endpoint] = now;
    return true;
  }

  clear() {
    this.limits = {};
    this.clickLocks.clear();
  }
}

const rateLimitManager = new RateLimitManager();
export default rateLimitManager;
export { rateLimitManager };
