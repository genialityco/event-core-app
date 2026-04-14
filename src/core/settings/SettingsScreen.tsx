import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTranslation, changeLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/src/i18n';
import { colors, spacing, typography } from '@/src/theme';
import i18n from '@/src/i18n/i18n';
import { useAuth } from '@/context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;
  const { signOut, deleteAccount } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOutTitle'),
      t('settings.signOutMessage'),
      [
        { text: t('settings.signOutCancel'), style: 'cancel' },
        {
          text: t('settings.signOutConfirm'),
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            setSigningOut(false);
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('settings.signOutCancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountConfirm'),
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            await deleteAccount();
            setDeletingAccount(false);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.options}>
          {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((code) => {
            const isActive = currentLang === code;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => changeLanguage(code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                  {SUPPORTED_LANGUAGES[code]}
                </Text>
                {isActive && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.account')}</Text>
        <View style={styles.options}>
          <TouchableOpacity
            style={styles.option}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>
              {signingOut ? t('settings.signingOut') : t('settings.signOut')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteAccountText}>
              {deletingAccount ? t('settings.deletingAccount') : t('settings.deleteAccount')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  options: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.primary + '12',
  },
  optionText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  signOutText: {
    ...typography.body1,
    color: '#ef4444',
    fontWeight: '500',
  },
  deleteAccountText: {
    ...typography.body1,
    color: '#b91c1c',
    fontWeight: '500',
  },
});
