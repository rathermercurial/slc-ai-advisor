/**
 * Observability utilities for SLC AI Advisor
 *
 * Exports:
 * - Logger: Structured JSON logging with request tracing
 * - Metrics: Analytics Engine integration for metrics tracking
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

export {
  createMetrics,
  type Metrics,
  type MetricEvent,
  type MetricData,
} from './metrics';
