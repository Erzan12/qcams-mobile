import { Tabs } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      {user?.role !== "admin" && (
        <Tabs.Screen name="my-qrcode" options={{ title: "My QR" }} />
      )}
      {(user?.role === "admin" || user?.role === "faculty") && (
        <Tabs.Screen name="scan" options={{ title: "Scan" }} />
      )}
    </Tabs>
  );
}
