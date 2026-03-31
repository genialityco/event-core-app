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
  Dimensions,
} from 'react-native';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get } from '@/src/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfoItem {
  _id: string;
  title: string;
  category: string;
  icon: string;
  content: string;
  coverImageUrl?: string;
  order: number;
}

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MarkdownLine: React.FC<{ line: string }> = ({ line }) => {
  if (line.startsWith('# ')) {
    return <Text style={md.h1}>{line.slice(2)}</Text>;
  }
  if (line.startsWith('## ')) {
    return <Text style={md.h2}>{line.slice(3)}</Text>;
  }
  if (line.startsWith('### ')) {
    return <Text style={md.h3}>{line.slice(4)}</Text>;
  }
  if (line.startsWith('- ') || line.startsWith('• ')) {
    return (
      <View style={md.bulletRow}>
        <Text style={md.bullet}>•</Text>
        <Text style={md.bulletText}>{parseBold(line.slice(2))}</Text>
      </View>
    );
  }
  if (line.trim() === '' || line === '---') {
    return <View style={md.spacer} />;
  }
  return <Text style={md.body}>{parseBold(line)}</Text>;
};

// Parse **bold** within a string → returns Text nodes
const parseBold = (text: string): React.ReactNode => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={md.bold}>{part}</Text>
    ) : (
      part
    )
  );
};

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <View>
      {lines.map((line, i) => (
        <MarkdownLine key={i} line={line} />
      ))}
    </View>
  );
};

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const UsefulInfoScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

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
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.content ? (
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {item.content.replace(/[#*\-]/g, '').trim().slice(0, 120)}
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
                {getIcon(selected)}  {selected.title}
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

              <MarkdownContent content={selected.content || ''} />

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

// ─── Markdown Styles ──────────────────────────────────────────────────────────

const md = StyleSheet.create({
  h1: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: 6,
    lineHeight: 24,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  body: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    color: colors.primary, // fallback; override with inline style if needed
    marginRight: 8,
    marginTop: 4,
    flexShrink: 0,
  },
  bulletText: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 24,
    flex: 1,
  },
  spacer: { height: 8 },
});
