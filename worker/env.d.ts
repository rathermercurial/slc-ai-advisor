import type { CanvasDO } from './durable-objects/CanvasDO';
import type { SLCAgent } from './agents/SLCAgent';

// Extend the generated Env interface with secrets and DO bindings
declare global {
  interface Env {
    // API Keys
    ANTHROPIC_API_KEY: string;

    // AI Gateway configuration (required for SLCAgent)
    CF_ACCOUNT_ID: string;
    CF_GATEWAY_ID: string;
    CF_AIG_TOKEN?: string; // Optional: Required if Authenticated Gateway is enabled

    // Static assets
    ASSETS: Fetcher;

    // Durable Objects
    CANVAS: DurableObjectNamespace<CanvasDO>;
    SLC_AGENT: DurableObjectNamespace<SLCAgent>;

    // Analytics Engine for metrics
    SLC_ANALYTICS: AnalyticsEngineDataset;
  }
}

export {};
