const ALLOWED_ORIGINS = [
  "https://nutriscan.ai",
  "https://www.nutriscan.ai",
  "http://localhost:5173",
  "http://localhost:3000"
];

/**
 * Generates CORS headers dynamically based on request origin and whitelist.
 * Returns empty Allow-Origin string if origin is blocked.
 */
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  };
}

/**
 * Checks if a given origin is allowed
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}
