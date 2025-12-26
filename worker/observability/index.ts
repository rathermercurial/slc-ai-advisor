/**
 * Observability utilities for SLC AI Advisor
 *
 * Exports:
 * - Logger: Structured JSON logging with request tracing
 * - Request ID: Generation and extraction utilities
 */

export {
  createLogger,
  generateRequestId,
  getOrCreateRequestId,
  type Logger,
  type LogEntry,
  type LogLevel,
  type Timer,
} from './logger';
