import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../hooks/useAuth";

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login"); // not logged in -> force to login
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)"); // already logged in -> skip login screen
    }
  }, [user, isLoading, segments]);

  if (isLoading) return null; // could swap for a splash/loading screen

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
