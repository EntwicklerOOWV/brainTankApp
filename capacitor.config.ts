import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'swat.ionic.qf',
  appName: 'SmartWaterTankApp',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    scheme: 'SWAT',
  }
};

export default config;
