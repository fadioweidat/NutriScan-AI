# Politica e Architettura della Privacy - NutriScan AI

NutriScan AI è una piattaforma clinico-nutrizionale orientata all'educazione e alla prevenzione personalizzata. La privacy dei dati sanitari e personali è il pilastro fondante dell'architettura software. Questo documento descrive come vengono gestiti, protetti e isolati i dati degli utenti (Phase 9).

---

## 1. Principi di Trattamento dei Dati

NutriScan AI si conforma ai requisiti del Regolamento Generale sulla Protezione dei Dati (GDPR UE) e si allinea agli standard HIPAA (Health Insurance Portability and Accountability Act) per la gestione sicura dei record sanitari:

- **Liceità e Trasparenza**: L'utente mantiene il controllo assoluto sui propri dati. Nessuna sincronizzazione avviene senza un consenso esplicito preventivo.
- **Minimizzazione dei Dati**: Raccogliamo solo le informazioni strettamente necessarie al calcolo dell'Health Score, alla pianificazione dei pasti e alla previsione di eventuali carenze.
- **Limitazione della Conservazione**: I dati temporanei offline vengono distrutti immediatamente dopo la sincronizzazione riuscita con Supabase.

---

## 2. Restrizioni di Persistenza nel Browser

Per impedire la lettura di dati clinici da parte di script maligni, estensioni del browser non autorizzate o attacchi Cross-Site Scripting (XSS), si applicano le seguenti restrizioni ferree a livello client:

1. **Nessun Dato Clinico in localStorage / sessionStorage**:
   - È severamente vietato salvare referti, valori dei biomarcatori, farmaci prescritti, allergie o pasti loggati all'interno di `localStorage` o `sessionStorage`.
   - Questi dati sono conservati esclusivamente in memoria dinamica (React State) per la durata della sessione e vengono distrutti alla chiusura della scheda del browser.
2. **Esclusioni di Caching del Service Worker**:
   - Il Service Worker cachea esclusivamente file statici dell'applicazione (HTML, CSS, JS, immagini, icone).
   - Tutte le richieste relative alle Edge Functions o a Supabase API (`/auth`, `/rest`, `/storage`) sono escluse per evitare che JWT o dati sanitari vengano scritti in chiaro nella cache del browser.
3. **Coda Offline IndexedDB**:
   - I dati pendenti offline sono minimizzati e offuscati tramite cifratura XOR-Base64 lato client.
   - Gli elementi vengono eliminati automaticamente da IndexedDB subito dopo il completamento della sincronizzazione.

---

## 3. Consenso Informato e Gestione Integrazioni Wearables

L'utente deve poter decidere in modo granulare quali dati condividere con la piattaforma:

- **Consenso sui Dispositivi Indossabili (Wearables)**:
  - Il collegamento a provider come Fitbit, Google Health Connect o Garmin richiede un consenso esplicito e preventivo tramite interfacce dedicate.
  - L'utente può revocare l'accesso in qualsiasi momento dal proprio profilo. In caso di revoca, il modulo di sincronizzazione interrompe immediatamente le chiamate API e pulisce le metriche caricate in memoria.
- **Consenso sui Documenti Medici**:
  - Il caricamento dei PDF dei referti ematologici è facoltativo. L'utente viene informato che i dati estratti tramite OCR saranno utilizzati al solo scopo di calcolare i trend preventivi e non saranno condivisi con terze parti.

---

## 4. Anonimizzazione dei Log e Tracciamento Utenti

Qualsiasi log operazionale generato sia dal client che dal server applica una rigida sanitizzazione:
- **Scrubbing delle PII**: Indirizzi e-mail, nomi ed indirizzi IP vengono mascherati all'origine.
- **Scrubbing Clinico**: I dettagli nutrizionali e i valori dei biomarcatori non vengono mai inseriti nei log.
- **Hashing dell'ID Utente**: L'identificatore univoco dell'utente (`userId`) viene convertito tramite hashing SHA-256 prima della scrittura nei file di log, impedendo la reidentificazione diretta dell'utente in caso di accesso non autorizzato ai log.
