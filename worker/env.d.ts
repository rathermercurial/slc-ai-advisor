// Extend the generated Env interface with secrets not in wrangler.toml
declare global {
  interface Env {
    ANTHROPIC_API_KEY: string;
    ASSETS: Fetcher;
  }
}

export {};
