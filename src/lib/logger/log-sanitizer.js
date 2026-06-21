/**
 * Enterprise Log Sanitizer (Phase 9)
 * Scrubs PII, clinical metrics, cookies, JWTs, and API keys.
 * Anonymizes User IDs using SHA-256.
 */

// Pure JS SHA-256 implementation
export function sha256(ascii) {
  if (!ascii) return '';
  const strVal = String(ascii);
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;

  let result = '';
  const words = [];
  const asciiLength = strVal[lengthProperty] * 8;
  
  const hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = i;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
    }
  }
  
  let formattedAscii = strVal + '\x80';
  while (formattedAscii[lengthProperty] % 64 - 56) formattedAscii += '\x00';
  for (i = 0; i < formattedAscii[lengthProperty]; i++) {
    j = formattedAscii.charCodeAt(i);
    words[i >> 2] |= j << (24 - (i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength);
  
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);
    
    for (i = 0; i < 64; i++) {
      let wItem = w[i];
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + wItem) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.splice(8); // limit size to 8
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    let val = hash[i];
    if (val < 0) val += maxWord;
    let str = val.toString(16);
    while (str[lengthProperty] < 8) str = '0' + str;
    result += str;
  }
  return result;
}

// Patterns to strip
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g;
const JWT_REGEX = /\bey[jJ][a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\b/g;
const BEARER_REGEX = /bearer\s+[a-zA-Z0-9-_.]+/gi;

const SENSITIVE_KEYS = new Set([
  'email', 'phone', 'telefono', 'name', 'surname', 'nome', 'cognome',
  'biomarkers', 'biomarcatori', 'reports', 'referti', 'medications', 'farmaci',
  'meals', 'pasti', 'conditions', 'patologie', 'allergie', 'intolerances', 'intolleranze',
  'sleep_logs', 'stress_logs', 'hydration_logs', 'activity_logs', 'blood_test_reports', 'meal_entries',
  'jwt', 'cookie', 'authorization', 'bearer', 'token', 'password', 'apikey', 'key', 'secret',
  'openai_api_key', 'supabase_service_role_key', 'service_role_key'
]);

function sanitizeString(str) {
  if (!str) return '';
  let cleaned = str;
  cleaned = cleaned.replace(EMAIL_REGEX, '[EMAIL_SCRUBBED]');
  cleaned = cleaned.replace(PHONE_REGEX, '[PHONE_SCRUBBED]');
  cleaned = cleaned.replace(JWT_REGEX, '[JWT_SCRUBBED]');
  cleaned = cleaned.replace(BEARER_REGEX, '[AUTH_SCRUBBED]');
  return cleaned;
}

export function sanitize(data) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  if (typeof data === 'object') {
    const cleanedObj = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Anonymize user_id, userId, etc.
      if (lowerKey === 'user_id' || lowerKey === 'userid') {
        cleanedObj[key] = value ? sha256(value) : null;
        continue;
      }

      if (SENSITIVE_KEYS.has(lowerKey)) {
        if (lowerKey === 'email') {
          cleanedObj[key] = '[EMAIL_SCRUBBED]';
        } else if (lowerKey === 'phone' || lowerKey === 'telefono') {
          cleanedObj[key] = '[PHONE_SCRUBBED]';
        } else if (
          lowerKey === 'jwt' || 
          lowerKey === 'token' || 
          lowerKey === 'cookie' || 
          lowerKey === 'authorization' || 
          lowerKey === 'password' || 
          lowerKey === 'apikey' || 
          lowerKey === 'key' || 
          lowerKey === 'secret' ||
          lowerKey === 'openai_api_key' ||
          lowerKey === 'supabase_service_role_key' ||
          lowerKey === 'service_role_key'
        ) {
          cleanedObj[key] = '[JWT_SCRUBBED]';
        } else {
          cleanedObj[key] = '[SENSITIVE_DATA_SCRUBBED]';
        }
      } else {
        cleanedObj[key] = sanitize(value);
      }
    }
    return cleanedObj;
  }

  return data;
}

export default {
  sha256,
  sanitize
};
