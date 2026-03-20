import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography } from '@/src/theme';

interface BaseScreenProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  /** Si true, envuelve el contenido en ScrollView con pull-to-refresh */
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Wrapper base para todas las pantallas de módulos.
 * Maneja loading, error y scroll de forma consistente.
 *
 * Uso:
 * <BaseScreen loading={loading} error={error} scrollable onRefresh={reload}>
 *   <MiContenido />
 * </BaseScreen>
 */
export const BaseScreen: React.FC<BaseScreenProps> = ({
  children,
  loading = false,
  error = null,
  scrollable = false,
  onRefresh,
  refreshing = false,
  style,
  contentStyle,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('base.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const content = (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.container, style]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
