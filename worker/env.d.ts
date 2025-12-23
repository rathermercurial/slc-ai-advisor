// Extend the generated Env interface with secrets not in wrangler.toml
declare global {
  interface Env {
    // API Keys
    ANTHROPIC_API_KEY: string;

    // AI Gateway configuration (optional)
    CF_ACCOUNT_ID?: string;
    CF_GATEWAY_ID?: string;

    // Static assets
    ASSETS: Fetcher;
  }
}

export {};
