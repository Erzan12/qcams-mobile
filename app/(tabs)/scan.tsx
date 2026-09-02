import {
    BarcodeScanningResult,
    CameraView,
    useCameraPermissions,
} from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { apiFetch } from "../../api/client";

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

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedInfo, setScannedInfo] = useState<
    ScanShowResponse["information"] | null
  >(null);

  // Reset scanned state each time the tab regains focus, so re-opening Scan doesn't stay frozen on the last result
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setScannedInfo(null);
    }, []),
  );

  async function handleScan({ data }: BarcodeScanningResult) {
    if (scanned || loading) return;
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

  async function confirmAttendance(eventId: number) {
    if (!scannedInfo) return;
    setLoading(true);

    try {
      const res = await apiFetch<ScanStoreResponse>("/scan", {
        method: "POST",
        body: JSON.stringify({
          user_id: scannedInfo.user_id,
          user_type: scannedInfo.user_type,
          event: eventId,
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

  return (
    <View style={styles.container}>
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
          <Text style={styles.resultNote}>
            Enter the event ID to log attendance for this person.
          </Text>
          <EventIdPrompt onConfirm={confirmAttendance} onCancel={cancelScan} />
        </View>
      )}
    </View>
  );
}

function EventIdPrompt({
  onConfirm,
  onCancel,
}: {
  onConfirm: (eventId: number) => void;
  onCancel: () => void;
}) {
  const [eventId, setEventId] = useState("");

  return (
    <View style={{ gap: 10 }}>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3"
        value={eventId}
        onChangeText={setEventId}
        keyboardType="number-pad"
      />
      <Pressable
        style={styles.button}
        onPress={() => {
          const id = parseInt(eventId, 10);
          if (!isNaN(id)) onConfirm(id);
        }}
      >
        <Text style={styles.buttonText}>Confirm Attendance</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.buttonSecondary]}
        onPress={onCancel}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </Pressable>
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
  resultId: { color: "#64748b", marginBottom: 8 },
  resultNote: { color: "#334155", fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSecondary: { backgroundColor: "#94a3b8" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
