/**
 * Tab layout — "Two Doors" navigation model
 *
 * 3 visible tabs:
 *   Home   → Two Doors entry point (Match Day | Player Development)
 *   Squad  → Player Development hub (assess, review, track growth)
 *   More   → Settings / account
 *
 * Capture and Insights tabs are hidden — their content is reached
 * through the Match Day door or the Squad/Player screens instead.
 */
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { palette } from "@/lib/palette";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarStyle: {
          height: 58 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* ── Visible tabs ─────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="squad"
        options={{
          title: "Players",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.3.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.bar.fill" size={24} color={color} />
          ),
        }}
      />

      {/* ── Hidden tabs (content reachable via deep links / doors) ──── */}
      <Tabs.Screen
        name="capture"
        options={{
          href: null, // hide from tab bar
        }}
      />
    </Tabs>
  );
}
