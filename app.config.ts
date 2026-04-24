import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const bundleId = "com.guerraf1000.finance";
const schemeFromBundleId = "guerraf1000finance";

const env = {
  appName: "Meu Financeiro",
  appSlug: "gestao-financeira-mobile",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663544620381/ecpny2LnHpX9ugp4v9hDvs/meu-financeiro-icon-E6QXrJsu4UNvaXTCSipTpy.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.14b2",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    versionCode: 10014,
    package: env.androidPackage,
    googleServicesFile: "./google-services.json", // 🔥 ADIÇÃO NECESSÁRIA
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "POST_NOTIFICATIONS", 
      "RECEIVE_BOOT_COMPLETED", // Adicione essas permissões para garantir o funcionamento
      "WAKE_LOCK"
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: env.scheme, host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    ["@react-native-firebase/app"], // 🔥 ADIÇÃO NECESSÁRIA
    ["@react-native-firebase/messaging"], // 🔥 ADIÇÃO NECESSÁRIA
    [
      "expo-audio",
      { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." },
    ],
    [
      "expo-video",
      { supportsBackgroundPlayback: true, supportsPictureInPicture: true },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: "5dc96cef-125d-4434-b4b8-91a59b48db90",
    },
  },
};

export default config;
