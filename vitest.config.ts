import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "react-native": path.resolve(__dirname, "tests/mocks/react-native.ts"),
      "expo-secure-store": path.resolve(__dirname, "tests/mocks/expo-secure-store.ts"),
      "expo-linking": path.resolve(__dirname, "tests/mocks/expo-linking.ts"),
      "@react-native-async-storage/async-storage": path.resolve(__dirname, "tests/mocks/async-storage.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
