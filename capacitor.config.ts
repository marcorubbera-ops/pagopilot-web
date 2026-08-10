import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pagopilot.app',
  appName: 'PagoPilot',
  webDir: '.output/public',

  server: {
    url: 'https://pagopilot-web.marcorubbera.workers.dev',
  },
};

export default config;