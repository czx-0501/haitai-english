import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haitai.english',
  appName: '海苔英语',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
