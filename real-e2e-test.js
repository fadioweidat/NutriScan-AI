import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Carichiamo le variabili d'ambiente manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Mancano le credenziali Supabase nel file .env");
  process.exit(1);
}

// Client con privilegi di admin (per creare l'utente test)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Client normale (anon) per testare l'RLS
const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runEndToEndTest() {
  console.log("=== STARTING REAL E2E SUPABASE TEST ===\n");
  
  const testEmail = `test_e2e_${Date.now()}@nutriscan.ai`;
  const testPassword = "SuperSecurePassword123!";
  let testUserId = null;

  try {
    console.log("1. Creazione Utente di Test Reale...");
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) throw authError;
    testUserId = authData.user.id;
    console.log(`✅ Utente creato con ID: ${testUserId}`);

    console.log("2. Effettuo il Login con il Client Anonimo (Simulazione Frontend)...");
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (signInError) throw signInError;
    console.log("✅ Login effettuato con successo (JWT ottenuto).");

    const today = new Date().toISOString().split('T')[0];

    console.log("\n3. Inserimento dati Lifestyle (Simulazione click su 'Salva Log')...");
    
    // Inseriamo Sonno
    const { error: sleepErr } = await authClient.from('sleep_logs').insert([{ user_id: testUserId, entry_date: today, duration_hours: 7.5, quality_score: 4 }]);
    if (sleepErr) throw sleepErr;
    console.log("✅ sleep_logs salvato: 7.5 ore, qualità 4");

    // Inseriamo Stress
    const { error: stressErr } = await authClient.from('stress_logs').insert([{ user_id: testUserId, entry_date: today, stress_level: 6 }]);
    if (stressErr) throw stressErr;
    console.log("✅ stress_logs salvato: livello 6");

    // Inseriamo Idratazione
    const { error: hydrErr } = await authClient.from('hydration_logs').insert([{ user_id: testUserId, entry_date: today, water_ml: 1500 }]);
    if (hydrErr) throw hydrErr;
    console.log("✅ hydration_logs salvato: 1500 ml");

    // Inseriamo Digestione
    const { error: digErr } = await authClient.from('digestion_logs').insert([{ user_id: testUserId, entry_date: today, quality_score: 5 }]);
    if (digErr) throw digErr;
    console.log("✅ digestion_logs salvato: qualità 5");

    // Inseriamo Attività Fisica
    const { error: actErr } = await authClient.from('activity_logs').insert([{ user_id: testUserId, entry_date: today, activity_type: 'Corsa', duration_minutes: 30 }]);
    if (actErr) throw actErr;
    console.log("✅ activity_logs salvato: Corsa 30 minuti");

    console.log("\n4. Verifica Persistenza (Simulazione Ricaricamento Pagina)...");
    
    const { data: sleepData } = await authClient.from('sleep_logs').select('*').eq('entry_date', today).single();
    const { data: stressData } = await authClient.from('stress_logs').select('*').eq('entry_date', today).single();
    const { data: hydrData } = await authClient.from('hydration_logs').select('*').eq('entry_date', today).single();
    const { data: digData } = await authClient.from('digestion_logs').select('*').eq('entry_date', today).single();
    const { data: actData } = await authClient.from('activity_logs').select('*').eq('entry_date', today);

    if (sleepData && stressData && hydrData && digData && actData.length > 0) {
      console.log("✅ Tutti i dati sono stati recuperati con successo dal database reale.");
      console.log("Dati recuperati (Estratto):", {
        sonno: sleepData.duration_hours,
        stress: stressData.stress_level,
        idratazione: hydrData.water_ml,
        digestione: digData.quality_score,
        attivita: actData[0].activity_type
      });
    } else {
      throw new Error("I dati non corrispondono dopo la lettura.");
    }

    console.log("\n5. Pulizia (Eliminazione Utente di Test)...");
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log("✅ Utente di test eliminato.");

    console.log("\n=== REAL E2E SUPABASE TEST PASSATO CON SUCCESSO ===");

  } catch (err) {
    console.error("❌ ERRORE DURANTE IL TEST:", err.message || err);
    if (testUserId) {
      await adminClient.auth.admin.deleteUser(testUserId);
      console.log("Pulizia d'emergenza eseguita.");
    }
  }
}

runEndToEndTest();
