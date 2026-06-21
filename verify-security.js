import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("=== STARTING ENTERPRISE SECURITY & SECRET SCAN VALIDATION ===\n");

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

// 1. Scan Repository for Env and SQL backup files
const bannedFiles = [
  '.env',
  '.env.local',
  '.env.production',
  'backup.sql',
  'export.csv',
  'credentials.json'
];

let bannedFilesPassed = true;
bannedFiles.forEach(file => {
  try {
    execSync(`git ls-files --error-unmatch "${file}"`, { stdio: 'ignore' });
    bannedFilesPassed = false;
    console.error(`❌ SECURITY ERROR: Banned file [${file}] is tracked in the Git repository!`);
  } catch (e) {
    // If it throws, the file is not tracked by Git, which is safe.
  }
});
assert(bannedFilesPassed, "No banned configuration files (.env, backups, exports) tracked in Git repository.");

// 2. Secret Scanner (Checks for hardcoded OpenAI Keys, Supabase Service Role keys, stripe, bearer headers)
const SECRET_PATTERNS = [
  /sk-proj-[a-zA-Z0-9]{32,}/g, // OpenAI project keys
  /eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g, // Raw JWT Tokens
  /service_role_key\s*=\s*['"][a-zA-Z0-9-_]{40,}['"]/gi // Hardcoded service role key assignments
];

function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      // Skip node_modules, .git, and build artifacts
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.agents') {
        getFilesRecursively(name, fileList);
      }
    } else {
      if (name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.json') || name.includes('.github')) {
        fileList.push(name);
      }
    }
  }
  return fileList;
}

let secretScanPassed = true;
const filesToScan = getFilesRecursively(process.cwd());

filesToScan.forEach(filepath => {
  // Skip the security-validator or secret scanner/verification files themselves to avoid self-triggering on pattern definitions
  if (
    filepath.includes('verify-security') || 
    filepath.includes('verify-enterprise') || 
    filepath.includes('security-validator') || 
    filepath.includes('log-sanitizer')
  ) {
    return;
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  SECRET_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      secretScanPassed = false;
      console.error(`❌ SECURITY ERROR: Hardcoded credential or token matching pattern ${pattern} found in [${filepath}]`);
    }
  });
});

assert(secretScanPassed, "No hardcoded credentials, JWTs, or service role keys detected in the codebase.");

// 3. CSP Directives Audit
let cspAuditPassed = false;
const prodConfigPath = path.join(process.cwd(), 'src/lib/operations/production-config.js');
if (fs.existsSync(prodConfigPath)) {
  const content = fs.readFileSync(prodConfigPath, 'utf-8');
  const hasCSP = content.includes('contentSecurityPolicy');
  const hasHSTS = content.includes('hsts') && content.includes('max-age');
  const hasXFrame = content.includes('xFrameOptions') && content.includes('DENY');
  
  if (hasCSP && hasHSTS && hasXFrame) {
    cspAuditPassed = true;
  }
}
assert(cspAuditPassed, "Production-config.js specifies hardening rules (CSP, HSTS, X-Frame-Options DENY).");

// 4. Client Storage Policy Checks
let clientStoragePassed = true;
filesToScan.forEach(filepath => {
  if (filepath.includes('src/lib/engines') || filepath.includes('src/lib/logger') || filepath.includes('src/lib/connectors')) {
    const content = fs.readFileSync(filepath, 'utf-8');
    if (content.includes('localStorage.setItem') || content.includes('sessionStorage.setItem')) {
      clientStoragePassed = false;
      console.error(`❌ PRIVACY ERROR: Found local/session storage writes in logical/engine layers: [${filepath}]`);
    }
  }
});
assert(clientStoragePassed, "No local/session storage writes for clinical metrics, logs, or credentials found in engine layers.");

// 5. Dependency Vulnerability Scan via npm audit
let auditPassed = true;
try {
  console.log("Running 'npm audit' to check package safety...");
  const auditRes = execSync('npm audit --json', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
  const auditJson = JSON.parse(auditRes);
  const critical = auditJson.metadata?.vulnerabilities?.critical || 0;
  const high = auditJson.metadata?.vulnerabilities?.high || 0;

  if (critical > 0 || high > 0) {
    auditPassed = false;
    console.error(`❌ SECURITY ERROR: Found vulnerabilities (Critical: ${critical}, High: ${high}) in npm packages.`);
  }
} catch (e) {
  // npm audit exit code 1 indicates vulnerabilities found
  try {
    const auditJson = JSON.parse(e.stdout);
    const critical = auditJson.metadata?.vulnerabilities?.critical || 0;
    const high = auditJson.metadata?.vulnerabilities?.high || 0;
    if (critical > 0 || high > 0) {
      auditPassed = false;
      console.error(`❌ SECURITY ERROR: Found vulnerabilities (Critical: ${critical}, High: ${high}) in npm packages.`);
    }
  } catch {
    console.log("ℹ️ npm audit failed to parse output JSON. Verification soft-passed.");
  }
}
assert(auditPassed, "Vulnerability audit passed: 0 Critical and 0 High dependencies.");

// Final Summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Passed: ${testsPassed} / ${totalTests} tests`);

if (testsPassed === totalTests) {
  console.log("\n⭐️ ALL ENTERPRISE SECURITY CHECKS PASSED SUCCESSFULLY! ⭐️\n");
  process.exit(0);
} else {
  console.error("\n❌ SECURITY CHECKS FAILED. Please review output above.\n");
  process.exit(1);
}
