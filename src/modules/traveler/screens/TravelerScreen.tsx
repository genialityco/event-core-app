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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { travelerService } from '../services/traveler.service';
import {
  EMPTY_TRAVELER_FORM,
  type TravelerInfoForm,
  type TravelerFormConfig,
  type SectionConfig,
  type FieldConfig,
} from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constantes ───────────────────────────────────────────────────────────────

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

const MULTILINE_FIELDS = new Set(['dietaryRestrictions']);

type SectionKey = SectionConfig['key'];

const SECTION_ICONS: Record<SectionKey, { name: string; flip?: boolean }> = {
  outbound_flight: { name: 'airplane' },
  return_flight: { name: 'airplane', flip: true },
  dietary: { name: 'restaurant' },
  professional: { name: 'briefcase' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSectionFilled(section: SectionConfig, form: TravelerInfoForm): boolean {
  return section.fields.some((f) => {
    const key = FIELD_KEY_MAP[f.key];
    return key && (form[key] as string)?.trim().length > 0;
  });
}

function getSectionSummary(section: SectionConfig, form: TravelerInfoForm): string {
  return section.fields
    .filter((f) => {
      const key = FIELD_KEY_MAP[f.key];
      return key && (form[key] as string)?.trim().length > 0;
    })
    .map((f) => (form[FIELD_KEY_MAP[f.key]!] as string).trim())
    .slice(0, 2)
    .join(' · ');
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ filled: number; total: number }> = ({ filled, total }) => {
  const pct = total > 0 ? filled / total : 0;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${pct * 100}%` as any }]} />
    </View>
  );
};

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

// ─── SmartInput ───────────────────────────────────────────────────────────────

interface SmartInputProps {
  config: FieldConfig;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  primary: string;
}

const SmartInput: React.FC<SmartInputProps> = ({ config, value, onChangeText, multiline, primary }) => {
  const [focused, setFocused] = useState(false);
  if (!config.enabled) return null;
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>
        {config.label}
        {config.required && <Text style={inputStyles.required}> *</Text>}
      </Text>
      <View style={[inputStyles.inputContainer, focused && { borderColor: primary, borderWidth: 1.5 }]}>
        <TextInput
          style={[inputStyles.input, multiline && inputStyles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.text.disabled}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholder={config.label}
        />
      </View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: { color: '#e53e3e' },
  inputContainer: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body1,
    color: colors.text.primary,
  },
  inputMulti: { height: 90, paddingTop: 12 },
});

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: SectionConfig;
  form: TravelerInfoForm;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (key: keyof TravelerInfoForm, value: string) => void;
  primary: string;
  t: (key: string, opts?: any) => string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section, form, isExpanded, onToggle, onChange, primary, t,
}) => {
  const iconMeta = SECTION_ICONS[section.key as SectionKey] ?? { name: 'list-outline' };
  const filled = isSectionFilled(section, form);
  const summary = filled ? getSectionSummary(section, form) : '';

  return (
    <View style={[cardStyles.card, isExpanded && { borderColor: primary, borderWidth: 1.5 }]}>
      <TouchableOpacity style={cardStyles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={[cardStyles.iconCircle, { backgroundColor: primary + '18' }]}>
          <Ionicons
            name={iconMeta.name as any}
            size={20}
            color={primary}
            style={iconMeta.flip ? { transform: [{ scaleX: -1 }] } : undefined}
          />
        </View>

        <View style={cardStyles.headerText}>
          <Text style={cardStyles.sectionTitle}>
            {t(`traveler.sections.${section.key}`, { defaultValue: section.label })}
          </Text>
          {!isExpanded && !!summary && (
            <Text style={cardStyles.summary} numberOfLines={1}>{summary}</Text>
          )}
        </View>

        <View style={cardStyles.headerRight}>
          {filled && !isExpanded && (
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 4 }} />
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={cardStyles.fields}>
          <View style={[cardStyles.divider, { backgroundColor: primary + '20' }]} />
          {section.fields.map((fieldCfg) => {
            const formKey = FIELD_KEY_MAP[fieldCfg.key];
            if (!formKey) return null;
            return (
              <SmartInput
                key={fieldCfg.key}
                config={{
                  ...fieldCfg,
                  label: t(`traveler.fields.${fieldCfg.key}`, { defaultValue: fieldCfg.label }),
                }}
                value={form[formKey] as string}
                onChangeText={(v) => onChange(formKey, v)}
                multiline={MULTILINE_FIELDS.has(fieldCfg.key)}
                primary={primary}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerText: { flex: 1, marginRight: spacing.xs },
  sectionTitle: { ...typography.body1, color: colors.text.primary, fontWeight: '600' },
  summary: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, marginHorizontal: spacing.md, marginBottom: spacing.md },
  fields: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export const TravelerScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

  const [form, setForm] = useState<TravelerInfoForm>(EMPTY_TRAVELER_FORM);
  const [formConfig, setFormConfig] = useState<TravelerFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
      if (config) {
        setFormConfig(config);
        const first = config.sections.find((s) => s.enabled);
        if (first) setExpandedSection(first.key);
      }
      setLoading(false);
    });
  }, [activeEventId]);

  const handleChange = (key: keyof TravelerInfoForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleToggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection((prev) => (prev === key ? null : key));
  };

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
        <ActivityIndicator size="large" color={bc.primary} />
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

  const sections = (formConfig?.sections ?? []).filter((s) => s.enabled);
  const filledCount = sections.filter((s) => isSectionFilled(s, form)).length;
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
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: bc.primary }]}>
          <Text style={styles.heroTitle}>{t('traveler.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('traveler.subtitle')}</Text>
          {sections.length > 0 && (
            <View style={styles.heroProgress}>
              <View style={styles.heroProgressRow}>
                <Text style={styles.heroProgressLabel}>
                  {t('traveler.sectionsProgress', {
                    filled: filledCount,
                    total: sections.length,
                    defaultValue: `${filledCount} de ${sections.length} secciones completadas`,
                  })}
                </Text>
                <Text style={styles.heroProgressCount}>{filledCount}/{sections.length}</Text>
              </View>
              <ProgressBar filled={filledCount} total={sections.length} />
            </View>
          )}
        </View>

        {/* Cards */}
        <View style={styles.sectionsContainer}>
          {sections.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              form={form}
              isExpanded={expandedSection === section.key}
              onToggle={() => handleToggle(section.key)}
              onChange={handleChange}
              primary={bc.primary}
              t={t}
            />
          ))}

          {/* WhatsApp CTA */}
          {!!whatsappUrl && (
            <TouchableOpacity
              style={styles.whatsappCard}
              onPress={handleJoinWhatsApp}
              activeOpacity={0.85}
            >
              <View style={styles.whatsappIcon}>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </View>
              <View style={styles.whatsappText}>
                <Text style={styles.whatsappTitle}>{t('traveler.sections.whatsapp')}</Text>
                <Text style={styles.whatsappDesc}>{t('traveler.whatsapp.description')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}

          {/* Guardar */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: bc.primary }, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.saveBtnIcon} />
                <Text style={styles.saveBtnText}>{t('traveler.saveButton')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  emptyText: { ...typography.body1, color: colors.text.secondary },

  hero: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { ...typography.h2, color: '#fff', fontWeight: '700' },
  heroSubtitle: { ...typography.body2, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  heroProgress: { marginTop: spacing.md },
  heroProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroProgressLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  heroProgressCount: { ...typography.caption, color: '#fff', fontWeight: '700' },

  sectionsContainer: {
    marginTop: -20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },

  whatsappCard: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  whatsappText: { flex: 1 },
  whatsappTitle: { ...typography.body1, color: '#fff', fontWeight: '700' },
  whatsappDesc: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  saveBtn: {
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnIcon: { marginRight: 8 },
  saveBtnText: { ...typography.body1, color: '#fff', fontWeight: '700' },

  bottomPad: { height: spacing.xxl },
});
