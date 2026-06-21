# Piano di Risposta agli Incidenti (Incident Response Plan) - NutriScan AI

Questo piano d'emergenza definisce le procedure operative per identificare, contenere, mitigare e risolvere gli incidenti di sicurezza o i disservizi operativi critici in NutriScan AI (Phase 9).

---

## 1. Classificazione degli Incidenti e Gravità

| Livello | Descrizione / Esempi | Obiettivo di Risoluzione (SLA) |
| :--- | :--- | :--- |
| **Severity 1 (Critico)** | - Fuga di dati clinici/sanitari o personali in chiaro.<br>- Compromissione delle chiavi di amministrazione del database o di Supabase.<br>- Disservizio totale dell'applicazione di produzione (DDoS massivo, database corrotto). | **< 2 ore** |
| **Severity 2 (Alto)** | - Malfunzionamento dell'OCR o del modulo di caricamento referti medici.<br>- Malfunzionamento globale dell'AI Coach (timeout sistematici dell'API OpenAI).<br>- Compromissione dell'account di un singolo utente. | **< 6 ore** |
| **Severity 3 (Medio)** | - Problemi di sincronizzazione dei dispositivi indossabili (wearables).<br>- Rallentamento generale delle query del database (> 1000ms latenza).<br>- Malfunzionamento di alcune pagine minori o del Service Worker offline. | **< 24 ore** |
| **Severity 4 (Basso)** | - Warning minori nei log operativi.<br>- Errori di rendering grafici (UI glitches) non bloccanti.<br>- Modifiche non urgenti alla documentazione o configurazioni. | **Prossima release** |

---

## 2. Flusso di Gestione degli Incidenti

### Fase 1: Rilevamento e Segnalazione
Gli incidenti possono essere rilevati tramite:
- Allarmi automatici del logger client/server (es. picchi anomali di errori `CRITICAL` nel monitor).
- Widget amministrativo di telemetria (`SystemStatusCard.jsx`) che segnala stato `Critical` su Supabase o Edge Functions.
- Segnalazioni di vulnerabilità da audit esterni o bug-bounty.

### Fase 2: Contenimento Primario (Isolamento)
In caso di violazione accertata (Severity 1):
1. **Blocco Temporaneo dell'Accesso al Database**:
   Se si sospetta un'esfiltrazione in corso, bloccare temporaneamente le connessioni API impostando a `false` le politiche RLS o revocando momentaneamente la chiave anonima di produzione.
2. **Revoca e Rotazione delle Chiavi**:
   Se le chiavi OpenAI o Supabase Service Role vengono esposte:
   - Rigenerare immediatamente le chiavi dalla console provider.
   - Aggiornare le variabili d'ambiente in produzione (Supabase Secrets / Vercel Env) ed effettuare un redeploy immediato delle Edge Functions.
3. **Isolamento dello Storage**:
   Se il bucket `medical-documents` risulta vulnerabile, disabilitare le policy di caricamento pubblico e forzare il blocco di sicurezza di scrittura sull'object storage.

### Fase 3: Eradicazione e Ripristino
1. **Analisi delle Cause (Root Cause Analysis)**:
   Ispezionare i log sanitizzati tramite Correlation ID per tracciare la sorgente dell'exploit o dell'errore di sistema.
2. **Ripristino da Backup**:
   In caso di corruzione del database, utilizzare il `backup-validator.js` per confermare l'integrità dell'ultimo snapshot giornaliero e avviare la procedura di restore tramite console Supabase CLI.
3. **Deploy della Patch**:
   Applicare la correzione software sul repository Git, validare con `npm run lint` ed eseguire la suite completa dei test `verify-*.js` prima del rilascio rapido (hotfix).

### Fase 4: Notifica e Governance Post-Incidente
- **Notifica GDPR**: In caso di violazione accertata di dati personali o sanitari (data breach), inviare la notifica formale all'Autorità Garante per la Protezione dei Dati Personali entro **72 ore** dall'accertamento, descrivendo la natura dell'incidente e le misure di mitigazione adottate.
- **Post-Mortem**: Redigere un rapporto post-mortem dettagliato per analizzare perché l'incidente si è verificato e aggiornare questo piano per prevenire minacce simili.
