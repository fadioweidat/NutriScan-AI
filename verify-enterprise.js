import fs from 'fs';
import path from 'path';
import clientLogger from './src/lib/logger/client-logger.js';
import logSanitizer, { sha256 } from './src/lib/logger/log-sanitizer.js';
import errorMonitorClient from './src/lib/logger/error-monitor-client.js';
import rateLimitManager from './src/lib/operations/rate-limit-manager.js';
import ProductionConfig from './src/lib/operations/production-config.js';
import healthEngine from './src/lib/operations/system-health-engine.js';
import { validateBackups } from './src/lib/operations/backup-validator.js';
import { runSecurityChecks } from './src/lib/operations/security-validator.js';

console.log("=== STARTING CORE ENTERPRISE INTEGRATION VALIDATION ===\n");

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

// 1. Verify Client Logger and Log Sanitizer
try {
  const sensitivePayload = {
    userId: 'user-456-secret-id',
    email: 'test@example.com',
    biomarkers: [{ name: 'ferro', value: 12 }],
    medications: ['aspirina'],
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    regularField: 'clear-data'
  };

  const sanitized = logSanitizer.sanitize(sensitivePayload);

  assert(sanitized.email === '[EMAIL_SCRUBBED]', "PII (email) successfully scrubbed");
  assert(sanitized.biomarkers === '[SENSITIVE_DATA_SCRUBBED]', "Clinical metrics (biomarkers) successfully scrubbed");
  assert(sanitized.medications === '[SENSITIVE_DATA_SCRUBBED]', "Medications successfully scrubbed");
  assert(sanitized.jwt === '[SENSITIVE_DATA_SCRUBBED]' || sanitized.jwt === '[JWT_SCRUBBED]', "OAuth credentials (JWTs) successfully scrubbed");
  assert(sanitized.userId === sha256('user-456-secret-id'), "User ID anonymized via custom SHA-256 hash");
  assert(sanitized.regularField === 'clear-data', "Regular log fields remain intact");

  clientLogger.info('TEST_SUITE', 'Log di prova', sensitivePayload);
  const logs = clientLogger.getLogs();
  const latestLog = logs[logs.length - 1];
  assert(latestLog.message === 'Log di prova', "Message successfully compiled in logs queue");
  assert(latestLog.data.email === '[EMAIL_SCRUBBED]', "Logged data is fully sanitized before storage");
} catch (e) {
  assert(false, `Logger/sanitizer test crashed: ${e.message}`);
}

// 2. Verify Client Error Monitor
try {
  const result = errorMonitorClient.handleError(new Error("Network connection timeout"), 'TEST_MONITOR', { extra: 'context' });
  assert(result.friendlyMessage.includes("connessione"), "Returned customer-friendly error message for network timeout");
  assert(result.retryable === true, "Marked network connection error as retryable");

  const normalErr = errorMonitorClient.handleError(new Error("NullPointerException"), 'TEST_MONITOR');
  assert(normalErr.retryable === false, "Standard UI exceptions marked as non-retryable");
} catch (e) {
  assert(false, `Error monitor test crashed: ${e.message}`);
}

// 3. Verify Client Rate Limiter
try {
  // Test click lock
  const firstClick = rateLimitManager.acquireClickLock('button-1', 500);
  const secondClick = rateLimitManager.acquireClickLock('button-1', 500);
  assert(firstClick === true, "Acquired first click lock");
  assert(secondClick === false, "Blocked immediate secondary double-click within lock window");

  // Test cooldown limit
  const limit1 = rateLimitManager.checkLimit('/api/ai', 1000);
  const limit2 = rateLimitManager.checkLimit('/api/ai', 1000);
  assert(limit1 === true, "Allowed initial rate limit query");
  assert(limit2 === false, "Rate limited secondary query within cooldown window");
} catch (e) {
  assert(false, `Rate limiter test crashed: ${e.message}`);
}

// 4. Verify Backup Validator
try {
  const backupRes = validateBackups();
  assert(backupRes.success === true, "Backup validator audits retention policies and integrity checks successfully");
  assert(backupRes.reports.some(r => r.type === 'db_retention'), "Audited database backup retention config");
  assert(backupRes.reports.some(r => r.type === 'restore_simulation'), "Successfully ran mock backup restore simulation");
} catch (e) {
  assert(false, `Backup validator test crashed: ${e.message}`);
}

// 5. Verify Security Validator
try {
  const secRes = runSecurityChecks();
  assert(secRes.success === true, "Security validator audits headers, SSL, and CSP successfully");
  assert(secRes.reports.some(r => r.type === 'csp_headers'), "Validated Content-Security-Policy (CSP) headers");
  assert(secRes.reports.some(r => r.type === 'hsts_header'), "Validated Strict-Transport-Security (HSTS) headers");
} catch (e) {
  assert(false, `Security validator test crashed: ${e.message}`);
}

// 6. Verify Server-Side Components Exist in functions directory
const serverFiles = [
  'supabase/functions/_shared/server-logger.ts',
  'supabase/functions/_shared/error-monitor-server.ts',
  'supabase/functions/_shared/audit-engine.ts',
  'supabase/functions/_shared/rate-limit.ts'
];

serverFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  assert(fs.existsSync(filePath), `Server-side operational module [${file}] exists in Edge Functions`);
});

// Final Summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Passed: ${testsPassed} / ${totalTests} tests`);

if (testsPassed === totalTests) {
  console.log("\n⭐️ ALL ENTERPRISE GOVERNANCE TESTS PASSED SUCCESSFULLY! ⭐️\n");
  process.exit(0);
} else {
  console.error("\n❌ ENTERPRISE GOVERNANCE TESTS FAILED. Please review output above.\n");
  process.exit(1);
}
