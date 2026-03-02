import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eed02dece8b24e5ea52f9a4de393a610',
  appName: 'second-local-brain',
  webDir: 'dist',
  server: {
    url: 'https://eed02dec-e8b2-4e5e-a52f-9a4de393a610.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    // Keep audio session active in background for voice recording
    CapacitorHttp: {
      enabled: true,
    },
  },
  ios: {
    // Enable background audio mode for voice recording when screen is off
    backgroundColor: '#0A0A0A',
  },
  android: {
    backgroundColor: '#0A0A0A',
  },
};

export default config;
