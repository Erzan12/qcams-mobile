import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { apiFetch } from "../../api/client";
import type { EventItem } from "../../api/types";
import { useAuth } from "../../hooks/useAuth";

function isToday(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<EventItem>(`/events/${id}`)
      .then(setEvent)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load event"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || "Event not found"}</Text>
      </View>
    );
  }

  const canScan =
    (user?.role === "admin" || user?.role === "faculty") && isToday(event.date);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      <Stack.Screen options={{ title: event.title }} />

      <View style={styles.card}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.metaText}>
            {event.time_start} - {event.time_end}
          </Text>
        </View>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      {canScan && (
        <Pressable
          style={styles.scanButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/scan",
              params: { eventId: String(event.id), eventTitle: event.title },
            })
          }
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>
            Scan Attendance for This Event
          </Text>
        </Pressable>
      )}

      {!canScan && (user?.role === "admin" || user?.role === "faculty") && (
        <Text style={styles.notToday}>
          Scanning is only available on the event date ({event.date}).
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  error: { color: "#dc2626" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    gap: 8,
    elevation: 1,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: "#64748b" },
  description: { color: "#334155", marginTop: 10, lineHeight: 20 },
  scanButton: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#059669",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  scanButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  notToday: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 20,
    fontSize: 13,
  },
});
