import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';
import type { TravelerInfo } from '../types';

interface TravelerCardProps {
  item: TravelerInfo;
  onPress?: (item: TravelerInfo) => void;
}

export const TravelerCard: React.FC<TravelerCardProps> = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress?.(item)}
    activeOpacity={0.7}
  >
    <View style={styles.content}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
    </View>
    <View style={[styles.badge, styles[item.category]]}>
      <Text style={styles.badgeText}>{item.category}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: 4,
  },
  description: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    textTransform: 'capitalize',
  },
  transport: { backgroundColor: colors.primary },
  accommodation: { backgroundColor: colors.secondary },
  general: { backgroundColor: colors.success },
});
