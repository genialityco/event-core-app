import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEvent } from '@/context/EventContext';
import { useTranslation } from '@/src/i18n';
import { get } from '@/src/core';
import { colors, spacing, typography } from '@/src/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpeakerDetail {
  _id: string;
  names: string;
  role?: string;
  organization?: string;
  description?: string;
  imageUrl?: string;
  isInternational?: boolean;
}

interface AgendaSession {
  _id: string;
  title: string;
  startDateTime?: string;
  endDateTime?: string;
  speakers?: Array<{ _id: string; names: string } | string>;
}

interface AgendaDoc {
  _id: string;
  sessions: AgendaSession[];
  isPublished: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

// ─── Speaker Screen ───────────────────────────────────────────────────────────

export default function SpeakerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeEventId } = useEvent();
  const { t } = useTranslation();

  const [speaker, setSpeaker] = useState<SpeakerDetail | null>(null);
  const [sessions, setSessions] = useState<AgendaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeEventId || !id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [speakerData, agendasData] = await Promise.all([
          get<SpeakerDetail>(`/events/${activeEventId}/speakers/${id}`),
          get<any>(`/events/${activeEventId}/agendas`),
        ]);

        const rawAgendas: AgendaDoc[] = Array.isArray(agendasData)
          ? agendasData
          : agendasData?.items ?? agendasData?.data?.items ?? [];

        // Find sessions that include this speaker
        const speakerSessions: AgendaSession[] = [];
        for (const agenda of rawAgendas) {
          if (!agenda.isPublished) continue;
          for (const session of agenda.sessions) {
            if (!session.speakers) continue;
            const hasThisSpeaker = session.speakers.some((sp: any) => {
              if (typeof sp === 'string') return sp === id;
              return sp._id === id;
            });
            if (hasThisSpeaker) {
              speakerSessions.push(session);
            }
          }
        }

        setSpeaker(speakerData);
        setSessions(speakerSessions);
      } catch {
        setError(t('base.error'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeEventId, id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !speaker) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? t('base.error')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {t('base.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {speaker.imageUrl ? (
          <Image
            source={{ uri: speaker.imageUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{getInitials(speaker.names)}</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.name}>{speaker.names}</Text>

      {/* Role / Organization */}
      {(speaker.role || speaker.organization) && (
        <Text style={styles.roleOrg}>
          {[speaker.role, speaker.organization].filter(Boolean).join(' · ')}
        </Text>
      )}

      {/* International badge */}
      {speaker.isInternational && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('speaker.international')}</Text>
        </View>
      )}

      {/* Description */}
      {speaker.description ? (
        <View style={styles.section}>
          <Text style={styles.description}>{speaker.description}</Text>
        </View>
      ) : null}

      {/* Sessions */}
      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaker.sessions')}</Text>
          {sessions.map((session) => (
            <View key={session._id} style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              {(session.startDateTime || session.endDateTime) && (
                <Text style={styles.sessionTime}>
                  {session.startDateTime ? formatTime(session.startDateTime) : ''}
                  {session.startDateTime && session.endDateTime ? ' – ' : ''}
                  {session.endDateTime ? formatTime(session.endDateTime) : ''}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  backBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
  },

  avatarContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.primary + '40',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
  },

  name: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  roleOrg: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  badge: {
    alignSelf: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#93c5fd',
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },

  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 22,
  },

  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionTime: {
    ...typography.body2,
    color: colors.text.secondary,
  },

  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  bottomPad: { height: spacing.xxl },
});
