// Plain JS config — used by EAS CLI (avoids TypeScript/ESM parsing issues)
const bundleId = "com.ashalabs.tactiqcoach";
const deepLinkScheme = "tactiqcoach";

module.exports = {
  // Keep the existing identifiers for the already-created App Store / Play listing.
  // The public app name is now Skilltracker everywhere a coach sees it.
  name: "Skilltracker",
  userInterfaceStyle: "automatic",
  slug: "tactiq",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: deepLinkScheme,
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "b26d9d51-1887-488d-bb6d-ed29ded055ea",
    },
  },
  owner: "asha-labs",
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#D5E7DD",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: bundleId,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: deepLinkScheme,
            host: "*",
          },
        ],
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
    "expo-apple-authentication",
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: "com.googleusercontent.apps.469394796444-kpntk6nvjo8u5sk5dko3e9eg7864q23p" },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#F6F8F4",
        dark: {
          backgroundColor: "#0E6D51",
        },
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
  updates: {
    url: "https://u.expo.dev/b26d9d51-1887-488d-bb6d-ed29ded055ea",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};
