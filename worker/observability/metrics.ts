/**
 * Analytics Engine Metrics for SLC AI Advisor
 *
 * Provides structured metrics tracking using Cloudflare Analytics Engine.
 * Metrics can be queried via the SQL API or viewed in the dashboard.
 *
 * Data point structure:
 * - blobs: String fields (up to 20) - event type, session ID, etc.
 * - doubles: Numeric fields (up to 20) - duration, token count, etc.
 * - indexes: Indexed fields (up to 1) - for efficient filtering
 *
 * Usage:
 *   const metrics = createMetrics(env.SLC_ANALYTICS);
 *   metrics.trackEvent('message_received', { sessionId: 'abc', durationMs: 150 });
 */

/**
 * Event types for tracking
 */
export type MetricEvent =
  | 'message_received'
  | 'message_sent'
  | 'tool_executed'
  | 'canvas_created'
  | 'canvas_updated'
  | 'rag_query'
  | 'session_created'
  | 'error';

/**
 * Metric data for tracking
 */
export interface MetricData {
  /** Session/conversation ID for grouping */
  sessionId?: string;
  /** Tool name (for tool_executed events) */
  toolName?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Token count (for LLM calls) */
  tokenCount?: number;
  /** Whether the operation succeeded */
  success?: boolean;
  /** Error type (for error events) */
  errorType?: string;
  /** Canvas section (for canvas events) */
  section?: string;
  /** Result count (for search events) */
  resultCount?: number;
}

/**
 * Metrics interface
 */
export interface Metrics {
  /** Track an event with associated data */
  trackEvent(event: MetricEvent, data?: MetricData): void;
  /** Track a timed operation (returns a function to call when done) */
  startTimer(event: MetricEvent, data?: MetricData): () => void;
}

/**
 * Create a metrics tracker
 *
 * If Analytics Engine is not available (e.g., in tests), returns a no-op implementation.
 */
export function createMetrics(analytics?: AnalyticsEngineDataset): Metrics {
  // No-op implementation when Analytics Engine is not available
  if (!analytics) {
    return {
      trackEvent: () => {},
      startTimer: () => () => {},
    };
  }

  return {
    trackEvent(event: MetricEvent, data: MetricData = {}): void {
      try {
        analytics.writeDataPoint({
          // Blobs: string data (event type, session, tool, error type, section)
          blobs: [
            event,
            data.sessionId ?? '',
            data.toolName ?? '',
            data.errorType ?? '',
            data.section ?? '',
          ],
          // Doubles: numeric data (duration, tokens, success flag, result count)
          doubles: [
            data.durationMs ?? 0,
            data.tokenCount ?? 0,
            data.success === undefined ? 1 : data.success ? 1 : 0,
            data.resultCount ?? 0,
          ],
          // Index by session ID for efficient queries
          indexes: data.sessionId ? [data.sessionId] : [],
        });
      } catch (error) {
        // Silently fail - metrics should never break the app
        console.warn('Failed to write metric:', error);
      }
    },

    startTimer(event: MetricEvent, data: MetricData = {}): () => void {
      const startTime = Date.now();
      return () => {
        this.trackEvent(event, {
          ...data,
          durationMs: Date.now() - startTime,
        });
      };
    },
  };
}
