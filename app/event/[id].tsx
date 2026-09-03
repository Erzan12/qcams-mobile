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
import { SafeAreaView } from "react-native-safe-area-context";
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle-outline" size={32} color="#dc2626" />
        </View>

        <Text style={styles.errorTitle}>Unable to load event</Text>
        <Text style={styles.error}>{error || "Event not found"}</Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const canScan =
    (user?.role === "admin" || user?.role === "faculty") && isToday(event.date);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ title: "Event Details" }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Header */}
        <View style={styles.heroCard}>
          <View style={styles.eventIcon}>
            <Ionicons name="calendar" size={28} color="#2563eb" />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.eventLabel}>EVENT</Text>
            <Text style={styles.title}>{event.title}</Text>
          </View>
        </View>

        {/* Event Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{event.date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={20} color="#2563eb" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {event.time_start} - {event.time_end}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About This Event</Text>

          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : (
            <Text style={styles.emptyDescription}>
              No description provided for this event.
            </Text>
          )}
        </View>

        {/* Attendance Action */}
        {(user?.role === "admin" || user?.role === "faculty") && (
          <View style={styles.attendanceSection}>
            {canScan ? (
              <>
                <View style={styles.readyBadge}>
                  <View style={styles.readyDot} />
                  <Text style={styles.readyText}>Scanning available today</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.scanButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/scan",
                      params: {
                        eventId: String(event.id),
                        eventTitle: event.title,
                      },
                    })
                  }
                >
                  <View style={styles.scanIconContainer}>
                    <Ionicons name="scan-outline" size={24} color="#fff" />
                  </View>

                  <View style={styles.scanButtonContent}>
                    <Text style={styles.scanButtonTitle}>Scan Attendance</Text>
                    <Text style={styles.scanButtonSubtitle}>
                      Scan student QR codes for this event
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </Pressable>
              </>
            ) : (
              <View style={styles.notTodayCard}>
                <View style={styles.notTodayIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#64748b"
                  />
                </View>

                <View style={styles.notTodayContent}>
                  <Text style={styles.notTodayTitle}>
                    Attendance scanning unavailable
                  </Text>

                  <Text style={styles.notTodayText}>
                    Scanning will be available on the event date,{" "}
                    <Text style={styles.notTodayDate}>{event.date}</Text>.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    color: "#64748b",
    marginTop: 10,
    fontSize: 14,
  },

  /* Hero */

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  eventIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  heroContent: {
    flex: 1,
  },

  eventLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#2563eb",
    marginBottom: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 28,
  },

  /* Cards */

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 14,
  },

  /* Information */

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 14,
  },

  /* Description */

  description: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 23,
  },

  emptyDescription: {
    color: "#94a3b8",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 21,
  },

  /* Attendance */

  attendanceSection: {
    marginTop: 0,
  },

  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
  },

  readyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#059669",
    marginRight: 7,
  },

  readyText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  scanIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  scanButtonContent: {
    flex: 1,
  },

  scanButtonTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },

  scanButtonSubtitle: {
    color: "#d1fae5",
    fontSize: 12,
  },

  /* Unavailable scanning */

  notTodayCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  notTodayIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  notTodayContent: {
    flex: 1,
  },

  notTodayTitle: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },

  notTodayText: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },

  notTodayDate: {
    color: "#334155",
    fontWeight: "600",
  },

  /* Error */

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },

  error: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
