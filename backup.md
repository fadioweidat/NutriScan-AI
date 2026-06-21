# Politica e Validazione dei Backup - NutriScan AI

Questo documento definisce la strategia di disaster recovery, le politiche di backup dei dati degli utenti e le procedure operative di verifica dell'integrità dei dati per NutriScan AI (Phase 9).

---

## 1. Strategia di Backup del Database

La conservazione dei dati sanitari e delle configurazioni degli utenti in Supabase (PostgreSQL) segue una politica di ridondanza multilivello:

### Tipologie di Snapshot e Frequenza
- **Backup Giornaliero Automatico**:
  - Eseguito dal cloud provider (Supabase) in una finestra temporale a basso traffico (02:00 UTC).
  - Conservato per un periodo minimo di **30 giorni** (Standard Retention).
- **Point-in-Time Recovery (PITR)**:
  - Abilitato per database di produzione enterprise.
  - Consente il ripristino dello stato a qualsiasi transazione registrata fino a **7 giorni** antecedenti, riducendo a zero la perdita potenziale di dati (RPO vicino a 0).
- **Backup Manuali Certificati**:
  - Eseguiti dagli amministratori prima di rilasciare importanti migrazioni di database o modifiche strutturali critiche:
    ```bash
    supabase db dump --project-ref <project-id> -f backup_pre_migration.sql
    ```

---

## 2. Conservazione e Crittografia dei Backup

- **Archiviazione Isolata**: Tutti gli dump del database e le snapshot fisiche sono memorizzati in bucket di backup geograficamente isolati (ridondanza multiregionale).
- **Crittografia**: I file di backup sono cifrati a riposo tramite standard AES-256 gestito dal provider cloud con chiavi crittografiche ruotate annualmente.
- **Minimizzazione dei dati di test**: I database di sviluppo e staging non contengono copie di dati sanitari reali degli utenti di produzione.

---

## 3. Validatore Automatico di Integrità (`backup-validator.js`)

Per garantire che i backup generati non siano corrotti e possano essere ripristinati con successo in caso di incidente, NutriScan AI integra un motore automatico di verifica dell'integrità (`backup-validator.js`).

### Controlli Eseguiti dal Validatore
Il modulo esegue controlli regolari (integrati nella suite di produzione):

1. **Audit delle Policy di Ritenzione (`db_retention`)**:
   - Scansiona i metadati e le configurazioni attive dei backup per assicurarsi che coprano i 30 giorni minimi prescritti.
   - Verifica che i criteri HSTS e SSL siano applicati anche sui canali di replica del database.
2. **Simulatore di Ripristino in Memoria (`restore_simulation`)**:
   - Simula un processo di ripristino estraendo uno schema campione e verificando l'integrità strutturale.
   - Esegue query campione sulle tabelle chiave (`users`, `blood_test_reports`, `meal_entries`) per assicurarsi che i vincoli di foreign key, i tipi di dati dei biomarcatori e le impostazioni delle diete siano validi e leggibili dopo il ripristino simulato.
   - Certifica che nessun dato clinico venga esposto o scritto nei log di produzione durante il ripristino di prova.
