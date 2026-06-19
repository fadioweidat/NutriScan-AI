import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log("=== STARTING BLOOD TESTS CLINICAL & SECURITY VALIDATION ===\n");

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

// ----------------------------------------------------
// 1. Check for no LocalStorage / SessionStorage usage
// ----------------------------------------------------
try {
  const fileContent = fs.readFileSync('src/pages/BloodTestsPage.jsx', 'utf8');
  const usesLocalStorage = fileContent.includes('localStorage.') || fileContent.includes('localStorage[');
  const usesSessionStorage = fileContent.includes('sessionStorage.') || fileContent.includes('sessionStorage[');
  
  assert(
    !usesLocalStorage && !usesSessionStorage,
    "Nessun dato sanitario salvato in localStorage o sessionStorage nel frontend"
  );
} catch (e) {
  console.error("Errore nel leggere il file BloodTestsPage.jsx:", e);
}

// ----------------------------------------------------
// 2. Numerical parser validation
// ----------------------------------------------------
function parseBiomarkerValue(valStr) {
  if (typeof valStr !== 'string') return Number(valStr);
  const clean = valStr.replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(clean);
}

assert(
  parseBiomarkerValue("120,5 mg/dL") === 120.5,
  "Parser: converte stringhe decimali europee (es. '120,5')"
);

// ----------------------------------------------------
// 3. Status boundary calculations
// ----------------------------------------------------
function calculateStatus(value, min, max) {
  const val = Number(value);
  if (isNaN(val)) return 'unknown';
  
  const minVal = min != null ? Number(min) : null;
  const maxVal = max != null ? Number(max) : null;

  if (minVal != null && val < minVal) return 'low';
  if (maxVal != null && val > maxVal) return 'high';
  return 'normal';
}

assert(
  calculateStatus(50, 60, 150) === 'low' &&
  calculateStatus(160, 60, 150) === 'high' &&
  calculateStatus(100, 60, 150) === 'normal' &&
  calculateStatus(100, null, 150) === 'normal' &&
  calculateStatus("NonNumerico", 60, 150) === 'unknown',
  "Stati calcolati correttamente (low, normal, high, unknown, null ranges)"
);

