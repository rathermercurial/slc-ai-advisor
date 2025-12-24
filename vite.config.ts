import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// Use VITE_FRONTEND_ONLY=true to run without Cloudflare (for UI testing)
const frontendOnly = process.env.VITE_FRONTEND_ONLY === 'true';

export default defineConfig({
  plugins: frontendOnly
    ? [react()]
    : [
        cloudflare({
          // Run fully local - no remote Cloudflare connection needed
          remoteBindings: false,
          // Persist DO state locally between restarts
          persistState: true,
        }),
        react(),
      ],
});
