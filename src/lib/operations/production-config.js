/**
 * Production Configuration Manager (Phase 9)
 * Governs enterprise operational parameters, timeouts, retries, headers, and feature flags.
 */
const IS_PROD = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.PROD : false;

export const ProductionConfig = {
  // Environment flags
  isProduction: IS_PROD,
  debugMode: !IS_PROD,

  // Network timeouts and retry protocols
  network: {
    timeoutMs: IS_PROD ? 8000 : 15000,
    maxRetries: 3,
    backoffBaseMs: 1000
  },

  // Storage and OCR limits
  ocr: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    timeoutMs: 12000
  },

  // AI client settings
  ai: {
    timeoutMs: 15000,
    maxTokens: 500,
    temperature: 0.3
  },

  // HTTP Header templates
  headers: {
    contentSecurityPolicy: "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.openai.com; img-src 'self' data: https://*.supabase.co; script-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
    hsts: "max-age=63072000; includeSubDomains; preload",
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    secureCookies: true,
    httpsOnly: true,
    cookiePolicy: "Secure; SameSite=Strict; HttpOnly"
  },

  // Caching configuration
  cache: {
    staticAssetsMaxAgeSeconds: 31536000, // 1 year for SW caching
    clinicalDataTTLSeconds: 0 // Do not cache clinical data
  },

  // Governance feature flags
  features: {
    enableWearablesSync: true,
    enableDigitalTwinSimulation: true,
    enableAuditLogging: true,
    strictPrivacyConsent: true
  }
};

export default ProductionConfig;