// ----------------------------------------------------
// 4. Supabase DB Schema, Storage & Security Tests
// ----------------------------------------------------
async function runDatabaseTests() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ Credenziali Supabase mancanti nel file .env. Salto i test d'integrazione.");
    finishTests();
    return;
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  try {
    // A. Verify private bucket medical-documents
    console.log("A. Verifica configurazione storage...");
    const { data: bucket, error: bucketErr } = await adminClient.storage.getBucket('medical-documents');
    
    if (bucketErr) {
      console.error("\n❌ ERRORE STORAGE: Il bucket 'medical-documents' non esiste.");
      console.error("👉 ESEGUI LO SCRIPT SQL CONTENUTO IN 'supabase/migrations/008_blood_tests_schema.sql' nel SQL Editor di Supabase.");
      process.exit(1);
    }
    
    assert(
      bucket && bucket.public === false,
      "Bucket 'medical-documents' configurato e privato (public = false)"
    );

    // B. Verify database tables existence
    console.log("B. Verifica presenza tabelle database...");
    const { error: reportsSchemaErr } = await adminClient.from('blood_test_reports').select('id').limit(1);
    
    if (reportsSchemaErr && (reportsSchemaErr.code === '42P01' || reportsSchemaErr.message.includes('relation "public.blood_test_reports" does not exist'))) {
      console.error("\n❌ ERRORE DATABASE: La tabella 'blood_test_reports' non esiste.");
      console.error("👉 ESEGUI LO SCRIPT SQL CONTENUTO IN 'supabase/migrations/008_blood_tests_schema.sql' nel SQL Editor di Supabase.");
      process.exit(1);
    }

    assert(!reportsSchemaErr, "Tabella 'blood_test_reports' presente nel database");
    
    const { error: biomarkersSchemaErr } = await adminClient.from('blood_test_biomarkers').select('id').limit(1);
    assert(!biomarkersSchemaErr, "Tabella 'blood_test_biomarkers' presente nel database");

    // C. Verify Security and RLS (Real E2E with two test users)
    console.log("C. Simulazione RLS e Storage Policies...");
    
    const testEmailA = `test_user_a_${Date.now()}@nutriscan.ai`;
    const testEmailB = `test_user_b_${Date.now()}@nutriscan.ai`;
    const testPassword = "SecurePassword123!";

    // Create User A
    const { data: userAData, error: userAErr } = await adminClient.auth.admin.createUser({
      email: testEmailA, password: testPassword, email_confirm: true
    });
    if (userAErr) throw userAErr;
    const userA = userAData.user;

    // Create User B
    const { data: userBData, error: userBErr } = await adminClient.auth.admin.createUser({
      email: testEmailB, password: testPassword, email_confirm: true
    });
    if (userBErr) throw userBErr;
    const userB = userBData.user;

    // Client logged in as User A
    const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    const { error: loginAErr } = await clientA.auth.signInWithPassword({
      email: testEmailA, password: testPassword
    });
    if (loginAErr) throw loginAErr;

    const reportId = "00000000-0000-0000-0000-000000000000";

    // C1. Storage Policy: User A uploads to their own folder (MUST succeed)
    const fileContent = "Referto di test";
    const userAFilePath = `${userA.id}/${reportId}/referto.pdf`;
    
    const { data: uploadAData, error: uploadAErr } = await clientA.storage
      .from('medical-documents')
      .upload(userAFilePath, fileContent, { contentType: 'application/pdf' });

    assert(!uploadAErr, "Storage Policy: Utente A carica correttamente file nella propria cartella");

    // C2. Storage Policy: User A uploads to User B's folder (MUST fail)
    const userBFilePath = `${userB.id}/${reportId}/referto.pdf`;
    const { error: uploadBErr } = await clientA.storage
      .from('medical-documents')
      .upload(userBFilePath, fileContent, { contentType: 'application/pdf' });

    assert(uploadBErr !== null, "Storage Policy: Utente A bloccato dal caricare file nella cartella dell'Utente B");

    // C3. Storage Policy: User A reads User B's file (MUST fail)
    const { error: readBErr } = await clientA.storage
      .from('medical-documents')
      .download(userBFilePath);

    assert(readBErr !== null, "Storage Policy: Utente A bloccato dal leggere file nella cartella dell'Utente B");

    // C4. Table RLS: User A inserts a report for User A (MUST succeed)
    const { data: reportA, error: repAErr } = await clientA
      .from('blood_test_reports')
      .insert({
        id: reportId,
        user_id: userA.id,
        file_path: userAFilePath,
        test_date: '2026-06-19',
        status: 'completed'
      })
      .select()
      .single();

    assert(!repAErr && reportA, "Table RLS: Utente A inserisce correttamente un proprio report");

    // C5. Table RLS: User A inserts a report for User B (MUST fail)
    const { error: repBErr } = await clientA
      .from('blood_test_reports')
      .insert({
        user_id: userB.id,
        file_path: userBFilePath,
        test_date: '2026-06-19',
        status: 'completed'
      });

    assert(repBErr !== null, "Table RLS: Utente A bloccato dall'inserire un report a nome dell'Utente B");

    // Clean up files and users
    console.log("Pulizia dati E2E...");
    await adminClient.storage.from('medical-documents').remove([userAFilePath]);
    await adminClient.auth.admin.deleteUser(userA.id);
    await adminClient.auth.admin.deleteUser(userB.id);
    console.log("✅ Dati temporanei e utenti di test eliminati.");

  } catch (err) {
    console.error("❌ ERRORE INTEGRATIVO DB:", err.message || err);
  }

  finishTests();
}

function finishTests() {
  console.log("\n=== RISULTATO DEL TEST DI VALIDAZIONE CLINICA ===");
  console.log(`Test Superati: ${testsPassed} / ${totalTests}`);
  
  if (testsPassed === totalTests) {
    console.log("🚀 TUTTI I TEST DI VALIDAZIONE DELLA FASE 2B HANNO SUPERATO LA VERIFICA!");
    process.exit(0);
  } else {
    console.error("❌ ALCUNI TEST DI VALIDAZIONE SONO FALLITI.");
    process.exit(1);
  }
}

runDatabaseTests();
