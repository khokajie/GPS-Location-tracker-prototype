import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mymekdi.locationtracker',
  appName: 'Location Tracker',
  webDir: 'dist',
  plugins: {
    BackgroundGeolocation: {
      // Android foreground service notification
      backgroundMessage: 'Tracking location for mymekdi',
      backgroundTitle: 'Location Tracker Active',
    },
  },
};

export default config;
