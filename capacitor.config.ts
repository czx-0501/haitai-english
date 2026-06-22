import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haitai.english',
  appName: '海苔英语',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#4f6ef7',
      overlaysWebView: false
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#4f6ef7'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4f6ef7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
