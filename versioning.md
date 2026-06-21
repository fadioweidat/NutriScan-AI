# Regole di Versionamento e Semantic Versioning (SemVer) - NutriScan AI

Questo documento definisce le linee guida per il versionamento del codice di NutriScan AI in conformità con le specifiche di **Semantic Versioning 2.0.0** (SemVer).

---

## 1. Schema del Numero di Versione

Ogni rilascio ufficiale utilizza il formato:

\[
\text{v}\langle\text{major}\rangle.\langle\text{minor}\rangle.\langle\text{patch}\rangle
\]

- **MAJOR (Primo numero)**: Incrementato per modifiche dell'API pubblica incompatibili con le versioni precedenti (breaking changes) o modifiche strutturali fondamentali della piattaforma (es. passaggio a un nuovo motore di database).
- **MINOR (Secondo numero)**: Incrementato quando si aggiungono nuove funzionalità compatibili con le versioni precedenti (es. l'introduzione dell'analisi dei wearables nella Fase 8 o dei grafici storici).
- **PATCH (Terzo numero)**: Incrementato per bug-fix, ottimizzazioni di performance o aggiornamenti di sicurezza che non alterano le funzionalità concordate (es. la risoluzione di leak di memoria o warning del linter).

---

## 2. Allineamento Storico delle Fasi (Roadmap di Versione)

Ecco come le diverse fasi di sviluppo del progetto corrispondono alla cronologia di SemVer:

- **v0.1.0 (Fase 1)**: Recipe OCR parser & Normalizzazione alimenti (USDA/OFF API).
- **v0.2.0 (Fase 2)**: Blood Tests parsing & Hardening delle policy RLS/Storage.
- **v0.3.0 (Fase 3)**: Health Score & AI Health Coach 2.0.
- **v0.4.0 (Fase 4)**: Meal Planner & Sostituzioni.
- **v0.5.0 (Fase 5)**: Mobile PWA, Offline Sync Queue & Crittografia IndexedDB.
- **v0.6.0 (Fase 6)**: Digital Twin, Biomarker Forecast & Simulator.
- **v0.7.0 (Fase 7)**: Certificazione clinica e hardening delle performance.
- **v0.8.0 (Fase 8)**: Integrazione dei Wearables (Fitbit, Google Health, Apple Health).
- **v0.9.0 (Fase 9)**: Logger Sanitizzato Enterprise, Rate limiters, Error Monitor.
- **v1.0.0 (Fase 10 - Attuale)**: Rilascio Commerciale, Modulo SaaS & Stripe Simulator, Landing Page.

---

## 3. Regole di Rilascio e Tagging

1. **Tag di Rilascio su Git**: Ogni versione stabile deve essere associata a un tag Git immutabile:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 Commercial SaaS Ready"
   git push origin v1.0.0
   ```
2. **Branching Strategy**:
   - `main`: Branch principale contenente esclusivamente codice certificato di produzione (allineato all'ultimo tag stabile).
   - `development`: Branch di integrazione delle nuove feature.
   - `feature/name-fase`: Branch temporanei per lo sviluppo di moduli specifici prima del merge.
