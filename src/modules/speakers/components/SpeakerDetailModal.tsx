import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get } from '@/src/core';
import { getCountryFlag, formatCountryLabel } from '@/src/utils/countries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Speaker {
  _id: string;
  names: string;
  description?: string;
  descriptionEN?: string;
  location?: string;
  profession?: string;
  role?: string;
  roleEN?: string;
  organization?: string;
  country?: string;
  imageUrl?: string;
  image?: string;
}

interface SpeakerSession {
  _id: string;
  title: string;
  startDateTime?: string;
  endDateTime?: string;
  room?: string;
  typeSession?: string;
}

interface Props {
  visible: boolean;
  speaker: Speaker | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateShort = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

// ─── Component ────────────────────────────────────────────────────────────────

export const SpeakerDetailModal: React.FC<Props> = ({ visible, speaker, onClose }) => {
  const { t, i18n } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

  const [speakerSessions, setSpeakerSessions] = useState<SpeakerSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const displayRole = i18n?.language?.startsWith('en')
    ? (speaker?.roleEN || speaker?.role)
    : (speaker?.role || speaker?.roleEN);

  // Get description based on current language
  const getDisplayDescription = (): string | undefined => {
    if (!speaker) return undefined;
    const currentLang = i18n?.language || 'es';
    if (currentLang.startsWith('en')) {
      return speaker.descriptionEN || speaker.description;
    }
    return speaker.description || speaker.descriptionEN;
  };

  const loadSpeakerSessions = useCallback(async (speakerId: string) => {
    if (!activeEventId) return;
    setSessionsLoading(true);
    setSpeakerSessions([]);
    try {
      const res = await get<any>(`/events/${activeEventId}/agendas`);
      const agendas: any[] = Array.isArray(res) ? res : res?.items ?? res?.data?.items ?? [];
      const sessions: SpeakerSession[] = [];
      for (const agenda of agendas) {
        if (!agenda.isPublished) continue;
        for (const session of agenda.sessions ?? []) {
          const hasSpeaker = (session.speakers ?? []).some(
            (sp: any) => (typeof sp === 'object' ? sp._id : sp) === speakerId,
          );
          if (hasSpeaker) sessions.push(session);
        }
      }
      sessions.sort((a, b) => {
        if (!a.startDateTime) return 1;
        if (!b.startDateTime) return -1;
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      });
      setSpeakerSessions(sessions);
    } catch {
      // silent
    } finally {
      setSessionsLoading(false);
    }
  }, [activeEventId]);

  useEffect(() => {
    if (visible && speaker) {
      loadSpeakerSessions(speaker._id);
    }
  }, [visible, speaker, loadSpeakerSessions]);

  if (!speaker) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalTopBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Photo */}
          <View style={styles.modalPhotoWrap}>
            {(speaker.imageUrl || speaker.image) ? (
              <Image
                source={{ uri: speaker.imageUrl || speaker.image || '' }}
                style={styles.modalPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.modalPhoto, styles.modalPhotoPlaceholder]}>
                <Text style={styles.modalPhotoInitial}>
                  {speaker.names?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modalBody}>
            {speaker.country && (
              <View style={styles.intlBadgeModal}>
                <Text style={styles.intlBadgeModalText}>
                  {getCountryFlag(speaker.country)}{' '}
                  {formatCountryLabel(speaker.country, i18n?.language || 'es')}
                </Text>
              </View>
            )}

            <Text style={styles.modalName}>{speaker.names}</Text>

            {!!displayRole && (
              <Text style={styles.modalProfession}>{displayRole}</Text>
            )}

            {!!speaker.location && (
              <Text style={styles.modalLocation}>📍 {speaker.location}</Text>
            )}

            {!!getDisplayDescription() && (
              <Text style={styles.modalDescription}>{getDisplayDescription()}</Text>
            )}

            {/* Sessions */}
            <View style={styles.sessionsSection}>
              <Text style={styles.sessionsSectionTitle}>🎤 {t('speaker.sessions')}</Text>
              {sessionsLoading ? (
                <ActivityIndicator size="small" color={bc.primary} style={{ marginTop: 12 }} />
              ) : speakerSessions.length === 0 ? (
                <Text style={styles.sessionsEmpty}>{t('speaker.noSessions')}</Text>
              ) : (
                speakerSessions.map((session) => (
                  <View key={session._id} style={styles.sessionItem}>
                    <Text style={styles.sessionItemTitle}>{session.title}</Text>
                    {(session.startDateTime || session.endDateTime) && (
                      <Text style={styles.sessionItemMeta}>
                        🕐{' '}
                        {session.startDateTime ? formatDateShort(session.startDateTime) : ''}
                        {session.startDateTime ? '  ' : ''}
                        {session.startDateTime ? formatTime(session.startDateTime) : ''}
                        {session.startDateTime && session.endDateTime ? ' – ' : ''}
                        {session.endDateTime ? formatTime(session.endDateTime) : ''}
                      </Text>
                    )}
                    {!!session.room && (
                      <Text style={styles.sessionItemMeta}>📍 {session.room}</Text>
                    )}
                    {!!session.typeSession && (
                      <View style={styles.sessionTypeBadge}>
                        <Text style={styles.sessionTypeBadgeText}>{session.typeSession}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.background },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: colors.text.primary, fontWeight: '700' },

  modalPhotoWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalPhoto: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: colors.primary + '30',
  },
  modalPhotoPlaceholder: {
    backgroundColor: colors.primary + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPhotoInitial: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalName: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '800',
  },
  modalProfession: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '500',
    fontSize: 14,
  },
  modalLocation: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalDescription: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  intlBadgeModal: {
    alignSelf: 'center',
    backgroundColor: colors.primary + '25',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  intlBadgeModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  sessionsSection: {
    width: '100%',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionsSectionTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sessionsEmpty: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sessionItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionItemTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sessionItemMeta: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  sessionTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  sessionTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
