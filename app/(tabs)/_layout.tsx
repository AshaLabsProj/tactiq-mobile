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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="squad"
        options={{
          title: "Squad",
          tabBarIcon: ({ color }) => <IconSymbol name="person.3.fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: "Capture",
          tabBarIcon: ({ color }) => <IconSymbol name="plus.circle.fill" size={25} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
