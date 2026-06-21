# Note di Rilascio (Release Notes) — v1.0.0 stable

Siamo orgogliosi di annunciare il rilascio ufficiale di **NutriScan AI v1.0.0 stable**, la versione commerciale pronta per il lancio pubblico SaaS. 

Questa release trasforma la nostra piattaforma clinica e nutrizionale in un prodotto pronto per il mercato (SaaS Ready), introducendo un piano di abbonamenti (Free, Pro, Premium), la simulazione del billing Stripe, una console di controllo per amministratori, tracciamento telemetrico anonimo, landing page e pieno supporto alle procedure di recupero account.

---

## 🚀 Novità Principali della Versione 1.0.0

### 1. Modulo SaaS & Piani Commerciali (`subscription-manager.js`)
Abbiamo strutturato l'accesso alla piattaforma su tre livelli distinti:
- **Free**: Offre le funzioni base di monitoraggio, limitando le chiamate giornaliere all'AI Coach (max 5/giorno), i caricamenti dei referti (max 3/giorno) e bloccando i wearables o il Digital Twin.
- **Pro**: Rimuove tutti i limiti giornalieri di OCR e AI chat, sblocca il piano alimentare settimanale completo e la sincronizzazione in tempo reale con i sensori dei dispositivi indossabili (wearables).
- **Premium**: Sblocca l'esperienza completa del **Digital Twin**, abilitando il What-If Simulator per le modifiche allo stile di vita e le proiezioni lineari dei biomarcatori a 60 giorni.

### 2. Billing & Stripe Simulator (`stripe-simulator.js`)
L'interfaccia utente include ora una sezione per il billing integrata nel profilo per gestire in modo simulato gli abbonamenti:
- Scelta del piano (Pro / Premium) e dell'intervallo (Mensile / Annuale) con 14 giorni di prova gratuita.
- Flusso simulato di Stripe Checkout e portale di gestione clienti (Stripe Customer Portal) con possibilità di upgrade, downgrade, disdetta e ripristino istantaneo del piano.
- *Nota operativa per produzione*: L'architettura prevede che il client possa solo leggere lo stato dell'abbonamento. L'aggiornamento reale del piano deve avvenire esclusivamente tramite backend server-side in seguito a webhook Stripe firmati e verificati.

### 3. Console di Controllo Amministrativa (`AdminConsoleCard.jsx`)
Gli utenti con privilegi amministrativi possono accedere a una dashboard aggregata (non contenente dati clinici individuali):
- Grafici e riepiloghi degli utenti suddivisi per piano.
- Statistiche aggregate sui consumi (richieste AI inviate, referti caricati, storage consumato).
- Log di audit di sistema e switch in-memory per attivare o disattivare moduli a livello globale.

### 4. Landing Page Commerciale e SEO (`LandingPage.jsx`)
Implementata una pagina di atterraggio dal design premium che accoglie i visitatori non autenticati. Contiene la presentazione delle funzionalità, FAQ dettagliate sui disclaimer medici e l'uso dell'AI, form di contatto per supporto clienti e griglia dei prezzi interattiva.

---

## 🔒 Sicurezza e Trattamento dei Dati (Hardening)

Rispettando i rigidi vincoli di privacy di NutriScan AI:
- **Nessun dato clinico in Analytics/Sentry/Email**: I sistemi di telemetria PostHog (`analytics-manager.js`) e crash reporting Sentry (`error-monitor-client.js`) tracciano esclusivamente eventi tecnici generici (es. caricamento pagina, click checkout), sanitizzando e rimuovendo qualsiasi informazione clinica, contenuto di chat AI o pasto loggato.
- **Email non cliniche**: I template transazionali (`email-templates.js`) per benvenuto, attivazione e reset password non contengono mai riferimenti a dati sanitari dell'utente.

---

## 🛠️ Come Eseguire il Rilascio Locali (Smoke Check)

1. Eseguire l'installazione e l'audit delle dipendenze:
   ```bash
   npm audit
   ```
2. Eseguire la suite di verifica SaaS ed Enterprise:
   ```bash
   node verify-saas.js
   node verify-enterprise.js
   ```
3. Compilare il bundle di produzione:
   ```bash
   npm run build
   ```
