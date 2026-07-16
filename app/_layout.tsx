import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WorkspaceProvider } from "@/contexts/workspace-context";
import { palette } from "@/lib/palette";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <WorkspaceProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: palette.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="assessment" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="match/setup" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="match/live/[id]" options={{ gestureEnabled: false }} />
            <Stack.Screen name="settings" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </WorkspaceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
