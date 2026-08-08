import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { apiFetch } from "../../api/client";

interface QrCodeResponse {
  qr_code: string;
}

export default function MyQrCodeScreen() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<QrCodeResponse>("/my-qrcode")
      .then((data) => setQrCode(data.qr_code))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!qrCode) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Show this to be scanned in</Text>
      <QRCode value={qrCode} size={240} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  label: { fontSize: 16, fontWeight: "600" },
  error: { color: "red", textAlign: "center", marginTop: 40 },
});
