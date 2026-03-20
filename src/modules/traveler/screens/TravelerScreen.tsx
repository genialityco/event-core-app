import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { travelerService } from '../services/traveler.service';
import {
  EMPTY_TRAVELER_FORM,
  type TravelerInfoForm,
  type TravelerFormConfig,
  type FieldConfig,
} from '../types';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

interface FieldProps {
  config: FieldConfig;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}

const Field: React.FC<FieldProps> = ({ config, value, onChangeText, multiline }) => {
  if (!config.enabled) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {config.label}
        {config.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.text.disabled}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
};

// Mapa de clave de campo → clave en TravelerInfoForm
const FIELD_KEY_MAP: Record<string, keyof TravelerInfoForm> = {
  tvChannel: 'tvChannel',
  position: 'position',
  outboundOriginCity: 'outboundOriginCity',
  outboundFlightNumber: 'outboundFlightNumber',
  outboundArrivalTime: 'outboundArrivalTime',
  returnOriginCity: 'returnOriginCity',
  returnFlightNumber: 'returnFlightNumber',
  returnArrivalTime: 'returnArrivalTime',
  dietaryRestrictions: 'dietaryRestrictions',
};

// Campos multilinea
const MULTILINE_FIELDS = new Set(['dietaryRestrictions']);

// ─── Pantalla principal ───────────────────────────────────────────────────────

export const TravelerScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();

  const [form, setForm] = useState<TravelerInfoForm>(EMPTY_TRAVELER_FORM);
  const [formConfig, setFormConfig] = useState<TravelerFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeEventId) {
      setLoading(false);
      return;
    }
    Promise.all([
      travelerService.getMyInfo(activeEventId).catch(() => null),
      travelerService.getFormConfig(activeEventId).catch(() => null),
    ]).then(([info, config]) => {
      if (info) {
        const { _id, ...rest } = info as any;
        setForm(rest);
      }
      if (config) setFormConfig(config);
      setLoading(false);
    });
  }, [activeEventId]);

  const set = (key: keyof TravelerInfoForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!activeEventId) return;
    setSaving(true);
    try {
      await travelerService.saveMyInfo(activeEventId, form);
      Alert.alert('', t('traveler.saved'));
    } catch {
      Alert.alert('Error', t('base.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleJoinWhatsApp = () => {
    const url = formConfig?.whatsappGroupUrl;
    if (url) Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activeEventId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('base.empty')}</Text>
      </View>
    );
  }

  const sections = formConfig?.sections ?? [];
  const whatsappUrl = formConfig?.whatsappGroupUrl ?? '';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('traveler.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('traveler.subtitle')}</Text>
        </View>

        {/* Secciones dinámicas desde el config del CMS */}
        {sections.filter((s) => s.enabled).map((section) => (
          <View key={section.key}>
            <SectionHeader title={t(`traveler.sections.${section.key}`, { defaultValue: section.label })} />
            {section.fields.map((fieldCfg) => {
              const formKey = FIELD_KEY_MAP[fieldCfg.key];
              if (!formKey) return null;
              return (
                <Field
                  key={fieldCfg.key}
                  config={{ ...fieldCfg, label: t(`traveler.fields.${fieldCfg.key}`, { defaultValue: fieldCfg.label }) }}
                  value={form[formKey] as string}
                  onChangeText={set(formKey)}
                  multiline={MULTILINE_FIELDS.has(fieldCfg.key)}
                />
              );
            })}
          </View>
        ))}

        {/* WhatsApp — solo si el CMS configuró el link */}
        {!!whatsappUrl && (
          <>
            <SectionHeader title={t('traveler.sections.whatsapp')} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('traveler.whatsapp.description')}</Text>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={handleJoinWhatsApp}
                activeOpacity={0.8}
              >
                <Text style={styles.whatsappBtnText}>{t('traveler.whatsapp.joinButton')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>{t('traveler.saveButton')}</Text>
          }
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body1, color: colors.text.secondary },

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

  field: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  fieldLabel: { ...typography.body2, color: colors.text.primary, marginBottom: spacing.xs, fontWeight: '500' },
  required: { color: colors.error ?? '#e53e3e' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: { height: 90, paddingTop: spacing.sm },

  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  whatsappBtnText: { ...typography.body1, color: '#fff', fontWeight: '700' },

  saveBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body1, color: '#fff', fontWeight: '700' },

  bottomPad: { height: spacing.xxl },
});
