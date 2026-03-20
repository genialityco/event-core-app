import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get } from '@/src/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Speaker {
  _id: string;
  names: string;
  description?: string;
  location?: string;
  isInternational?: boolean;
  imageUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2;

// ─── Speaker Card ─────────────────────────────────────────────────────────────

const SpeakerCard: React.FC<{ speaker: Speaker; onPress: () => void }> = ({
  speaker,
  onPress,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {speaker.imageUrl ? (
        <Image
          source={{ uri: speaker.imageUrl }}
          style={styles.cardPhoto}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
          <Text style={styles.cardPhotoInitial}>
            {speaker.names?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      <View style={styles.cardBody}>
        {speaker.isInternational && (
          <View style={styles.intlBadge}>
            <Text style={styles.intlBadgeText}>🌎 {t('speaker.international')}</Text>
          </View>
        )}
        <Text style={styles.cardName} numberOfLines={2}>{speaker.names}</Text>
        {!!speaker.location && (
          <Text style={styles.cardLocation} numberOfLines={1}>📍 {speaker.location}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const SpeakersScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Speaker | null>(null);

  const loadSpeakers = useCallback(async (isRefresh = false) => {
    if (!activeEventId) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await get<any>(`/events/${activeEventId}/speakers`);
      const items: Speaker[] = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
      setSpeakers(items);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeEventId]);

  useEffect(() => { loadSpeakers(); }, [loadSpeakers]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (speakers.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🎤</Text>
        <Text style={styles.emptyTitle}>{t('speaker.title')}</Text>
        <Text style={styles.emptyText}>{t('base.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={speakers}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSpeakers(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('speaker.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {speakers.length} {speakers.length === 1 ? 'conferencista' : 'conferencistas'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SpeakerCard speaker={item} onPress={() => setSelected(item)} />
        )}
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalTopBar}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo */}
              <View style={styles.modalPhotoWrap}>
                {selected.imageUrl ? (
                  <Image
                    source={{ uri: selected.imageUrl }}
                    style={styles.modalPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalPhoto, styles.modalPhotoPlaceholder]}>
                    <Text style={styles.modalPhotoInitial}>
                      {selected.names?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalBody}>
                {selected.isInternational && (
                  <View style={[styles.intlBadge, { alignSelf: 'center', marginBottom: spacing.sm }]}>
                    <Text style={styles.intlBadgeText}>🌎 {t('speaker.international')}</Text>
                  </View>
                )}

                <Text style={styles.modalName}>{selected.names}</Text>

                {!!selected.location && (
                  <Text style={styles.modalLocation}>📍 {selected.location}</Text>
                )}

                {!!selected.description && (
                  <Text style={styles.modalDescription}>{selected.description}</Text>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body2, color: colors.text.secondary, marginTop: 4 },

  grid: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: spacing.sm },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPhoto: {
    width: '100%',
    height: CARD_WIDTH,
  },
  cardPhotoPlaceholder: {
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPhotoInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
  },
  cardBody: {
    padding: spacing.sm,
  },
  cardName: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardLocation: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  intlBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '18',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  intlBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },

  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  emptyText: { ...typography.body1, color: colors.text.secondary },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: colors.text.secondary },

  modalPhotoWrap: { alignItems: 'center', paddingVertical: spacing.md },
  modalPhoto: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  modalPhotoPlaceholder: {
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPhotoInitial: {
    fontSize: 60,
    fontWeight: '700',
    color: colors.primary,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  modalName: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalLocation: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  modalDescription: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
});
