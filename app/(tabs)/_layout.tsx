// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function TabLayout() {
  const { user } = useAuth();

  const canShowQr = user?.role === "student" || user?.role === "faculty";
  const canScan = user?.role === "admin" || user?.role === "faculty";

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2563eb" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-qrcode"
        options={{
          title: "My QR",
          href: canShowQr ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          href: canScan ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
