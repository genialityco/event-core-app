import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import WebView from 'react-native-webview';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get } from '@/src/core';

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

// ─── Category Icons fallback ──────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  passport: '🛂',
  visa: '📋',
  airlines: '✈️',
  payment: '💳',
  transport: '🚌',
  accommodation: '🏨',
  plugs: '🔌',
  tourism: '🗺️',
  security: '🔒',
  general: '📌',
};

const getIcon = (item: InfoItem) =>
  item.icon || CATEGORY_ICONS[item.category] || '📌';

// Strip HTML tags for card preview
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);

// ─── HTML Content Renderer ────────────────────────────────────────────────────

const HtmlContent: React.FC<{ html: string }> = ({ html }) => {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(100);

  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: #1a1a1a;
          background: transparent;
          padding: 0;
          overflow: hidden;
        }
        p { margin-bottom: 8px; }
        h1 { font-size: 22px; font-weight: 700; margin: 16px 0 8px; }
        h2 { font-size: 18px; font-weight: 700; margin: 12px 0 6px; }
        h3 { font-size: 15px; font-weight: 700; margin: 10px 0 4px; }
        ul, ol { padding-left: 20px; margin-bottom: 8px; }
        li { margin-bottom: 4px; }
        strong { font-weight: 700; }
        em { font-style: italic; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
        img { max-width: 100%; border-radius: 8px; margin: 8px 0; display: block; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;

  const measureScript = `
    (function() {
      function sendHeight() {
        window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
      }
      // Measure after images finish loading
      var images = document.getElementsByTagName('img');
      var pending = images.length;
      if (pending === 0) {
        sendHeight();
      } else {
        function onLoad() { pending--; if (pending <= 0) sendHeight(); }
        for (var i = 0; i < images.length; i++) {
          if (images[i].complete) { onLoad(); }
          else { images[i].addEventListener('load', onLoad); images[i].addEventListener('error', onLoad); }
        }
      }
      // Also re-measure on window load as fallback
      window.addEventListener('load', sendHeight);
    })();
    true;
  `;

  return (
    <WebView
      source={{ html: styledHtml }}
      style={{ width: width - spacing.md * 2, height }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      originWhitelist={['*']}
      onMessage={(e) => setHeight(Number(e.nativeEvent.data))}
      injectedJavaScript={measureScript}
    />
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const UsefulInfoScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

  const lang = i18n.language ?? 'es';
  const localized = (base: string, translated?: string) => {
    if (lang.startsWith('en') && translated?.trim()) return translated;
    return base;
  };

  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<InfoItem | null>(null);

  const loadItems = useCallback(async (isRefresh = false) => {
    if (!activeEventId) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await get<any>(`/events/${activeEventId}/useful-info`);
      const data: InfoItem[] = Array.isArray(res) ? res : res?.items ?? res?.data?.items ?? [];
      const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setItems(sorted);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeEventId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={bc.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📄</Text>
        <Text style={styles.emptyTitle}>{t('usefulInfo.title')}</Text>
        <Text style={styles.emptyText}>{t('usefulInfo.empty')}</Text>
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
          <Text style={styles.headerTitle}>{t('usefulInfo.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('usefulInfo.subtitle')}</Text>
        </View>

        {/* Cards */}
        {items.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={styles.card}
            onPress={() => setSelected(item)}
            activeOpacity={0.75}
          >
            {item.coverImageUrl ? (
              <Image
                source={{ uri: item.coverImageUrl }}
                style={styles.cardCover}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.cardBody}>
              <Text style={styles.cardIcon}>{getIcon(item)}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{localized(item.title, item.title_en)}</Text>
                {item.content ? (
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {stripHtml(localized(item.content, item.content_en))}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={styles.modal}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {getIcon(selected)}  {localized(selected.title, selected.title_en)}
              </Text>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selected.coverImageUrl ? (
                <Image
                  source={{ uri: selected.coverImageUrl }}
                  style={styles.modalCover}
                  resizeMode="cover"
                />
              ) : null}

              <HtmlContent html={localized(selected.content, selected.content_en)} />

              <View style={{ height: spacing.xxl }} />
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
  content: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body2, color: colors.text.secondary, marginTop: 4 },

  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardCover: { width: '100%', height: 140 },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardIcon: { fontSize: 28, flexShrink: 0 },
  cardText: { flex: 1 },
  cardTitle: { ...typography.body1, color: colors.text.primary, fontWeight: '600' },
  cardPreview: { ...typography.body2, color: colors.text.secondary, marginTop: 2 },
  cardArrow: { fontSize: 22, color: colors.text.secondary, flexShrink: 0 },

  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  emptyText: { ...typography.body1, color: colors.text.secondary },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
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
    flexShrink: 0,
  },
  closeBtnText: { fontSize: 14, color: colors.text.secondary },
  modalHeaderTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  modalScroll: { flex: 1 },
  modalContent: { padding: spacing.md },
  modalCover: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
});
