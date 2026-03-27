import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.snapowner.app',
  appName: 'SnapOwner',
  webDir: 'out',
  server: {
    // Allow loading from snapowner.com API in the native app
    allowNavigation: ['snapowner.com', '*.snapowner.com'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
    },
  },
};

export default config;
