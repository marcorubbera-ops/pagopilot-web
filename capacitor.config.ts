import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pagopilot.app',
  appName: 'PagoPilot',
  webDir: '.output/public',

  server: {
    url: 'https://pagopilot.app',
  },
};

export default config;