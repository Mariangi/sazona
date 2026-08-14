import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAP_ENV === 'dev';

const config: CapacitorConfig = {
  appId: 'com.sazona.app',
  appName: 'Sazoná',
  webDir: 'dist',
  server: isDev
    ? { url: process.env.CAP_DEV_SERVER_URL ?? 'http://localhost:5173', cleartext: true }
    : undefined,
};

export default config;
