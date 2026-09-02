import { Ionicons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiFetch } from "../../api/client";
import type { EventItem, PaginatedResponse } from "../../api/types";

interface ScanShowResponse {
  status: boolean;
  information?: {
    id_number: string;
    name: string;
    user_id: string;
    user_type: string;
  };
  message?: string;
}

interface ScanStoreResponse {
  status: boolean;
  message: string;
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const params = useLocalSearchParams<{
    eventId?: string;
    eventTitle?: string;
  }>();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(
    params.eventId
      ? {
          id: Number(params.eventId),
          title: params.eventTitle ?? "",
          description: "",
          date: "",
          time_start: "",
          time_end: "",
        }
      : null,
  );
  const [todaysEvents, setTodaysEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedInfo, setScannedInfo] = useState<
    ScanShowResponse["information"] | null
  >(null);

  // Reset scan state (not the selected event) whenever this tab regains focus
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setScannedInfo(null);
    }, []),
  );

  useEffect(() => {
    apiFetch<PaginatedResponse<EventItem>>("/events")
      .then((res) => setTodaysEvents(res.data.filter((e) => isToday(e.date))))
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  async function handleScan({ data }: BarcodeScanningResult) {
    if (scanned || loading || !selectedEvent) return;
    setScanned(true);
    setLoading(true);

    try {
      const res = await apiFetch<ScanShowResponse>(
        `/scan?qr_code=${encodeURIComponent(data)}`,
      );

      if (!res.status || !res.information) {
        Alert.alert(
          "Invalid QR",
          res.message || "Could not read this QR code.",
          [{ text: "Scan Again", onPress: () => setScanned(false) }],
        );
        return;
      }

      setScannedInfo(res.information);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Something went wrong.",
        [{ text: "Try Again", onPress: () => setScanned(false) }],
      );
    } finally {
      setLoading(false);
    }
  }

  function cancelScan() {
    setScanned(false);
    setScannedInfo(null);
  }

  async function confirmAttendance() {
    if (!scannedInfo || !selectedEvent) return;
    setLoading(true);

    try {
      const res = await apiFetch<ScanStoreResponse>("/scan", {
        method: "POST",
        body: JSON.stringify({
          user_id: scannedInfo.user_id,
          user_type: scannedInfo.user_type,
          event: selectedEvent.id,
        }),
      });

      Alert.alert(res.status ? "Success" : "Failed", res.message, [
        { text: "OK", onPress: cancelScan },
      ]);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Something went wrong.",
        [{ text: "OK", onPress: cancelScan }],
      );
    } finally {
      setLoading(false);
    }
  }

  // Step 1: pick which of today's events this scanning session is for
  if (!selectedEvent) {
    if (eventsLoading)
      return <ActivityIndicator size="large" style={{ flex: 1 }} />;

    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>Select Today's Event</Text>
        <Text style={styles.pickerSubtitle}>
          Choose which event you're scanning attendance for.
        </Text>
        <FlatList
          data={todaysEvents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ gap: 10, padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No events scheduled today.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.eventCard}
              onPress={() => setSelectedEvent(item)}
            >
              <Ionicons name="calendar" size={20} color="#2563eb" />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                  {item.time_start} - {item.time_end}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>
          )}
        />
      </View>
    );
  }

  if (!permission) return <ActivityIndicator style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Camera access is needed to scan attendance QR codes.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  // Step 2: camera scanning, locked to the selected event
  return (
    <View style={styles.container}>
      <View style={styles.eventBanner}>
        <Text style={styles.eventBannerText} numberOfLines={1}>
          Scanning for: {selectedEvent.title}
        </Text>
        <Pressable onPress={() => setSelectedEvent(null)}>
          <Text style={styles.changeEventText}>Change</Text>
        </Pressable>
      </View>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {scannedInfo && !loading && (
        <View style={styles.resultCard}>
          <Text style={styles.resultName}>{scannedInfo.name}</Text>
          <Text style={styles.resultId}>ID: {scannedInfo.id_number}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              style={[styles.button, { flex: 1 }]}
              onPress={confirmAttendance}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
              onPress={cancelScan}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  permissionText: { textAlign: "center", fontSize: 15, color: "#334155" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    gap: 6,
  },
  resultName: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  resultId: { color: "#64748b", marginBottom: 4 },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSecondary: { backgroundColor: "#94a3b8" },
  buttonText: { color: "#fff", fontWeight: "600" },
  eventBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventBannerText: {
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  changeEventText: { color: "#93c5fd", fontWeight: "600" },
  pickerContainer: { flex: 1, backgroundColor: "#f8fafc" },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "700",
    padding: 16,
    paddingBottom: 4,
    color: "#0f172a",
  },
  pickerSubtitle: { paddingHorizontal: 16, color: "#64748b", marginBottom: 4 },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  eventTitle: { fontWeight: "700", color: "#0f172a" },
  eventTime: { color: "#64748b", fontSize: 13, marginTop: 2 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
});
