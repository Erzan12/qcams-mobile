import { apiFetch } from "@/api/client";
import { AttendanceRecord, PaginatedResponse } from "@/api/types";
import { AttendanceStatusBadge } from "@/components/AttendanceStatusBadge";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") return; // admins has no attendance records
    apiFetch<PaginatedResponse<AttendanceRecord>>("/my-attendance?per_page=5")
      .then((res) => setAttendance(res.data))
      .catch(() => {})
      .finally(() => setAttendanceLoading(false));
  }, [user]);

  function confirmLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const profile = user?.profile as Record<string, string> | undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <Pressable onPress={confirmLogout} hitSlop={12}>
          <Ionicons name="log-out-outline" size={26} color="#dc2626" />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Details</Text>
        <DetailRow label="Role" value={user?.role} />
        {profile?.id_number && (
          <DetailRow label="ID Number" value={profile.id_number} />
        )}
        {profile?.department && (
          <DetailRow label="Department" value={profile.department} />
        )}
        {profile?.section && (
          <DetailRow label="Section" value={profile.section} />
        )}
        {profile?.year_level && (
          <DetailRow label="Year Level" value={profile.year_level} />
        )}
        {profile?.email && <DetailRow label="Email" value={profile.email} />}
      </View>

      {user?.role !== "admin" && (
        <View style={[styles.card, { marginTop: 20 }]}>
          <View style={styles.attendanceHeader}>
            <Text style={styles.cardTitle}>Event Participation</Text>
            <Pressable onPress={() => router.push("/attendance")}>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          {attendanceLoading ? (
            <ActivityIndicator />
          ) : attendance.length === 0 ? (
            <Text style={styles.emptyText}>No event attendance yet.</Text>
          ) : (
            attendance.map((record) => (
              <View key={record.id} style={styles.attendanceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{record.event.title}</Text>
                  <Text style={styles.eventDate}>{record.event.date}</Text>
                </View>
                <AttendanceStatusBadge status={record.is_present} />
              </View>
            ))
          )}
        </View>
      )}

      {/* {user?.role !== "admin" && (
        <Pressable
          style={styles.qrShortcut}
          onPress={() => router.push("/(tabs)/my-qrcode")}
        >
          <Ionicons name="qr-code" size={22} color="#fff" />
          <Text style={styles.qrShortcutText}>Show My QR Code</Text>
        </Pressable>
      )} */}
      {user?.role !== "admin" && (
        <Pressable
          style={styles.qrShortcut}
          onPress={() => router.push("/(tabs)/my-qrcode")}
        >
          <Ionicons name="qr-code" size={22} color="#fff" />
          <Text style={styles.qrShortcutText}>Show My QR Code</Text>
        </Pressable>
      )}
      {/* {(user?.role === 'admin' || user?.role === 'faculty') && (
        <Pressable style={[styles.qrShortcut, { backgroundColor: '#059669', marginTop: 12 }]} onPress={() => router.push('/(tabs)/scan')}>
          <Ionicons name="scan" size={22} color="#fff" />
          <Text style={styles.qrShortcutText}>Scan Attendance</Text>
        </Pressable>
      )} */}
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 15, color: "#64748b" },
  name: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
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
    marginBottom: 12,
    color: "#334155",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: { color: "#64748b" },
  rowValue: { fontWeight: "600", color: "#0f172a" },
  qrShortcut: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qrShortcutText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAll: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  eventTitle: { fontWeight: "600", color: "#0f172a" },
  eventDate: { color: "#64748b", fontSize: 12, marginTop: 2 },
  emptyText: { color: "#94a3b8", textAlign: "center", paddingVertical: 12 },
});
