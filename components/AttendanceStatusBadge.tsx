import { StyleSheet, Text, View } from "react-native";

const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> =
  {
    0: { label: "Not Yet Attended", color: "#64748b", bg: "#f1f5f9" },
    1: { label: "Logged In", color: "#2563eb", bg: "#dbeafe" },
    2: { label: "Present", color: "#059669", bg: "#d1fae5" },
    3: { label: "Absent", color: "#dc2626", bg: "#fee2e2" },
  };

export function AttendanceStatusBadge({ status }: { status: number }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP[0];
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "600" },
});
