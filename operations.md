# Manuale delle Operazioni di Produzione - NutriScan AI

Questo manuale descrive la governance delle operazioni, le metriche di monitoraggio e la gestione dei log e degli errori in produzione per NutriScan AI.

---

## 1. Monitoraggio dello Stato di Salute del Sistema

NutriScan AI implementa un motore diagnostico in tempo reale (`system-health-engine.js`) che valuta lo stato operativo e la latenza dei componenti chiave del sistema.

### Componenti Monitorati
Le seguenti metriche vengono stimate in-memory e categorizzate in base a soglie di latenza:

- **Supabase / Database**:
  - OK: latenza < 250ms
  - Warning: latenza 250ms - 800ms
  - Critical: latenza > 800ms o connessione fallita.
- **Edge Functions**:
  - OK: latenza < 400ms
  - Warning: latenza 400ms - 1000ms
  - Critical: latenza > 1000ms o timeout.
- **Storage / Bucket**: Latenza di risposta per il caricamento/scaricamento dei file PDF dei referti.
- **OCR Ingestion**: Latenza media per l'estrazione OCR del testo dagli esami del sangue o dagli scontrini dei pasti.
- **AI Engine (GPT-4o)**: Tempo di generazione della risposta per l'AI Coach.
- **Offline Queue**: Stato della connessione IndexedDB e della coda di sincronizzazione locale pendente.
- **PWA (Service Worker)**: Stato di attivazione del Service Worker per la cache offline delle risorse statiche dell'applicazione.

---

## 2. Dashboard di Telemetria Amministrativa

Per gli amministratori della piattaforma, la dashboard principale (`DashboardPage.jsx`) include un widget di stato amministrativo (`SystemStatusCard.jsx`) posizionato a fondo pagina.
- **Visualizzazione**: Mostra le metriche in tempo reale calcolate dal client-health-engine con badge colorati in base allo stato (`OK` in verde, `Warning` in arancione, `Critical` in rosso).
- **Tracciabilità**: Permette di diagnosticare problemi di rete lato utente o congestione dei server Supabase senza dover ispezionare le console del browser o i log remoti.

---

## 3. Gestione e Livelli di Logging (Sanitized Logs)

La politica di logging distingue nettamente tra eventi client-side ed eventi server-side, garantendo la rimozione automatica di dati sanitari o credenziali sensibili prima del salvataggio.

### Client Logger (`client-logger.js`)
Gestisce esclusivamente eventi non sensibili relativi all'interfaccia utente:
- **DEBUG**: Dettagli approfonditi per sviluppo (esclusi in produzione).
- **INFO**: Log di navigazione, rendering e caricamento componenti.
- **WARNING**: Problemi minori (es. rallentamenti, avvisi PWA, retry).
- **ERROR**: Eccezioni non bloccanti o fallimenti temporanei dell'API.
- **CRITICAL**: Errori critici che compromettono l'usabilità dell'applicazione.

### Server Logger (`server-logger.ts`)
Utilizzato all'interno delle Edge Functions Supabase per auditare le richieste e tracciare le performance:
- Associa un **Correlation ID** a ogni flusso di chiamata.
- Traccia la latenza e gli endpoint chiamati.
- **Mai** scrivere informazioni cliniche, pasti o token d'accesso nei file di log del server.

---

## 4. Gestione degli Errori e Retry (Error Monitor)

Il sistema di monitoraggio degli errori distingue i comportamenti in base alla tipologia di fallimento:

- **Errori di Rete (Retryable)**:
  - Errori HTTP di rete, fetch non riusciti o conflitti dovuti all'offline del dispositivo vengono intercettati dal client error monitor (`error-monitor-client.js`).
  - Il sistema attiva un **backoff esponenziale con jitter** (ritardo progressivamente raddoppiato più una variazione casuale per evitare congestioni) che esegue fino a 5 tentativi prima di notificare l'utente con un messaggio amichevole ed educativo.
- **Errori Logici / Eccezioni UI (Non-Retryable)**:
  - Errori di null pointer o logiche JS errate vengono catturati dall'**ErrorBoundary** globale per prevenire il blocco completo dello schermo. Mostrano una schermata di ripristino sicura senza attivare retry automatici inutili.
