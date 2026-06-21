import { ServerLogger, LogContext } from './server-logger.ts';

/**
 * Server-Side Error Monitor (Phase 9)
 * Manages errors occurring inside Supabase Edge Functions.
 * Restricts system detail leaks to callers by mapping to safe error IDs.
 */

export class ErrorMonitorServer {
  static handleError(
    error: any,
    context?: LogContext,
    extra?: any
  ) {
    const errorId = `err_${Math.random().toString(36).substring(2, 10)}`;
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';

    // Log the error securely on the server
    ServerLogger.critical(
      `[Unhandled Function Exception] ${message}`,
      {
        ...context,
        errorId
      },
      {
        stack,
        ...extra
      }
    );

    return {
      errorId,
      success: false,
      error: "Si è verificato un errore interno del server. Riprova più tardi.",
      code: "INTERNAL_SERVER_ERROR"
    };
  }

  // Wrapper middleware helper for Edge Functions
  static async wrapHandler(
    handler: (req: Request, ctx: LogContext) => Promise<Response>,
    moduleName = 'EDGE_FUNCTION'
  ): Promise<(req: Request) => Promise<Response>> {
    return async (req: Request) => {
      const requestId = crypto.randomUUID();
      const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
      const context: LogContext = {
        requestId,
        correlationId,
        module: moduleName
      };

      try {
        const response = await handler(req, context);
        return response;
      } catch (err) {
        const errorDetails = this.handleError(err, context);
        return new Response(
          JSON.stringify(errorDetails),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'x-error-id': errorDetails.errorId,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
            }
          }
        );
      }
    };
  }
}
export default ErrorMonitorServer;
