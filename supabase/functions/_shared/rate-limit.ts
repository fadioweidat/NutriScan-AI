/**
 * Server-Side Rate Limiter (Phase 9)
 * Shared rate limiter for Supabase Edge Functions.
 * Implements sliding window limiting based on IP, user token, or session.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class EdgeRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private storage: Map<string, RateLimitRecord>;

  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.storage = new Map();
  }

  /**
   * Checks request limit status.
   * Returns true if allowed, false if blocked.
   */
  public checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.storage.get(key) || { timestamps: [] };

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter(t => now - t < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const resetTime = oldestTimestamp + this.windowMs;
      
      this.storage.set(key, record);
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }

    record.timestamps.push(now);
    this.storage.set(key, record);

    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetTime: now + this.windowMs
    };
  }

  public clearExpired() {
    const now = Date.now();
    for (const [key, record] of this.storage.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < this.windowMs);
      if (record.timestamps.length === 0) {
        this.storage.delete(key);
      }
    }
  }
}

// Instantiate specific limiters per endpoint type
const limiters: { [key: string]: EdgeRateLimiter } = {
  auth: new EdgeRateLimiter(60000, 5),      // 5 requests/min for Auth operations
  upload: new EdgeRateLimiter(60000, 10),    // 10 requests/min for doc/referto uploads
  ocr: new EdgeRateLimiter(60000, 5),        // 5 requests/min for Blood/Recipe OCR parsing
  ai_chat: new EdgeRateLimiter(60000, 10),   // 10 requests/min for AI chat prompts
  meal_plan: new EdgeRateLimiter(60000, 15)  // 15 requests/min for meal plan generation
};

/**
 * Main server-side rate limit validator
 * Evaluates caller identity based on IP/Token and returns limit status.
 */
export function validateRateLimit(
  endpointType: 'auth' | 'upload' | 'ocr' | 'ai_chat' | 'meal_plan',
  ipAddress: string,
  userToken?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const limiter = limiters[endpointType];
  if (!limiter) {
    return { allowed: true, remaining: 99, resetTime: Date.now() };
  }

  // Key prioritizes Auth token, falls back to IP address
  const clientKey = userToken ? `token_${userToken}` : `ip_${ipAddress}`;
  const key = `${endpointType}:${clientKey}`;

  // Periodically run clean up
  if (Math.random() < 0.1) {
    limiter.clearExpired();
  }

  return limiter.checkLimit(key);
}

export default validateRateLimit;
