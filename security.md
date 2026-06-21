# Specifica di Sicurezza ed Enterprise Hardening - NutriScan AI

Questo documento descrive le misure di sicurezza, le politiche e l'architettura di hardening implementate per proteggere l'integrità dei dati e la privacy degli utenti in NutriScan AI in conformità con i requisiti aziendali (Phase 9).

---

## 1. Modello di Autenticazione e Autorizzazione

NutriScan AI utilizza **Supabase Auth** con token JWT (JSON Web Tokens) scambiati tramite canali cifrati HTTPS. 

### Row Level Security (RLS) nel Database
Il database relazionale Supabase applica una politica di sicurezza a livello di riga (RLS) su tutte le tabelle per isolare i record degli utenti:
- **Politica Standard**: Ciascun utente autenticato può accedere esclusivamente ai record il cui campo `user_id` corrisponde esattamente al proprio `auth.uid()`.
- **Politica di Inserimento**: L'inserimento di record è consentito solo se il `user_id` inserito coincide con l'identificatore dell'utente autenticato ricavato dal JWT firmato dal server.
- **Politica di Modifica/Eliminazione**: Gli utenti non possono aggiornare o eliminare dati appartenenti ad altri account.

### Politiche di Sicurezza dello Storage (Documenti Medici)
I referti ematologici in formato PDF caricati dagli utenti vengono archiviati nel bucket privato `medical-documents`.
- **Organizzazione delle Directory**: I file sono salvati con prefisso percorso `/auth.uid()/nome-referto.pdf`.
- **Restrizioni d'Accesso**: Le policy del bucket Supabase Storage verificano che il prefisso della cartella corrisponda all'ID utente estratto dal JWT del richiedente. Qualsiasi richiesta di lettura o scrittura al di fuori della propria cartella viene respinta immediatamente con codice `403 Forbidden`.

---

## 2. Protezione e Minimizzazione dei Dati Clinici Offline

Per garantire il funzionamento offline dell'applicazione PWA, NutriScan AI implementa una coda di sincronizzazione locale tramite **IndexedDB**.

### Vincoli di Minimizzazione
- **Nessun dato sanitario permanente**: Dati completi relativi a referti medici, biomarcatori storici, terapie farmacologiche, patologie o pasti giornalieri non vengono mai salvati nei meccanismi di persistenza del browser (`localStorage` o `sessionStorage`).
- **Minimizzazione del Payload**: La coda offline gestisce esclusivamente gli eventi di sincronizzazione minimi (es. incremento idrato, pasto rapido) spogliandoli di qualsiasi informazione superflua o chiave autogenerata.
- **Cancellazione Immediata**: Una volta che il dispositivo ritorna online e il `SyncManager` completa con successo l'invio del payload a Supabase, i dati corrispondenti vengono rimossi permanentemente da IndexedDB.

### Cifratura Locale
I payload in IndexedDB vengono offuscati e cifrati lato client tramite un algoritmo XOR con codifica Base64 a livello di byte. Questo previene l'esposizione accidentale o la lettura diretta dei dati pendenti da parte di malware o estensioni del browser non autorizzate.

---

## 3. Prevenzione della Carenza di Dati nei Log (Log Sanitizer)

Per scopi di debug amministrativo in produzione, il logger client (`client-logger.js`) e il logger server Edge Function (`server-logger.ts`) registrano gli eventi applicativi applicando filtri stringenti definiti in `log-sanitizer.js`.

### Regole di Scrubbing dei Log
Viene eseguito uno scrubbing profondo a tutti i livelli per impedire la scrittura accidentale di informazioni riservate nei log di produzione:
- **Dati Sensibili e Medici**: Chiavi come `biomarkers`, `medications`, `clinical`, `meals`, `prescriptions`, `diagnoses`, `reports`, `notes` vengono sostituite con il token fisso `[SENSITIVE_DATA_SCRUBBED]`.
- **Credenziali e Token**: Qualsiasi intestazione o proprietà contenente chiavi quali `jwt`, `token`, `password`, `key`, `secret`, `authorization` viene sostituite con `[JWT_SCRUBBED]` o `[SECRET_SCRUBBED]`.
- **Dati Personali (PII)**: Campi contenenti e-mail, nomi, cognomi, date di nascita o codici fiscali vengono intercettati e mascherati (es. `[EMAIL_SCRUBBED]`).
- **Anonimizzazione dell'ID Utente**: Il campo `userId` viene cifrato unidirezionalmente tramite l'algoritmo SHA-256 prima di essere stampato o trasmesso. Ciò consente di tracciare la correlazione tra gli eventi dello stesso utente senza rivelarne l'identità reale.

---

## 4. Hardening delle Intestazioni di Rete e Sicurezza del Browser

In conformità alle configurazioni aziendali per gli ambienti di produzione, NutriScan AI applica restrizioni severe sulle intestazioni di sicurezza:

| Intestazione | Configurazione / Valore | Obiettivo di Sicurezza |
| :--- | :--- | :--- |
| **Content Security Policy (CSP)** | `default-src 'self'; connect-src 'self' https://*.supabase.co https://api.openai.com; img-src 'self' data: https://*.supabase.co; script-src 'self' 'unsafe-inline'; frame-ancestors 'none';` | Impedisce attacchi XSS, iniezioni di script di terze parti e limita le connessioni API solo agli host approvati. |
| **Strict-Transport-Security (HSTS)** | `max-age=63072000; includeSubDomains; preload` | Forza l'uso esclusivo di HTTPS per 2 anni su tutti i sottodomini. |
| **X-Frame-Options** | `DENY` | Previene il Clickjacking impedendo l'incorporazione dell'app in iframe esterni. |
| **X-Content-Type-Options** | `nosniff` | Previene attacchi di MIME-sniffing costringendo il browser a rispettare il Content-Type dichiarato. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Limita le informazioni sul referrer trasmesse a servizi esterni. |

---

## 5. Audit delle Dipendenze e Sicurezza del Codice

- **Dependency Audit**: Il progetto impone una politica di **0 vulnerabilità critiche o ad alta priorità** (`0 Critical/High errors`). Le scansioni vengono eseguite regolarmente tramite `npm audit` integrato nelle pipeline CI/CD.
- **Git Secrets Protection**: Le regole di scansione vietano il tracciamento di file `.env`, backup locali `.bak`, esportazioni di dati `.csv` o `.json` e chiavi private nel repository remoto.
- **Prevenzione Memory Leak**: I componenti React puliscono attivamente tutti i listener associati a `window` e `document`, cancellano le iscrizioni alle tabelle in tempo reale di Supabase dismettendo i canali su `componentWillUnmount` (o tramite il cleanup di `useEffect`), e usano `AbortController` per interrompere le richieste HTTP rimaste in sospeso, riducendo l'impronta di memoria dell'applicazione.
