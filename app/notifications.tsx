import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../api/client";
import type { NotificationItem, PaginatedResponse } from "../api/types";

const TYPE_ICONS: Record<
  NotificationItem["type"],
  keyof typeof Ionicons.glyphMap
> = {
  added_to_event: "calendar",
  login_open: "log-in",
  late_warning: "warning",
  login_cutoff: "close-circle",
  logout_open: "log-out",
};

const TYPE_COLORS: Record<
  NotificationItem["type"],
  { background: string; icon: string }
> = {
  added_to_event: {
    background: "#eff6ff",
    icon: "#2563eb",
  },
  login_open: {
    background: "#ecfdf5",
    icon: "#059669",
  },
  late_warning: {
    background: "#fffbeb",
    icon: "#d97706",
  },
  login_cutoff: {
    background: "#fef2f2",
    icon: "#dc2626",
  },
  logout_open: {
    background: "#f1f5f9",
    icon: "#64748b",
  },
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res =
        await apiFetch<PaginatedResponse<NotificationItem>>("/notifications");

      setItems(res.data);
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function markRead(notif: NotificationItem) {
    if (notif.read_at) return;

    setItems((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );

    try {
      await apiFetch(`/notifications/${notif.id}/read`, {
        method: "POST",
      });
    } catch {
      setItems((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_at: null } : n)),
      );
    }
  }

  async function markAllRead() {
    const now = new Date().toISOString();

    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? now,
      })),
    );

    try {
      await apiFetch("/notifications/read-all", {
        method: "POST",
      });
    } catch {
      load();
    }
  }

  async function handleNotificationPress(notification: NotificationItem) {
    await markRead(notification);

    /*
     * If the notification belongs to an event,
     * navigate directly to that event.
     *
     * Example:
     *
     * notification.event_id = 12
     */

    if (
      notification.type === "added_to_event" &&
      "event_id" in notification &&
      notification.event_id
    ) {
      router.push(`/event/${notification.event_id}`);
      return;
    }
  }

  function getActionLabel(notification: NotificationItem) {
    switch (notification.type) {
      case "added_to_event":
        return "View Event";

      case "login_open":
        return "View Attendance";

      case "late_warning":
        return "View Details";

      case "login_cutoff":
        return "View Details";

      case "logout_open":
        return "View Details";

      default:
        return "View";
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const unreadCount = items.filter((item) => !item.read_at).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Notifications",
            headerRight: () =>
              unreadCount > 0 ? (
                <Pressable onPress={markAllRead} hitSlop={10}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </Pressable>
              ) : null,
          }}
        />

        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            items.length > 0 ? (
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Notifications</Text>

                  <Text style={styles.headerSubtitle}>
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount > 1 ? "s" : ""
                        }`
                      : "You're all caught up"}
                  </Text>
                </View>

                <View style={styles.notificationCount}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#2563eb"
                  />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-off-outline"
                  size={36}
                  color="#94a3b8"
                />
              </View>

              <Text style={styles.emptyTitle}>No notifications</Text>

              <Text style={styles.emptyText}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const colors = TYPE_COLORS[item.type] ?? TYPE_COLORS.logout_open;

            const icon = TYPE_ICONS[item.type] ?? "notifications-outline";

            return (
              <View style={[styles.card, !item.read_at && styles.cardUnread]}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => handleNotificationPress(item)}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Ionicons name={icon} size={21} color={colors.icon} />
                  </View>

                  {/* Content */}
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.title,
                          !item.read_at && styles.unreadTitle,
                        ]}
                      >
                        {item.title}
                      </Text>

                      {!item.read_at && <View style={styles.dot} />}
                    </View>

                    <Text style={styles.message}>{item.message}</Text>

                    <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                  </View>
                </Pressable>

                {/* Action */}
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleNotificationPress(item)}
                >
                  <Text style={styles.actionText}>{getActionLabel(item)}</Text>

                  <Ionicons name="chevron-forward" size={16} color="#2563eb" />
                </Pressable>
              </View>
            );
          }}
        />
      </View>
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

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    color: "#64748b",
    marginTop: 10,
    fontSize: 14,
  },

  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 3,
  },

  notificationCount: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Notification Card */

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  cardUnread: {
    backgroundColor: "#fff",
    borderColor: "#dbeafe",
  },

  cardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  unreadTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },

  message: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 5,
  },

  time: {
    color: "#94a3b8",
    fontSize: 11,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563eb",
    marginLeft: 8,
  },

  /* Action */

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingLeft: 54,
  },

  actionText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 3,
  },

  markAllText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Empty State */

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
