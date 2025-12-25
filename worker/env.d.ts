import type { CanvasDO } from './durable-objects/CanvasDO';
import type { SLCAgent } from './agents/SLCAgent';

// Extend the generated Env interface with secrets and DO bindings
declare global {
  interface Env {
    // API Keys
    ANTHROPIC_API_KEY: string;

    // AI Gateway configuration (optional)
    CF_ACCOUNT_ID?: string;
    CF_GATEWAY_ID?: string;

    // Static assets
    ASSETS: Fetcher;

    // Durable Objects
    CANVAS: DurableObjectNamespace<CanvasDO>;
    SLC_AGENT: DurableObjectNamespace<SLCAgent>;
  }
}

export {};
