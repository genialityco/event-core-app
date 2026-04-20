import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { useTranslation } from "@/src/i18n";
import { colors, spacing, typography, useBrandedColors } from "@/src/theme";
import { useEvent } from "@/context/EventContext";
import { get } from "@/src/core";
import { SpeakerDetailModal } from "../components/SpeakerDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Speaker {
  _id: string;
  names: string;
  description?: string;
  location?: string;
  profession?: string;
  role?: string;
  isInternational?: boolean;
  imageUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;

// ─── Speaker Card ─────────────────────────────────────────────────────────────

interface SpeakerWithSessionCount extends Speaker {
  sessionCount: number;
}

const SpeakerCard: React.FC<{ speaker: Speaker; onPress: () => void }> = ({
  speaker,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const cardStyle = speaker.isInternational
    ? styles.cardInternational
    : styles.card;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {/* Photo */}
        <View style={styles.cardPhotoContainer}>
          {speaker.imageUrl ? (
            <Image
              source={{ uri: speaker.imageUrl }}
              style={styles.cardPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
              <Text style={styles.cardPhotoInitial}>
                {speaker.names?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>
            {speaker.names}
          </Text>
          {!!speaker.role && (
            <Text style={styles.cardProfession} numberOfLines={2}>
              {speaker.role}
            </Text>
          )}
          {!!speaker.location && (
            <Text style={styles.cardLocation} numberOfLines={1}>
              📍 {speaker.location}
            </Text>
          )}
          <View style={styles.cardFooter}>
            {speaker.isInternational ? (
              <View style={styles.intlBadge}>
                <Text style={styles.intlBadgeText}>🌎 Internacional</Text>
              </View>
            ) : (
              <View style={styles.nationalBadge}>
                <Text style={styles.nationalBadgeText}>🇨🇴 Nacional</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const SpeakersScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Speaker | null>(null);
  const [speakerSessionCounts, setSpeakerSessionCounts] = useState<
    Record<string, number>
  >({});

  const loadSpeakers = useCallback(
    async (isRefresh = false) => {
      if (!activeEventId) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        // Load all speakers with pagination to get ALL results
        let allSpeakers: Speaker[] = [];
        let pageNum = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
          try {
            const res = await get<any>(`/events/${activeEventId}/speakers`, {
              params: { pageSize, current: pageNum },
            });
            const items: Speaker[] =
              res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);

            if (!items || items.length === 0) {
              hasMore = false;
            } else {
              allSpeakers = [...allSpeakers, ...items];
              hasMore = items.length === pageSize;
              pageNum++;
            }
          } catch {
            hasMore = false;
          }
        }

        setSpeakers(allSpeakers);

        // Load session counts
        try {
          const agendasRes = await get<any>(`/events/${activeEventId}/agendas`);
          const agendas: any[] = Array.isArray(agendasRes)
            ? agendasRes
            : (agendasRes?.items ?? agendasRes?.data?.items ?? []);
          const counts: Record<string, number> = {};

          for (const speaker of allSpeakers) {
            let count = 0;
            for (const agenda of agendas) {
              if (!agenda.isPublished) continue;
              for (const session of agenda.sessions ?? []) {
                const hasSpeaker = (session.speakers ?? []).some(
                  (sp: any) =>
                    (typeof sp === "object" ? sp._id : sp) === speaker._id,
                );
                if (hasSpeaker) count++;
              }
            }
            counts[speaker._id] = count;
          }
          setSpeakerSessionCounts(counts);
        } catch {
          // silent
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeEventId],
  );

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  // Sort speakers by session count (descending)
  const sortedSpeakers = useMemo(() => {
    return [...speakers].sort((a, b) => {
      const countA = speakerSessionCounts[a._id] ?? 0;
      const countB = speakerSessionCounts[b._id] ?? 0;
      return countB - countA;
    });
  }, [speakers, speakerSessionCounts]);

  const handleSelectSpeaker = (speaker: Speaker) => {
    setSelected(speaker);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={bc.primary} />
      </View>
    );
  }

  if (speakers.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🎤</Text>
        <Text style={styles.emptyTitle}>{t("speaker.title")}</Text>
        <Text style={styles.emptyText}>{t("base.empty")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedSpeakers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSpeakers(true)}
            colors={[bc.primary]}
            tintColor={bc.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("speaker.title")}</Text>
            <Text style={styles.headerSubtitle}>
              {speakers.length}{" "}
              {speakers.length === 1 ? "conferencista" : "conferencistas"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SpeakerCard
            speaker={item}
            onPress={() => handleSelectSpeaker(item)}
          />
        )}
      />

      <SpeakerDetailModal
        visible={!!selected}
        speaker={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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

  grid: { paddingHorizontal: spacing.md, paddingBottom: 100 },

  // Card
  card: {
    flexDirection: "row",
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFC107",
    overflow: "hidden",
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardInternational: {
    flexDirection: "row",
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "hidden",
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardPhotoContainer: {
    width: 120,
    height: 120,
    overflow: "hidden",
  },
  cardPhoto: {
    width: "100%",
    height: "100%",
  },
  cardPhotoPlaceholder: {
    backgroundColor: colors.primary + "33",
    justifyContent: "center",
    alignItems: "center",
  },
  cardPhotoInitial: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.primary,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  cardFooter: {
    alignItems: "flex-end",
    marginTop: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  cardName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "700",
    flex: 1,
    lineHeight: 22,
  },
  cardProfession: {
    ...typography.body2,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  cardLocation: {
    ...typography.body2,
    color: colors.text.secondary,
    fontSize: 12,
  },

  intlBadge: {
    backgroundColor: colors.primary + "25",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary + "50",
  },
  intlBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  nationalBadge: {
    backgroundColor: colors.primary + "25",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary + "50",
  },
  nationalBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },

  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: "700",
  },
  emptyText: { ...typography.body1, color: colors.text.secondary },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalTopBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
});
