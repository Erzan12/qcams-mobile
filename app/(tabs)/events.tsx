import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiFetch } from "../../api/client";

interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time_start: string;
  time_end: string;
}

interface EventsResponse {
  data: EventItem[];
}

type FilterKey = "upcoming" | "ongoing" | "past";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "past", label: "Past" },
];

function getEventStatus(event: EventItem): FilterKey {
  const now = new Date();
  const start = new Date(`${event.date}T${event.time_start}`);
  const end = new Date(`${event.date}T${event.time_end}`);

  // console.log("EVENT STATUS:", {
  //   title: event.title,
  //   now: now.toString(),
  //   date: event.date,
  //   time_start: event.time_start,
  //   time_end: event.time_end,
  //   start: start.toString(),
  //   end: end.toString(),
  //   startTimestamp: start.getTime(),
  //   endTimestamp: end.getTime(),
  //   nowTimestamp: now.getTime(),
  // });

  if (now < start) {
    console.log(event.title, "=> UPCOMING");
    return "upcoming";
  }

  if (now > end) {
    console.log(event.title, "=> PAST");
    return "past";
  }

  console.log(event.title, "=> ONGOING");
  return "ongoing";
}

export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("upcoming");

  const loadEvents = useCallback(async () => {
    try {
      const res = await apiFetch<EventsResponse>("/events");

      // console.log("EVENTS FROM API:", JSON.stringify(res.data, null, 2));

      setEvents(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    }
  }, []);

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  async function onRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  const filteredEvents = useMemo(
    () => events.filter((e) => getEventStatus(e) === filter),
    [events, filter],
  );

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.tab, filter === f.key && styles.tabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[styles.tabText, filter === f.key && styles.tabTextActive]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No {filter} events.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/event/[id]",
                params: { id: String(item.id) },
              })
            }
          >
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <Text style={styles.date}>
              {item.date} · {item.time_start} - {item.time_end}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#2563eb" },
  tabText: { color: "#64748b", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  date: { color: "#64748b", marginBottom: 6, fontSize: 13 },
  description: { color: "#334155" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  error: { color: "red", textAlign: "center", padding: 8 },
});
