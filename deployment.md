# Manuale di Deployment e Rilascio in Produzione - NutriScan AI

Questo manuale descrive la procedura operativa per compilare, testare e distribuire l'applicazione NutriScan AI in ambienti di produzione stabili e governati.

---

## 1. Architettura di Deployment

NutriScan AI adotta un'architettura disaccoppiata (Jamstack):
1. **Frontend Client PWA**: Compilato in asset statici ottimizzati (HTML5, CSS3, JS ESM) tramite **Vite** e distribuito globalmente su una rete CDN (Content Delivery Network) a bassa latenza (es. Netlify, Vercel o Cloudflare Pages).
2. **Backend Serverless (Edge Functions)**: Le funzioni serverless ed i moduli di intelligenza artificiale girano su **Supabase Edge Functions** (runtimes basati su Deno) distribuiti geograficamente nei nodi edge globali.
3. **Database & Storage**: Gestiti da **Supabase** (PostgreSQL clonato in cluster ad alta disponibilità, e storage object per documenti sanitari).

---

## 2. Configurazione delle Variabili d'Ambiente

Prima del build in produzione, devono essere configurate le seguenti chiavi (mai tracciate su Git):

### Configurazione Frontend (Client PWA)
Fornite al bundler Vite durante la compilazione:
- `VITE_SUPABASE_URL`: Endpoint HTTPS dell'istanza di produzione Supabase.
- `VITE_SUPABASE_ANON_KEY`: Chiave anonima pubblica per l'accesso RLS al database.

### Configurazione Edge Functions (Serverless Secrets)
Configurate nell'ambiente Supabase tramite CLI o console amministrativa:
- `OPENAI_API_KEY`: Chiave API OpenAI per i motori decisionali di IA.
- `SUPABASE_DB_URL`: Stringa di connessione diretta PostgreSQL (usata solo per script di backup certificati).

---

## 3. Pipeline di Rilascio Passo-Passo

Seguire questo ordine rigoroso prima di promuovere il codice in produzione:

### Passo 1: Audit di Sicurezza delle Dipendenze
Eseguire la scansione dei pacchetti per garantire zero vulnerabilità bloccanti:
```bash
npm audit
```

### Passo 2: Validazione e Linting del Codice
Il codice deve superare tutti i controlli sintattici e di stile ESLint senza alcun warning o errore:
```bash
npm run lint
```

### Passo 3: Esecuzione della Clinical & Enterprise Suite
Eseguire i test di validazione locale per certificare la stabilità clinica, di memoria e di sicurezza:
```bash
node verify-clinical-validation.js
node verify-enterprise.js
node verify-security.js
node verify-memory.js
```
Tutti i test devono restituire `Passed` al 100%.

### Passo 4: Compilazione del Bundle Statico
Compilare gli asset di produzione per il frontend:
```bash
npm run build
```
Vite genererà i file ottimizzati all'interno della cartella `/dist`. Verificare che la dimensione dei singoli chunk JS non superi i limiti di performance consigliati (l'app implementa lazy loading automatico per dividere le rotte).

### Passo 5: Deploy delle Edge Functions
Distribuire le funzioni serverless a Supabase:
```bash
supabase functions deploy ai-nutrition-chat --project-ref <production-project-id>
```

### Passo 6: Distribuzione degli Asset Statici
Sincronizzare la cartella `/dist` con il provider CDN preferito (es. tramite integrazione Git automatica sul branch `main`).

---

## 4. Test di Verifica Post-Deployment (Smoke Tests)

Una volta completato il deploy:
1. Accedere all'URL di produzione.
2. Controllare che il Service Worker sia registrato e che le intestazioni di sicurezza (CSP, HSTS) siano applicate correttamente.
3. Caricare un referto PDF di test ed eseguire una scansione OCR per validare le connessioni e le autorizzazioni RLS/Storage.
4. Aprire il pannello di amministrazione "Stato dei Servizi" integrato nella Dashboard per verificare che le latenze registrate per Supabase ed Edge Functions siano in stato `OK`.
