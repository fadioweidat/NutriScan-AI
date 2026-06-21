import { ServerLogger, hashUserId } from './server-logger.ts';

/**
 * Server-Side Audit Trail Engine (Phase 9)
 * Compiles immutable administrative audit records.
 * Never stores raw clinical results or content.
 */

export interface AuditEvent {
  action: 'LOGIN' | 'LOGOUT' | 'PRIVACY_CONSENT_GRANT' | 'PRIVACY_CONSENT_REVOKE' | 'REPORT_UPLOAD' | 'ACCOUNT_DELETION' | 'WEARABLES_SYNC' | 'PASSWORD_CHANGE';
  userId: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE';
  details?: string;
}

export class AuditEngine {
  static async logAdminEvent(event: AuditEvent) {
    const userHash = await hashUserId(event.userId);
    
    // Anonymized audit trail log
    const auditRecord = {
      timestamp: new Date().toISOString(),
      action: event.action,
      userHash,
      requestId: event.requestId || null,
      sessionId: event.sessionId || null,
      ipAddress: event.ipAddress || 'unknown',
      status: event.status,
      // Audit details are strictly administrative descriptions
      details: event.details ? String(event.details).replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_SCRUBBED]') : '',
      disclaimer: "AUDIT RECORD: Contiene solo tracciabilità amministrativa. Nessun dato clinico o parametro di salute dell'utente è memorizzato in questa traccia."
    };

    // Log the audit event to the secure server console (tamper-proof cloud operational sink)
    console.log(`[AUDIT_TRAIL] ${JSON.stringify(auditRecord)}`);

    // Log using server logger for redundancy
    await ServerLogger.info(
      `Audit Event: ${event.action} - ${event.status}`,
      {
        userId: event.userId,
        requestId: event.requestId,
        sessionId: event.sessionId,
        module: 'AUDIT_TRAIL'
      },
      {
        action: event.action,
        status: event.status,
        ipAddress: event.ipAddress
      }
    );

    return auditRecord;
  }
}
export default AuditEngine;
