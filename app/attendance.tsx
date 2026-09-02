import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { apiFetch } from "../api/client";
import type { AttendanceRecord, PaginatedResponse } from "../api/types";
import { AttendanceStatusBadge } from "../components/AttendanceStatusBadge";

export default function AttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(async (pageNum: number) => {
    const res = await apiFetch<PaginatedResponse<AttendanceRecord>>(
      `/my-attendance?page=${pageNum}`,
    );
    setLastPage(res.last_page);
    return res.data;
  }, []);

  useEffect(() => {
    loadPage(1).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  async function loadMore() {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const data = await loadPage(nextPage);
    setRecords((prev) => [...prev, ...data]);
    setPage(nextPage);
    setLoadingMore(false);
  }

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "My Attendance" }} />
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 12 }} />
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No attendance records yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.title}>{item.event.title}</Text>
              <AttendanceStatusBadge status={item.is_present} />
            </View>
            <Text style={styles.date}>{item.event.date}</Text>
            {item.time_in && (
              <Text style={styles.meta}>Time In: {item.time_in}</Text>
            )}
            {item.time_out && (
              <Text style={styles.meta}>Time Out: {item.time_out}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontWeight: "700",
    fontSize: 15,
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  date: { color: "#64748b", fontSize: 13, marginBottom: 4 },
  meta: { color: "#334155", fontSize: 13 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
});
