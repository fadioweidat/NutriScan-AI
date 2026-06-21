# Lista di Controllo per il Rilascio (Release Checklist) — v1.0.0

Questo documento elenca i passaggi obbligatori da eseguire prima di promuovere l'applicazione NutriScan AI in ambiente di produzione pubblico.

---

## 🟩 1. Verifiche di Sicurezza e Privilegi (Security Check)

- [ ] **Row Level Security (RLS)**: Verificare che le tabelle `user_profiles`, `blood_test_reports`, `blood_test_biomarkers`, `meal_entries` abbiano RLS attivo (`ENABLE ROW LEVEL SECURITY`) e che nessuna policy consenta letture/scritture cross-user.
- [ ] **Storage Bucket Security**: Verificare che il bucket `medical-documents` sia configurato come privato (`public = false`) e che le policy di lettura/scrittura limitino l'accesso alla sola cartella `/auth.uid()/`.
- [ ] **Secret Scan**: Verificare che nessun file di ambiente `.env` o chiavi private (`service_role`, credenziali OpenAI, credenziali SMTP) siano tracciate nel repository Git.
- [ ] **Dependency Safety**: Eseguire `npm audit` e accertarsi che il report indichi zero vulnerabilità critiche o ad alta priorità.

---

## 🟦 2. Configurazione SaaS & Stripe Webhooks

- [ ] **Configurazione Chiavi Stripe**: Assicurarsi che nel backend di produzione siano impostate le chiavi reali `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
- [ ] **Endpoint Webhook**: Verificare che l'endpoint webhook del backend sia registrato in Stripe e che sia in ascolto dei seguenti eventi:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] **Validazione delle Firme**: Verificare che il codice del server validi la firma del webhook tramite `stripe.webhooks.constructEvent()` per prevenire richieste contraffatte.
- [ ] **Restrizioni Client**: Accertarsi che il codice client legga lo stato dell'abbonamento solo in modalità sola lettura dal token di sessione o dal profilo utente, senza consentire modifiche dirette.

---

## 🟨 3. Integrazione Analytics & Crash Reporting

- [ ] **PostHog / Analytics Privacy**: Verificare che il codice di tracciamento (`analytics-manager.js`) non invii mai parametri come `biomarkers`, `medications`, `meals` o frammenti di testo della chat dell'utente.
- [ ] **Sentry / Crash Reporting**: Verificare che `error-monitor-client.js` implementi il filtro `beforeSend` per ripulire lo stack trace, i contesti e i payload di richiesta/risposta da qualsiasi dato clinico prima dell'invio a Sentry.

---

## 🟧 4. Compilazione e Performance (PWA & Store)

- [ ] **Verifica del Manifest**: Accertarsi che il file `manifest.json` sia valido e che contenga nome, icone PWA, standalone display e orientamento verticale.
- [ ] **Service Worker**: Verificare che `sw.js` cachei correttamente gli asset statici ed escluda rigorosamente qualsiasi chiamata Supabase API o token di autorizzazione.
- [ ] **Build Check**: Compilare il progetto in modalità produzione:
  ```bash
  npm run build
  ```
  Accertarsi che non vengano sollevati warning critici sui bundle size o moduli mancanti.

---

## 🟥 5. Esecuzione Test Finali di Rilascio

Prima di creare il tag di versione, i seguenti comandi devono passare con esito positivo:
- [ ] `npm run lint` (zero warning/errori ESLint)
- [ ] `node verify-saas.js` (validazione dei limiti commerciali e privacy)
- [ ] `node verify-enterprise.js` (validazione logging e sicurezza)
- [ ] `node verify-security.js` (audit di sicurezza dipendenze)
- [ ] `node verify-memory.js` (validazione memory leak)
- [ ] `node verify-clinical-validation.js` (validazione clinica e matematica)
