const fs = require('fs');
const path = require('path');

// Para dev local usa EXPO_PUBLIC_CLIENT; para EAS build usa CLIENT
const CLIENT = process.env.CLIENT || process.env.EXPO_PUBLIC_CLIENT || 'ails-events';

/** Incluye la propiedad solo si el archivo existe en disco */
const ifExists = (filePath) =>
  fs.existsSync(path.resolve(__dirname, filePath)) ? filePath : undefined;

const clients = {
  'ails-events': {
    name: 'AIL Events',
    slug: 'ails-events',
    scheme: 'ailsevents',
    version: '1.0.0',
    buildNumber: '1',
    versionCode: 1,
    runtimeVersion: '1.0.0',
    ios: {
      bundleIdentifier: 'com.geniality.ailsevents',
      googleServicesFile: './GoogleService-Info-ails.plist',
      splash: './assets/icons/APP-CUMBRE_SPLASH.png',
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "This app allows users to upload photos related to the event.",
        NSPhotoLibraryAddUsageDescription:
          "This app allows users to save photos.",
      },
    },
    android: {
      package: 'com.geniality.ailsevents',
      googleServicesFile: './google-services-ails.json',
      icon: './assets/icons/LOGO_1024X1024_TIENDAS.png',
      splash: './assets/icons/APP-CUMBRE_SPLASH.png',
    },
    eas: {
      projectId: '0a723d68-5afc-4d64-89df-3f0d29d8a89e',
      owner: 'geniality',
      updatesUrl: 'https://u.expo.dev/0a723d68-5afc-4d64-89df-3f0d29d8a89e',
    },
  },
  // acho: {
  //   name: 'AchoApp',
  //   slug: 'gen-notifications',
  //   scheme: 'achoapp',
  //   version: '1.0.9',
  //   buildNumber: '1.0.9',
  //   versionCode: 37,
  //   runtimeVersion: '1.0.9',
  //   ios: {
  //     bundleIdentifier: 'com.acho.eventosactualidad',
  //     googleServicesFile: './GoogleService-Info.plist',
  //     splash: './assets/icons/APP_ACHO_SPLASH_FULL.png',
  //   },
  //   android: {
  //     package: 'com.geniality.achoapp',
  //     googleServicesFile: './google-services.json',
  //     icon: './assets/icons/icon-android.png',
  //     splash: './assets/icons/APP_ACHO_SPLASH_FULL.png',
  //   },
  //   eas: {
  //     projectId: '7b771362-c331-49ce-94fd-f43d171a309e',
  //     owner: 'geniality',
  //     updatesUrl: 'https://u.expo.dev/7b771362-c331-49ce-94fd-f43d171a309e',
  //   },
  // },
};

const cfg = clients[CLIENT] ?? clients['ails-events'];

module.exports = {
  expo: {
    name: cfg.name,
    slug: cfg.slug,
    version: cfg.version,
    orientation: 'portrait',
    icon: cfg.android.icon,
    scheme: cfg.scheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: cfg.ios.splash,
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: cfg.ios.bundleIdentifier,
      ...(ifExists(cfg.ios.googleServicesFile) && { googleServicesFile: cfg.ios.googleServicesFile }),
      buildNumber: cfg.buildNumber,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          `${cfg.name} requiere acceso a la ubicación mientras se utiliza para personalizar la experiencia.`,
        ...(cfg.ios.infoPlist ?? {}),
        UIBackgroundModes: ['fetch', 'remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_API_KEY,
      },
    },
    android: {
      versionCode: cfg.versionCode,
      package: cfg.android.package,
      ...(ifExists(cfg.android.googleServicesFile) && { googleServicesFile: cfg.android.googleServicesFile }),
      adaptiveIcon: {
        foregroundImage: cfg.android.icon,
        backgroundColor: '#ffffff',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'READ_MEDIA_IMAGES',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_API_KEY,
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: cfg.android.icon,
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            // usesCleartextTraffic: true,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
      'expo-router',
      'react-native-video',
      'expo-notifications',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: cfg.eas.projectId,
      },
      /** Expose CLIENT to runtime via expo-constants */
      clientId: CLIENT,
    },
    owner: cfg.eas.owner,
    runtimeVersion: cfg.runtimeVersion,
    updates: {
      url: cfg.eas.updatesUrl,
    },
  },
};
