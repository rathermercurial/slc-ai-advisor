/**
 * Structured Logger for SLC AI Advisor
 *
 * Provides consistent JSON logging with:
 * - Request ID tracking for distributed tracing
 * - Log levels (debug, info, warn, error)
 * - Timing utilities for performance metrics
 * - Structured context for filtering in Cloudflare dashboard
 *
 * Usage:
 *   const logger = createLogger('my-component', requestId);
 *   logger.info('Processing request', { userId: '123' });
 *   const timer = logger.startTimer('db-query');
 *   // ... do work ...
 *   timer.end({ rowCount: 10 });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Component that generated the log */
  component: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Log message */
  message: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Duration in ms (for timed operations) */
  durationMs?: number;
  /** Error details */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Timer {
  /** End the timer and log with optional context */
  end(context?: Record<string, unknown>): number;
}

export interface Logger {
  /** Log debug message (verbose, for development) */
  debug(message: string, context?: Record<string, unknown>): void;
  /** Log info message (standard operations) */
  info(message: string, context?: Record<string, unknown>): void;
  /** Log warning (recoverable issues) */
  warn(message: string, context?: Record<string, unknown>): void;
  /** Log error (failures) */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;
  /** Start a timer for measuring operation duration */
  startTimer(operation: string): Timer;
  /** Create a child logger with additional context */
  child(context: Record<string, unknown>): Logger;
}

/**
 * Check if debug logging is enabled
 * Can be controlled via environment variable in the future
 */
function isDebugEnabled(): boolean {
  // For now, debug is always disabled in production
  // Workers don't have process.env, so we'd need to pass this via Env
  return false;
}

/**
 * Format an error for logging
 */
function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Write a log entry to the appropriate output
 */
function writeLog(entry: LogEntry): void {
  // Use appropriate console method based on level
  // Cloudflare Workers capture these and make them available in dashboard
  const logFn = entry.level === 'error' ? console.error
    : entry.level === 'warn' ? console.warn
    : console.log;

  // Output as JSON for structured logging
  logFn(JSON.stringify(entry));
}

/**
 * Create a logger instance for a component
 */
export function createLogger(
  component: string,
  requestId?: string,
  baseContext?: Record<string, unknown>
): Logger {
  const log = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    extra?: Partial<LogEntry>
  ): void => {
    // Skip debug logs if not enabled
    if (level === 'debug' && !isDebugEnabled()) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      ...extra,
    };

    if (requestId) {
      entry.requestId = requestId;
    }

    // Merge base context and call context
    if (baseContext || context) {
      entry.context = { ...baseContext, ...context };
    }

    writeLog(entry);
  };

  return {
    debug(message: string, context?: Record<string, unknown>): void {
      log('debug', message, context);
    },

    info(message: string, context?: Record<string, unknown>): void {
      log('info', message, context);
    },

    warn(message: string, context?: Record<string, unknown>): void {
      log('warn', message, context);
    },

    error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
      log('error', message, context, { error: formatError(error) });
    },

    startTimer(operation: string): Timer {
      const startTime = Date.now();

      return {
        end(context?: Record<string, unknown>): number {
          const durationMs = Date.now() - startTime;
          log('info', `${operation} completed`, context, { durationMs });
          return durationMs;
        },
      };
    },

    child(childContext: Record<string, unknown>): Logger {
      return createLogger(component, requestId, { ...baseContext, ...childContext });
    },
  };
}

/**
 * Generate a unique request ID
 * Format: timestamp-random for rough time ordering
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID().slice(0, 8);
  return `${timestamp}-${random}`;
}

/**
 * Extract request ID from headers or generate a new one
 * Looks for common tracing headers: X-Request-ID, X-Trace-ID, CF-Ray
 */
export function getOrCreateRequestId(request: Request): string {
  // Check common tracing headers
  const existingId = request.headers.get('X-Request-ID')
    || request.headers.get('X-Trace-ID')
    || request.headers.get('CF-Ray');

  if (existingId) {
    return existingId;
  }

  return generateRequestId();
}
