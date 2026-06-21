import clientLogger from './client-logger.js';
import { sanitize } from './log-sanitizer.js';

/**
 * Client-Side Error Monitor (Phase 9/10)
 * Intercepts React errors, PWA issues, Network failures, and offline database events.
 * Executes retry flows with exponential backoff.
 */

class ErrorMonitorClient {
  constructor() {
    this.errorCount = 0;
    this.maxRetries = 5;
  }

  // Set up window/global unhandled listeners
  setupGlobalListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      // Exclude Supabase Function / API errors if they originate from server side
      if (event.filename && event.filename.includes('supabase/functions')) {
        return; 
      }
      this.handleError(event.error || new Error(event.message), 'WINDOW_GLOBAL');
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      
      // Exclude Edge Function responses
      if (msg.includes('functions.supabase') || msg.includes('functions.invoke')) {
        return;
      }
      this.handleError(reason instanceof Error ? reason : new Error(msg), 'UNHANDLED_REJECTION');
    });
  }

  // Simulated Sentry Reporting Integration with strict privacy scrubbing
  sendToSentry(error, context = {}) {
    const sanitizedErrorMsg = sanitize(error?.message || 'Unknown Error');
    const sanitizedStack = sanitize(error?.stack || '');
    const sanitizedContext = sanitize(context);

    // Mock sentry event creation (mimics Sentry.beforeSend callback)
    const sentryEvent = {
      message: sanitizedErrorMsg,
      exception: {
        values: [{
          type: error?.name || 'Error',
          value: sanitizedErrorMsg,
          stacktrace: { frames: sanitizedStack.split('\n') }
        }]
      },
      request: sanitizedContext.requestPayload ? { data: sanitizedContext.requestPayload } : undefined,
      response: sanitizedContext.responsePayload ? { data: sanitizedContext.responsePayload } : undefined,
      breadcrumbs: sanitizedContext.breadcrumbs ? sanitize(sanitizedContext.breadcrumbs) : [],
      user: sanitizedContext.user ? { id: sanitizedContext.user.id } : null,
      tags: { moduleName: context.moduleName || 'CLIENT' }
    };

    console.log(`[Sentry Report] Event dispatched securely:`, sentryEvent);
    return sentryEvent;
  }

  handleError(error, moduleName = 'CLIENT', context = {}) {
    this.errorCount++;
    const errMsg = error ? error.message : 'Unknown Error';
    const errStack = error ? error.stack : '';

    // Log the error via sanitized logger
    clientLogger.error(moduleName, errMsg, {
      stack: errStack,
      ...context
    });

    // Send to simulated Sentry after sanitizing
    this.sendToSentry(error, { moduleName, ...context });

    return {
      errorId: Math.random().toString(36).substring(2, 10),
      friendlyMessage: this.getFriendlyMessage(error, moduleName),
      retryable: this.isRetryable(error, moduleName)
    };
  }

  isRetryable(error, moduleName) {
    const msg = (error?.message || '').toLowerCase();
    if (moduleName === 'NETWORK' || moduleName === 'OFFLINE_QUEUE') return true;
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) return true;
    return false;
  }

  getFriendlyMessage(error, moduleName) {
    const msg = (error?.message || '').toLowerCase();
    if (moduleName === 'NETWORK' || msg.includes('fetch') || msg.includes('network')) {
      return "Problema di connessione alla rete. Riprovo automaticamente appena online.";
    }
    if (moduleName === 'OFFLINE_QUEUE') {
      return "Impossibile salvare i dati offline. Verrà eseguito un nuovo tentativo.";
    }
    if (moduleName === 'PWA') {
      return "Si è verificato un errore con l'applicazione installata. Ricarica la pagina.";
    }
    return "Si è verificato un errore imprevisto. Stiamo cercando di risolvere automaticamente.";
  }

  // Exponential backoff runner
  async executeWithRetry(action, moduleName = 'CLIENT', currentRetry = 0) {
    try {
      return await action();
    } catch (err) {
      this.handleError(err, moduleName, { retryAttempt: currentRetry + 1 });
      
      const retryable = this.isRetryable(err, moduleName);
      if (retryable && currentRetry < this.maxRetries) {
        const delay = Math.pow(2, currentRetry) * 1000 + Math.random() * 200;
        clientLogger.warn(moduleName, `Tentativo fallito. Riprovo tra ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(action, moduleName, currentRetry + 1);
      }
      throw err;
    }
  }
}

const errorMonitor = new ErrorMonitorClient();
export default errorMonitor;
export { errorMonitor };
