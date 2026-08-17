import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { LiveMatchMiniBar } from "@/components/live-match-mini-bar";
import { palette } from "@/lib/palette";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primaryDark,
        tabBarInactiveTintColor: palette.muted,
        tabBarActiveBackgroundColor: palette.primarySoft,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 86,
          paddingBottom: 15,
          paddingTop: 10,
        },
        tabBarItemStyle: { borderRadius: 18, marginHorizontal: 4, marginVertical: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Squad",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: "Capture",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="squad" options={{ href: null }} />
    </Tabs>
    <LiveMatchMiniBar />
    </View>
  );
}
