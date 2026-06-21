import { sanitize } from './log-sanitizer.js';

/**
 * Client Logger (Phase 9)
 * Logs UI, navigation, performance, rendering, and warnings.
 * Never outputs sensitive/clinical information.
 */

const IS_DEV = (typeof import.meta !== 'undefined' && import.meta.env) 
  ? import.meta.env.DEV 
  : (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

class ClientLogger {
  constructor() {
    this.logsQueue = [];
    this.maxQueueSize = 100;
  }

  formatMessage(level, moduleName, message, data) {
    const sanitizedData = data ? sanitize(data) : null;
    const sanitizedMsg = message ? sanitize(message) : '';

    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      modulo: moduleName || 'CLIENT',
      message: sanitizedMsg,
      data: sanitizedData
    };
  }

  writeLog(logObj) {
    // Append to memory queue for admin status audits
    this.logsQueue.push(logObj);
    if (this.logsQueue.length > this.maxQueueSize) {
      this.logsQueue.shift();
    }

    // Only log allowed topics: UI, Navigation, Rendering, Performance, Warning
    // Print styled logs in development mode
    if (IS_DEV || logObj.level === 'WARNING' || logObj.level === 'ERROR') {
      const styles = {
        DEBUG: 'color: #888; font-weight: bold;',
        INFO: 'color: #22d3ee; font-weight: bold;',
        WARNING: 'color: #fbbf24; font-weight: bold;',
        ERROR: 'color: #f87171; font-weight: bold;',
        CRITICAL: 'color: #f43f5e; font-weight: bold; background: #ffe4e6; padding: 1px 3px;'
      };

      console.log(
        `%c[${logObj.level}] %c[${logObj.modulo}] %s`,
        styles[logObj.level] || 'color: white;',
        'color: #a3e635;',
        logObj.message,
        logObj.data || ''
      );
    }
  }

  debug(moduleName, message, data) {
    this.writeLog(this.formatMessage('DEBUG', moduleName, message, data));
  }

  info(moduleName, message, data) {
    this.writeLog(this.formatMessage('INFO', moduleName, message, data));
  }

  warn(moduleName, message, data) {
    this.writeLog(this.formatMessage('WARNING', moduleName, message, data));
  }

  error(moduleName, message, data) {
    this.writeLog(this.formatMessage('ERROR', moduleName, message, data));
  }

  critical(moduleName, message, data) {
    this.writeLog(this.formatMessage('CRITICAL', moduleName, message, data));
  }

  getLogs() {
    return [...this.logsQueue];
  }

  clearLogs() {
    this.logsQueue = [];
  }
}

const clientLogger = new ClientLogger();
export default clientLogger;
export { clientLogger };
