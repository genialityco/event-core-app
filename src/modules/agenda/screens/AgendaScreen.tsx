import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get, post, del } from '@/src/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  _id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  room?: string;
  typeSession?: string;
  requiresAttendance?: boolean;
  speakers?: Array<{ _id: string; names: string; imageUrl?: string }>;
}

interface AgendaDoc {
  _id: string;
  sessions: Session[];
  isPublished: boolean;
  dressCode?: string;
  room?: string;
}

interface SessionWithAgendaId extends Session {
  agendaId: string;
  agendaDressCode?: string;
  agendaRoom?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateHeader = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

const getDateKey = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const groupByDate = (sessions: SessionWithAgendaId[]) => {
  const groups: Record<string, SessionWithAgendaId[]> = {};
  for (const session of sessions) {
    const key = session.startDateTime ? getDateKey(session.startDateTime) : 'sin-fecha';
    if (!groups[key]) groups[key] = [];
    groups[key].push(session);
  }
  return groups;
};

// ─── Session Card ─────────────────────────────────────────────────────────────

const SessionCard: React.FC<{
  session: SessionWithAgendaId;
  isAttending: boolean;
  onAttend: () => void;
  onCancel: () => void;
  attendLoading: boolean;
  onSpeakerPress: (id: string) => void;
}> = ({ session, isAttending, onAttend, onCancel, attendLoading, onSpeakerPress }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{session.title}</Text>
        {session.typeSession ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{session.typeSession}</Text>
          </View>
        ) : null}
      </View>

      {(session.startDateTime || session.endDateTime) && (
        <Text style={styles.sessionTime}>
          {session.startDateTime ? formatTime(session.startDateTime) : ''}
          {session.startDateTime && session.endDateTime ? ' – ' : ''}
          {session.endDateTime ? formatTime(session.endDateTime) : ''}
        </Text>
      )}

      {session.room ? (
        <Text style={styles.sessionRoom}>📍 {session.room}</Text>
      ) : null}

      {session.speakers && session.speakers.length > 0 && (
        <View style={styles.speakersRow}>
          {session.speakers.map((sp) => (
            <TouchableOpacity
              key={sp._id}
              onPress={() => onSpeakerPress(sp._id)}
              style={styles.speakerChip}
            >
              <Text style={styles.speakerChipText}>{sp.names}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {session.requiresAttendance && (
        <TouchableOpacity
          style={[styles.attendBtn, isAttending && styles.attendBtnActive]}
          onPress={isAttending ? onCancel : onAttend}
          activeOpacity={0.8}
          disabled={attendLoading}
        >
          {attendLoading ? (
            <ActivityIndicator size="small" color={isAttending ? colors.text.secondary : '#fff'} />
          ) : (
            <Text style={[styles.attendBtnText, isAttending && styles.attendBtnTextActive]}>
              {isAttending ? t('agenda.attending') : t('agenda.attend')}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const AgendaScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();

  const [agendas, setAgendas] = useState<AgendaDoc[]>([]);
  const [myAttendances, setMyAttendances] = useState<string[]>([]); // sessionIds
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendLoading, setAttendLoading] = useState<Record<string, boolean>>({});

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!activeEventId) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [agendaRes, attendanceRes] = await Promise.all([
          get<any>(`/events/${activeEventId}/agendas`),
          get<any>(`/events/${activeEventId}/sessions/my-attendances`).catch(() => []),
        ]);

        const rawAgendas: AgendaDoc[] = Array.isArray(agendaRes)
          ? agendaRes
          : agendaRes?.items ?? agendaRes?.data?.items ?? [];

        const rawAttendances: any[] = Array.isArray(attendanceRes)
          ? attendanceRes
          : attendanceRes?.items ?? attendanceRes?.data?.items ?? [];

        setAgendas(rawAgendas);
        setMyAttendances(rawAttendances.map((a: any) => a.sessionId));
      } catch {
        setError(t('base.error'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeEventId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAttend = async (sessionId: string) => {
    if (!activeEventId) return;
    setAttendLoading((p) => ({ ...p, [sessionId]: true }));
    try {
      await post(`/events/${activeEventId}/sessions/${sessionId}/attend`, {});
      setMyAttendances((prev) => [...prev, sessionId]);
    } catch {
      // ignore
    } finally {
      setAttendLoading((p) => ({ ...p, [sessionId]: false }));
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (!activeEventId) return;
    setAttendLoading((p) => ({ ...p, [sessionId]: true }));
    try {
      await del(`/events/${activeEventId}/sessions/${sessionId}/attend`);
      setMyAttendances((prev) => prev.filter((id) => id !== sessionId));
    } catch {
      // ignore
    } finally {
      setAttendLoading((p) => ({ ...p, [sessionId]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>{t('base.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const publishedAgendas = agendas.filter((a) => a.isPublished);

  if (publishedAgendas.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.comingSoonIcon}>🕐</Text>
        <Text style={styles.comingSoonTitle}>{t('agenda.comingSoon')}</Text>
        <Text style={styles.comingSoonSub}>{t('agenda.comingSoonSub')}</Text>
      </View>
    );
  }

  // Collect all sessions from published agendas
  const allSessions: SessionWithAgendaId[] = publishedAgendas.flatMap((a) =>
    a.sessions.map((s) => ({ ...s, agendaId: a._id, agendaDressCode: a.dressCode, agendaRoom: a.room })),
  );

  // Sort by startDateTime
  allSessions.sort((a, b) => {
    if (!a.startDateTime) return 1;
    if (!b.startDateTime) return -1;
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });

  const grouped = groupByDate(allSessions);
  const dateKeys = Object.keys(grouped);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('agenda.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('agenda.subtitle')}</Text>
      </View>

      {allSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>{t('agenda.empty')}</Text>
        </View>
      ) : (
        dateKeys.map((key) => {
          const sessions = grouped[key];
          const firstSession = sessions[0];
          return (
            <View key={key}>
              {/* Date header */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {firstSession.startDateTime && key !== 'sin-fecha'
                    ? formatDateHeader(firstSession.startDateTime)
                    : 'Sin fecha'}
                </Text>
                {firstSession.agendaDressCode ? (
                  <Text style={styles.agendaMeta}>👔 {firstSession.agendaDressCode}</Text>
                ) : null}
                {firstSession.agendaRoom ? (
                  <Text style={styles.agendaMeta}>📍 {firstSession.agendaRoom}</Text>
                ) : null}
              </View>

              {sessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  isAttending={myAttendances.includes(session._id)}
                  onAttend={() => handleAttend(session._id)}
                  onCancel={() => handleCancel(session._id)}
                  attendLoading={!!attendLoading[session._id]}
                  onSpeakerPress={(id) => router.push('/speaker/' + id)}
                />
              ))}
            </View>
          );
        })
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
};

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

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body2, color: colors.text.secondary, marginTop: 4 },

  dateHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  dateHeaderText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  sessionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  sessionTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: colors.primary + '18',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  sessionTime: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  sessionRoom: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  speakersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  speakerChip: {
    backgroundColor: colors.primary + '18',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  speakerChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  agendaMeta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },

  attendBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  attendBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  attendBtnText: {
    ...typography.body2,
    color: '#fff',
    fontWeight: '600',
  },
  attendBtnTextActive: {
    color: colors.text.secondary,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.body1, color: colors.text.secondary, textAlign: 'center' },

  comingSoonIcon: { fontSize: 56, marginBottom: spacing.md },
  comingSoonTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  comingSoonSub: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { ...typography.body2, color: '#fff', fontWeight: '600' },

  bottomPad: { height: spacing.xxl },
});
