import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";
import { useTranslation } from "@/src/i18n";
import { colors, spacing, typography, useBrandedColors } from "@/src/theme";
import { useEvent } from "@/context/EventContext";
import { get } from "@/src/core";
import { InfoDetailModal } from "./InfoDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfoItem {
  _id: string;
  title: string;
  title_en?: string;
  category: string;
  icon: string;
  content: string;
  content_en?: string;
  coverImageUrl?: string;
  order: number;
}

// ─── Category Configuration ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  passport: {
    label: "Pasaporte",
    icon: "🛂",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  visa: {
    label: "Visa",
    icon: "📋",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  airlines: {
    label: "Aerolíneas",
    icon: "✈️",
    color: "#06B6D4",
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
  payment: {
    label: "Pago",
    icon: "💳",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  transport: {
    label: "Transporte",
    icon: "🚌",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
  accommodation: {
    label: "Alojamiento",
    icon: "🏨",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.1)",
  },
  plugs: {
    label: "Enchufes",
    icon: "🔌",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  tourism: {
    label: "Turismo",
    icon: "🗺️",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.1)",
  },
  security: {
    label: "Seguridad",
    icon: "🔒",
    color: "#14B8A6",
    bgColor: "rgba(20, 184, 166, 0.1)",
  },
  general: {
    label: "General",
    icon: "📌",
    color: "#64748B",
    bgColor: "rgba(100, 116, 139, 0.1)",
  },
};

const getIcon = (item: InfoItem) =>
  item.icon || CATEGORY_CONFIG[item.category]?.icon || "📌";

const getCategoryConfig = (category: string) =>
  CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;

// Strip HTML tags for card preview
const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const shimmer = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonCover, { opacity }]} />
      <View style={styles.cardBody}>
        <Animated.View style={[styles.skeletonIcon, { opacity }]} />
        <View style={styles.cardText}>
          <Animated.View style={[styles.skeletonTitle, { opacity }]} />
          <Animated.View
            style={[styles.skeletonText, { opacity, marginTop: 8 }]}
          />
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const UsefulInfoScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();
  const { width } = useWindowDimensions();

  const lang = i18n.language ?? "es";
  const localized = (base: string, translated?: string) => {
    if (lang.startsWith("en") && translated?.trim()) return translated;
    return base;
  };

  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<InfoItem | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadItems = useCallback(
    async (isRefresh = false) => {
      if (!activeEventId) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await get<any>(`/events/${activeEventId}/useful-info`);
        const data: InfoItem[] = Array.isArray(res)
          ? res
          : (res?.items ?? res?.data?.items ?? []);
        // Sort by order field
        const sorted = [...data].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setItems(sorted);

        // Animate in
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } catch {
        // silent
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeEventId, fadeAnim],
  );

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Items are already sorted by order field from the API
  // No need to group by category to preserve order

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.skeletonTitle} />
            <View style={[styles.skeletonText, { marginTop: 8 }]} />
          </View>
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              colors={[bc.primary]}
              tintColor={bc.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>📄</Text>
            </View>
            <Text style={styles.emptyTitle}>{t("usefulInfo.title")}</Text>
            <Text style={styles.emptyText}>{t("usefulInfo.empty")}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadItems(true)}
            colors={[bc.primary]}
            tintColor={bc.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("usefulInfo.title")}</Text>
          <Text style={styles.headerSubtitle}>{t("usefulInfo.subtitle")}</Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Items in order */}
        {items.map((item, itemIdx) => (
          <Animated.View
            key={item._id}
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30 + itemIdx * 5, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelected(item)}
              activeOpacity={0.7}
            >
              {item.coverImageUrl ? (
                <Image
                  source={{ uri: item.coverImageUrl }}
                  style={styles.cardCover}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.cardCoverPlaceholder}>
                  <Text style={styles.cardCoverIcon}>
                    {getCategoryConfig(item.category).icon}
                  </Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <View
                  style={[
                    styles.cardIconBox,
                    {
                      backgroundColor: getCategoryConfig(item.category)
                        .bgColor,
                    },
                  ]}
                >
                  <Text style={styles.cardIcon}>{getIcon(item)}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {localized(item.title, item.title_en)}
                  </Text>
                  {item.content ? (
                    <Text style={styles.cardPreview} numberOfLines={1}>
                      {stripHtml(localized(item.content, item.content_en))}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardArrowBox}>
                  <Text style={styles.cardArrow}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Detail Modal */}
      <InfoDetailModal
        visible={!!selected}
        item={selected}
        categoryConfig={
          selected
            ? getCategoryConfig(selected.category)
            : getCategoryConfig("general")
        }
        onClose={() => setSelected(null)}
        localized={localized}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },

  // ─ Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: "700",
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: 4,
  },
  headerDivider: {
    height: 2,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    borderRadius: 1,
  },

  // ─ Skeleton Loaders
  skeletonCover: {
    width: "100%",
    height: 140,
    backgroundColor: colors.border,
    borderRadius: 14,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.border,
    borderRadius: 12,
    flexShrink: 0,
  },
  skeletonTitle: {
    width: "60%",
    height: 18,
    backgroundColor: colors.border,
    borderRadius: 6,
  },
  skeletonText: {
    width: "80%",
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
  },

  // ─ Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: "center",
  },

  // ─ Card
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCover: { width: "100%", height: 170 },
  cardCoverPlaceholder: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCoverIcon: { fontSize: 48 },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  cardIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardIcon: { fontSize: 28 },
  cardText: { flex: 1, justifyContent: "center" },
  cardTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "600",
    lineHeight: 20,
  },
  cardPreview: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  cardArrowBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardArrow: { fontSize: 18, color: colors.text.secondary, fontWeight: "600" },
});
