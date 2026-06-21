/**
 * Official SaaS Legal Documents & FAQ (Phase 10)
 * 
 * Enforces strict compliance with GDPR guidelines, cookies disclosure,
 * terms of service, support options, and the mandatory medical disclaimers.
 */

export const PRIVACY_POLICY = `
# Informativa sulla Privacy (GDPR Compliance)
**Ultimo aggiornamento: 21 Giugno 2026**

NutriScan AI è impegnata a proteggere la riservatezza e la sicurezza dei dati personali dei propri utenti.

### 1. Trattamento dei Dati Sanitari e Clinici
I dati ricavati dagli esami ematici caricati tramite PDF o inseriti manualmente vengono elaborati esclusivamente in memoria all'interno dell'applicazione client (browser). Non vengono persistiti dati sensibili nei meccanismi locali del browser (localStorage/sessionStorage). Qualsiasi transazione temporanea in coda offline viene memorizzata cifrata in IndexedDB e rimossa immediatamente dopo la sincronizzazione avvenuta con successo.

### 2. Conservazione e Sicurezza
I file PDF dei referti sono archiviati in modo isolato in object storage privati ad accesso protetto tramite Row Level Security (RLS). Nessun utente esterno può visualizzare i tuoi dati.

### 3. Diritti dell'Interessato
In conformità al GDPR, l'utente può richiedere l'esportazione, la rettifica o la cancellazione permanente di tutti i propri dati sanitari e del proprio account direttamente dalle impostazioni del profilo.
`;

export const COOKIE_POLICY = `
# Informativa sui Cookie
**Ultimo aggiornamento: 21 Giugno 2026**

NutriScan AI utilizza solo cookie tecnici essenziali al funzionamento della piattaforma.

### 1. Cookie di Sessione e Autenticazione
Utilizziamo cookie crittografati forniti da Supabase Auth al solo scopo di mantenere la sessione di accesso attiva ed autenticare le richieste API. Questi cookie non contengono informazioni cliniche o personali.

### 2. Cookie Analitici e Tracciamento
I cookie analitici (PostHog o simili) sono utilizzati in modalità anonima per monitorare il funnel di onboarding e le metriche di fatturazione. I log non collezionano in alcun modo pasti registrati o valori dei biomarcatori.
`;

export const TERMS_OF_SERVICE = `
# Termini di Servizio (Terms of Service)
**Ultimo aggiornamento: 21 Giugno 2026**

Benvenuto su NutriScan AI. Accedendo o utilizzando il nostro servizio, accetti di essere vincolato dai presenti termini.

### 1. Finalità Educativa e Disclaimer Medico Obbligatorio
NutriScan AI è una piattaforma software di supporto nutrizionale a puro scopo educativo ed informativo. L'intelligenza artificiale e i modelli predittivi NON effettuano diagnosi mediche, non prescrivono terapie o dosaggi farmacologici, e non si sostituiscono in alcun modo al parere del tuo medico curante.

### 2. Modello di Abbonamento SaaS
Il servizio è offerto in piani Free (con limiti giornalieri), Pro e Premium (con accesso a wearables e Digital Twin). L'attivazione e la revoca degli abbonamenti sono gestite tramite transazioni protette da Stripe.
`;

export const FAQ_ITEMS = [
  {
    q: "NutriScan AI esegue diagnosi mediche?",
    a: "No. NutriScan AI fornisce esclusivamente analisi educative e nutrizionali di prevenzione. Qualsiasi indicazione o allarme relativo a carenze nutrizionali deve essere verificato con il proprio medico prima di assumere integratori o modificare terapie."
  },
  {
    q: "Dove vengono memorizzati i miei dati sugli esami del sangue?",
    a: "I tuoi referti PDF vengono caricati all'interno di storage protetti su Supabase. L'accesso è isolato e governato da Row Level Security (RLS) associato al tuo utente. I dettagli estratti vengono gestiti solo in memoria nel browser e non vengono salvati localmente sul computer."
  },
  {
    q: "Posso disdire il mio abbonamento in qualsiasi momento?",
    a: "Sì. Puoi accedere alla sezione di fatturazione nel tuo profilo utente per effettuare l'upgrade, il downgrade o cancellare l'abbonamento con un solo click. In caso di disdetta, manterrai l'accesso Pro o Premium fino alla fine del periodo di fatturazione corrente."
  },
  {
    q: "Quali dispositivi indossabili sono supportati?",
    a: "NutriScan AI supporta la sincronizzazione con i principali ecosistemi di salute tra cui Fitbit, Google Health Connect, Apple Health, Garmin, Oura, Withings e Samsung Health."
  }
];

export const legalDocs = {
  PRIVACY_POLICY,
  COOKIE_POLICY,
  TERMS_OF_SERVICE,
  FAQ_ITEMS
};

export default legalDocs;
