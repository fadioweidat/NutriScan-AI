# Registro dei Cambiamenti (Changelog) - NutriScan AI

Tutti i cambiamenti significativi a questo progetto saranno documentati in questo file. Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) e questo progetto aderisce a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-21 (Rilascio Commerciale & SaaS Launch)

### Aggiunto
- **Landing Page Commerciale (`LandingPage.jsx`)**: Pagina principale per utenti non autenticati con pricing grid (Free, Pro, Premium), FAQ espandibili e contact form.
- **Modulo di Abbonamento (`subscription-manager.js`)**: Feature flag centralizzate per limitare le funzioni degli utenti Free (limite a 3 OCR/giorno, 5 chat/giorno, 1 giorno di meal planner) e sbloccare Pro/Premium.
- **Billing UI & Stripe Simulator (`stripe-simulator.js`, `BillingSettings.jsx`)**: Sezione del profilo utente per la gestione simulata degli abbonamenti (mensile, annuale, trial) con portale di disdetta.
- **Admin Console (`AdminConsoleCard.jsx`)**: Telemetria amministrativa aggregata con grafici sui consumi (AI/OCR/Storage), utenti per piano e toggles di emergenza per abilitare/disabilitare i moduli in-memory.
- **Analytics Privacy-Friendly (`analytics-manager.js`)**: Tracciamento delle azioni non sensibili (onboarding, passaggi di fatturazione, apertura pagine) con esclusione totale dei dati sanitari.
- **Email Templates (`email-templates.js`)**: Modelli HTML responsive per l'onboarding e la gestione transazionale (Welcome, Reset Password, Trial Ending, ecc.).
- **Recupero Password**: Aggiunta la modalità "password dimenticata" nella schermata di accesso e la rotta dedicata `/reset-password` per impostare nuove credenziali.
- **Test Suite di Validazione SaaS (`verify-saas.js`)**: Script programmatico di test che valida tutte le limitazioni dei piani, la sanitizzazione degli analytics, delle email e la sicurezza dei dati.

---

## [0.9.0] - 2026-06-21 (Enterprise Governance & Sicurezza)

### Aggiunto
- Centralizzazione del logger sanitizzato client-side (`client-logger.js`) e server-side (`server-logger.ts`).
- Filtro per la rimozione automatica di PII, credenziali JWT e dati clinici (`log-sanitizer.js`) con hash SHA-256 dell'identificatore utente.
- Sistemi di Rate Limiting sul client (click locks e query cooldowns) e sliding window sul server.
- Monitoraggio degli errori ed exponential backoff con jitter per le chiamate di rete.
- Validatori automatici per l'integrità dei backup e la conformità delle intestazioni di sicurezza (CSP, HSTS).
- Widget di telemetria amministrativa (`SystemStatusCard.jsx`) integrato in fondo alla dashboard.

### Corretto
- Errori del linter ESLint `no-useless-assignment` in `system-health-engine.js`.
- Risolto crash dei test in ambiente Node.js isolando l'uso di `import.meta.env` non supportato nativamente.

---

## [0.8.0] - 2026-06-21 (Wearables & Connected Health)

### Aggiunto
- Manager di connessione ai sensori indotti (`health-provider-manager.js`) per Google Fit, Apple Health, Fitbit, ecc.
- 4 motori di analisi: Recovery (sleep debt), Activity Intelligence (hydration alerts), Heart (HRV stress dominance) e Weight.
- 5 nuovi widget UI interattivi inseriti nella dashboard e selettore multi-metrica dei grafici.
- Cifratura delle credenziali OAuth nel database tramite chiavi server private.

---

## [0.7.0] - 2026-06-21 (Clinical Validation Suite)

### Aggiunto
- Test runner clinico (`verify-clinical-validation.js`) per testare formule matematiche, conformità dei disclaimer medici e tag di accessibilità.
- Rimozione completa di dati sanitari da localStorage/sessionStorage.

---

## [0.6.0] - 2026-06-21 (Preventive Intelligence & Digital Twin)

### Aggiunto
- Digital Twin Engine per l'aggregazione dei profili clinici in memoria.
- Motore di regressione lineare (`forecast-engine.js`) per le proiezioni a 60 giorni dei valori ematici.
- Simulatore What-If di stile di vita e deficiency prediction engine.

---

## [0.5.0] - 2026-06-21 (Mobile PWA & Offline Queue)

### Aggiunto
- Configurazione Service Worker (`sw.js`) static-only che esclude token JWT e dati delle API Supabase.
- IndexedDB Sync Queue con cifratura client XOR-Base64.
- Notifiche push con promemoria generici non clinici per la lock-screen.

---

## [0.4.0] - 2026-06-20 (Meal Planner & Sostituzioni)

### Aggiunto
- Generatore di piani alimentari settimanali basati su intolleranze e obiettivi.
- Motore di sostituzione ingredienti e unificazione lista della spesa.

---

## [0.3.0] - 2026-06-20 (AI Health Coach 2.0)

### Aggiunto
- Calcolo dell'Health Score giornaliero e priorità del Coach AI derivanti da esami del sangue ed interazioni farmacologiche.

---

## [0.2.0] - 2026-06-20 (Blood Tests & RLS Hardening)

### Aggiunto
- Upload ed estrazione OCR dei referti ematologici in PDF.
- Hardening del database con policy RLS e bucket privati.

---

## [0.1.0] - 2026-06-20 (Core Nutrition Architecture)

### Aggiunto
- Scansione OCR scontrini, normalizzazione cibi e integrazione API USDA e Open Food Facts.
