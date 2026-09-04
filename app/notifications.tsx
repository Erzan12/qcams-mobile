// app/notifications.tsx

import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  {
    background: string;
    icon: string;
  }
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

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

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

  // --------------------------------------------------
  // MARK AS READ
  // --------------------------------------------------

  async function markRead(notification: NotificationItem) {
    if (notification.read_at) return;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              read_at: new Date().toISOString(),
            }
          : item,
      ),
    );

    try {
      await apiFetch(`/notifications/${notification.id}/read`, {
        method: "POST",
      });
    } catch {
      load();
    }
  }

  // --------------------------------------------------
  // MARK AS UNREAD
  // --------------------------------------------------

  async function markUnread(notification: NotificationItem) {
    if (!notification.read_at) return;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              read_at: null,
            }
          : item,
      ),
    );

    try {
      await apiFetch(`/notifications/${notification.id}/unread`, {
        method: "POST",
      });
    } catch {
      load();
    }
  }

  // --------------------------------------------------
  // MARK ALL AS READ
  // --------------------------------------------------

  async function markAllRead() {
    const now = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        read_at: item.read_at ?? now,
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

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  function confirmDelete(notification: NotificationItem) {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNotification(notification),
        },
      ],
    );
  }

  async function deleteNotification(notification: NotificationItem) {
    // Optimistic UI update
    setItems((prev) => prev.filter((item) => item.id !== notification.id));

    try {
      await apiFetch(`/notifications/${notification.id}`, {
        method: "DELETE",
      });
    } catch {
      // Restore list if deletion failed
      load();

      Alert.alert(
        "Delete Failed",
        "The notification could not be deleted. Please try again.",
      );
    }
  }

  // --------------------------------------------------
  // OPEN NOTIFICATION
  // --------------------------------------------------

  async function handleNotificationPress(notification: NotificationItem) {
    // Mark it read first
    await markRead(notification);

    // Navigate based on notification type
    if (notification.event_id) {
      router.push(`/event/${notification.event_id}`);
      return;
    }

    // If there's no event attached,
    // just leave it marked as read.
  }

  // --------------------------------------------------
  // ACTION MENU
  // --------------------------------------------------

  function showActions(notification: NotificationItem) {
    const isRead = !!notification.read_at;

    Alert.alert(notification.title, undefined, [
      {
        text: isRead ? "Mark as Unread" : "Mark as Read",
        onPress: () => {
          if (isRead) {
            markUnread(notification);
          } else {
            markRead(notification);
          }
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDelete(notification),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
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
                You&apos;re all caught up! New notifications will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const colors = TYPE_COLORS[item.type] ?? TYPE_COLORS.logout_open;

            const icon = TYPE_ICONS[item.type] ?? "notifications-outline";

            return (
              <View style={[styles.card, !item.read_at && styles.cardUnread]}>
                {/* Main notification */}
                <Pressable
                  style={styles.cardMain}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Ionicons name={icon} size={21} color={colors.icon} />
                  </View>

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

                {/* Bottom actions */}
                <View style={styles.actionRow}>
                  {item.event_id && (
                    <Pressable
                      style={styles.viewButton}
                      onPress={() => handleNotificationPress(item)}
                    >
                      <Text style={styles.viewButtonText}>View Event</Text>

                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color="#2563eb"
                      />
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.moreButton}
                    onPress={() => showActions(item)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color="#64748b"
                    />
                  </Pressable>
                </View>
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

  /* Card */

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

  /* Actions */

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    paddingLeft: 54,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },

  viewButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewButtonText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 2,
  },

  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },

  markAllText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Empty */

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
