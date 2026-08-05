import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pagopilot.app',
  appName: 'PagoPilot',
  webDir: '.output/public',

  server: {
    url: 'http://10.0.2.2:8080',
    cleartext: true,
  },
};

export default config;