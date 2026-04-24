import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { get } from "@/src/core";
import { useTenant } from "@/context/TenantContext";
import { useEvent } from "@/context/EventContext";
import { useTranslation } from "@/src/i18n";
import { colors, spacing, typography, useBrandedColors } from "@/src/theme";

interface PreRegisteredAttendee {
  _id: string;
  email: string;
  organizationId: string;
  eventId: string | null;
  name: string | null;
  channel: string | null;
  position: string | null;
  observations: string | null;
  country: string | null;
  isActivated: boolean;
  activatedAt: string | null;
  activatedByUserId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function getOrganizationId(organization: any) {
  return organization?._id || organization?.id || organization?.organizationId;
}

function normalizeResponse(response: any): PreRegisteredAttendee[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.preRegisteredAttendees)) {
    return response.preRegisteredAttendees;
  }

  return [];
}

function getAttendeeName(
  attendee: PreRegisteredAttendee,
  fallbackText: string,
) {
  return attendee.name?.trim() || fallbackText;
}

function buildQueryString(params: Record<string, string | undefined>) {
  const queryParams = Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`;
    });

  return queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
}

export const ListAttendeesScreen: React.FC = () => {
  const { organization, isLoading: isTenantLoading } = useTenant();
  const { activeEventId } = useEvent();
  const { t } = useTranslation();
  const bc = useBrandedColors();

  const [attendees, setAttendees] = useState<PreRegisteredAttendee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const organizationId = getOrganizationId(organization);

  const loadAttendees = useCallback(
    async (isRefresh = false) => {
      if (isTenantLoading) return;

      if (!organizationId) {
        setAttendees([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const queryString = buildQueryString({
          eventId: activeEventId || undefined,
        });

        const response = await get<any>(
          `/admin/organizations/${organizationId}/pre-registered${queryString}`,
        );

        const items = normalizeResponse(response);

        const activatedAttendees = items.filter(
          (attendee) => attendee.isActivated === true,
        );

        setAttendees(activatedAttendees);
      } catch (error) {
        console.error("Error loading activated attendees:", error);
        setAttendees([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [organizationId, activeEventId, isTenantLoading],
  );

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const filteredAttendees = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return attendees;

    return attendees.filter((attendee) => {
      const name = attendee.name?.toLowerCase() || "";
      const channel = attendee.channel?.toLowerCase() || "";
      const position = attendee.position?.toLowerCase() || "";
      const country = attendee.country?.toLowerCase() || "";

      return (
        name.includes(value) ||
        channel.includes(value) ||
        position.includes(value) ||
        country.includes(value)
      );
    });
  }, [attendees, search]);

  if (loading || isTenantLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={bc.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttendees(true)}
            colors={[bc.primary]}
            tintColor={bc.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("listAttendees.title")}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const name = getAttendeeName(
            item,
            t("listAttendees.unnamedAttendee"),
          );

          return (
            <View style={styles.listItem}>
              <Text style={styles.listName} numberOfLines={1}>
                {name}
              </Text>

              <View style={styles.infoList}>
                {!!item.channel && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      {t("listAttendees.channel")}:
                    </Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {item.channel}
                    </Text>
                  </View>
                )}

                {!!item.position && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      {t("listAttendees.position")}:
                    </Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {item.position}
                    </Text>
                  </View>
                )}

                {!!item.country && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      {t("listAttendees.country")}:
                    </Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {item.country}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {t("listAttendees.emptyTitle")}
            </Text>
            <Text style={styles.emptyText}>{t("listAttendees.emptyText")}</Text>
          </View>
        }
      />
    </View>
  );
};

export default ListAttendeesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },

  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: "700",
    marginBottom: spacing.md,
  },

  searchInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    fontSize: 15,
  },

  listItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  listName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },

  infoList: {
    gap: 6,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: "700",
    minWidth: 80,
  },

  infoValue: {
    ...typography.body2,
    color: colors.text.primary,
    flex: 1,
  },

  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
  },

  emptyTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: 6,
  },
});
