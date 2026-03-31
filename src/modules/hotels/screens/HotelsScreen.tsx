import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Image,
  RefreshControl,
} from 'react-native';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get } from '@/src/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hotel {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  price?: string;
  bookingUrl?: string;
  hotelUrl?: string;
  imageUrl?: string;
  isMain?: boolean;
  distanceMinutes?: number;
  order?: number;
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

const HotelCard: React.FC<{ hotel: Hotel; t: (key: string) => string; primary: string }> = ({ hotel, t, primary }) => {
  const openUrl = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.card, hotel.isMain && [styles.cardMain, { borderColor: primary }]]}>
      {/* Main badge */}
      {hotel.isMain && (
        <View style={[styles.mainBadge, { backgroundColor: primary }]}>
          <Text style={styles.mainBadgeText}>{t('hotels.mainBadge')}</Text>
        </View>
      )}

      {/* Image */}
      {!!hotel.imageUrl && (
        <Image
          source={{ uri: hotel.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.hotelName}>{hotel.name}</Text>

        {!!hotel.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{hotel.address}</Text>
          </View>
        )}

        {!!hotel.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoText}>{hotel.phone}</Text>
          </View>
        )}

        {!!hotel.price && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoText}>{hotel.price}</Text>
          </View>
        )}

        {!hotel.isMain && !!hotel.distanceMinutes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🚶</Text>
            <Text style={styles.infoText}>
              {hotel.distanceMinutes} {t('hotels.distanceMinutes')}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        {(!!hotel.bookingUrl || !!hotel.hotelUrl) && (
          <View style={styles.actions}>
            {!!hotel.bookingUrl && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: primary, borderColor: primary }]}
                onPress={() => openUrl(hotel.bookingUrl!)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnTextPrimary}>{t('hotels.bookingButton')}</Text>
              </TouchableOpacity>
            )}
            {!!hotel.hotelUrl && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: primary }]}
                onPress={() => openUrl(hotel.hotelUrl!)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, { color: primary }]}>{t('hotels.websiteButton')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const HotelsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHotels = useCallback(async (isRefresh = false) => {
    if (!activeEventId) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await get<Hotel[]>(`/events/${activeEventId}/hotels`);
      setHotels(Array.isArray(data) ? data : []);
    } catch {
      setError(t('base.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeEventId]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={bc.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: bc.primary }]} onPress={() => loadHotels()}>
          <Text style={styles.retryBtnText}>{t('base.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mainHotel = hotels.find((h) => h.isMain);
  const otherHotels = hotels.filter((h) => !h.isMain);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadHotels(true)}
          colors={[bc.primary]}
          tintColor={bc.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('hotels.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('hotels.subtitle')}</Text>
      </View>

      {hotels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏨</Text>
          <Text style={styles.emptyText}>{t('hotels.empty')}</Text>
        </View>
      ) : (
        <>
          {/* Main hotel */}
          {mainHotel && <HotelCard key={mainHotel._id} hotel={mainHotel} t={t} primary={bc.primary} />}

          {/* Other hotels */}
          {otherHotels.length > 0 && (
            <>
              {mainHotel && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('hotels.alternativeTitle')}</Text>
                </View>
              )}
              {otherHotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} t={t} primary={bc.primary} />
              ))}
            </>
          )}
        </>
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body2, color: colors.text.secondary, marginTop: 4 },

  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },

  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMain: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  mainBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  mainBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardImage: {
    width: '100%',
    height: 180,
  },

  cardContent: {
    padding: spacing.md,
  },

  hotelName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: 8,
  },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoText: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionBtnText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  actionBtnTextPrimary: {
    ...typography.body2,
    color: '#fff',
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.body1, color: colors.text.secondary, textAlign: 'center' },

  errorText: { ...typography.body1, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { ...typography.body2, color: '#fff', fontWeight: '600' },

  bottomPad: { height: spacing.xxl },
});
