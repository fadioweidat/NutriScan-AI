# Production Backup & Disaster Recovery Policy (Phase 11)

This policy details the backup operations, snapshot retention windows, integrity audits, and disaster recovery procedures for NutriScan AI's production environment.

---

## 1. Parameters (RPO & RTO)

| Metric | Target | Description |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **1 Hour** | Maximum acceptable data loss window. User profiles, logs, and billing telemetry must be backed up hourly. |
| **RTO (Recovery Time Objective)** | **4 Hours** | Maximum acceptable downtime for complete recovery of core services (auth, database, file uploads, AI/OCR). |

---

## 2. Backup Schedules & Automation

### A. Database Backups (Supabase PostgreSQL)
- **Hourly Logical Backups**: Automated export of transactional tables (profiles, diary, medications, logs) using `pg_dump` scheduled via cron serverless events.
- **Daily Physical Backups**: Automated system snapshots of the database disk, managed natively via Supabase replication.
- **Encryption**: All backups are encrypted at rest using AES-256 keys managed by KMS.

### B. Storage Backups (Supabase Storage Buckets)
- **Daily Sync**: Sync script clones the `medical-documents` and `meal-photos` storage buckets to a secure secondary backup bucket in a separate AWS region.
- **Version Control**: Object Versioning is enabled in all buckets to protect against accidental deletions and ransomware modifications.

---

## 3. Retention Policies

- **Daily Backups**: Retained for **30 days**.
- **Weekly Backups**: Retained for **12 weeks**.
- **Monthly Backups**: Retained for **1 year** (compliance and history).

---

## 4. Integrity Audits & Restore Tests

- **Daily Automation Check**: A daily administrative worker scripts verification checks on backup sizes and files checksums.
- **Weekly Restore Simulation**:
  - Automatically spins up an isolated sandbox database instance.
  - Restores the latest logical backup.
  - Executes basic validation queries to confirm schema consistency and database readability.
  - Tears down the sandbox database instance.

---

## 5. Recovery Procedures

In case of critical failover:
1. **DB Corruptions**: Point-In-Time-Recovery (PITR) is triggered via the administrative console to roll back database state to the minute prior to corruption.
2. **Region Outage**: DNS records (Cloudflare) are routed to Staging/Secondary deployment servers, restoring health check endpoints.
3. **Rollback Releases**: GitHub Actions pipeline initiates a rollback deployment to the last stable git tag version.
