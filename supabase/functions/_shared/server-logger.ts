/**
 * Server Logger (Phase 9)
 * Shared server logger for Supabase Edge Functions (Deno).
 * Strictly audited for clinical data leakage.
 */

// Simple SHA-256 for anonymizing user IDs in Deno
export async function hashUserId(userId: string): Promise<string> {
  if (!userId) return '';
  try {
    const msgUint8 = new TextEncoder().encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch {
    // Simple fallback hash if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

const SENSITIVE_KEYS = new Set([
  'email', 'phone', 'telefono', 'name', 'surname', 'nome', 'cognome',
  'biomarkers', 'biomarcatori', 'reports', 'referti', 'medications', 'farmaci',
  'meals', 'pasti', 'conditions', 'patologie', 'allergie', 'intolleranze',
  'jwt', 'cookie', 'authorization', 'bearer', 'token', 'password', 'apikey', 'key', 'secret',
  'diagnosi', 'diagnosis', 'ocr', 'allegati', 'attachments', 'attachment', 'allegato'
]);

function cleanData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // Scrub JWT, emails
    return data
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_SCRUBBED]')
      .replace(/\bey[jJ][a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\b/g, '[JWT_SCRUBBED]');
  }
  if (Array.isArray(data)) {
    return data.map(cleanData);
  }
  if (typeof data === 'object') {
    const clean: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'user_id' || lowerKey === 'userid') {
        clean[key] = '[USER_ID_HASHED]'; // User ID handled via direct user hash mapping in server-logger
        continue;
      }
      if (SENSITIVE_KEYS.has(lowerKey)) {
        clean[key] = '[SENSITIVE_DATA_SCRUBBED]';
      } else {
        clean[key] = cleanData(value);
      }
    }
    return clean;
  }
  return data;
}

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  module?: string;
  durationMs?: number;
  errorId?: string;
}

export class ServerLogger {
  static async formatLog(
    level: string,
    message: string,
    context?: LogContext,
    extra?: any
  ) {
    const userHash = context?.userId ? await hashUserId(context.userId) : null;
    
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: cleanData(message),
      requestId: context?.requestId || null,
      correlationId: context?.correlationId || null,
      sessionId: context?.sessionId || null,
      userHash,
      modulo: context?.module || 'SERVER',
      durationMs: context?.durationMs || null,
      errorId: context?.errorId || null,
      extra: extra ? cleanData(extra) : null
    };
  }

  static async log(level: string, message: string, context?: LogContext, extra?: any) {
    const logObj = await this.formatLog(level, message, context, extra);
    console.log(JSON.stringify(logObj));
  }

  static async debug(message: string, context?: LogContext, extra?: any) {
    await this.log('DEBUG', message, context, extra);
  }

  static async info(message: string, context?: LogContext, extra?: any) {
    await this.log('INFO', message, context, extra);
  }

  static async warn(message: string, context?: LogContext, extra?: any) {
    await this.log('WARNING', message, context, extra);
  }

  static async error(message: string, context?: LogContext, extra?: any) {
    await this.log('ERROR', message, context, extra);
  }

  static async critical(message: string, context?: LogContext, extra?: any) {
    await this.log('CRITICAL', message, context, extra);
  }
}
export default ServerLogger;
