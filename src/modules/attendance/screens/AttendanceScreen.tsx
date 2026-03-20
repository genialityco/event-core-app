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
}

interface AgendaDoc {
  _id: string;
  sessions: Session[];
  isPublished: boolean;
  dressCode?: string;
  room?: string;
}

interface AttendanceSession extends Session {
  agendaDressCode?: string;
  agendaRoom?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateHeader = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

const getDateKey = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const groupByDate = (sessions: AttendanceSession[]) => {
  const groups: Record<string, AttendanceSession[]> = {};
  for (const s of sessions) {
    const key = s.startDateTime ? getDateKey(s.startDateTime) : 'sin-fecha';
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return groups;
};

// ─── Session Row ──────────────────────────────────────────────────────────────

const SessionRow: React.FC<{
  session: AttendanceSession;
  isAttending: boolean;
  loading: boolean;
  onAttend: () => void;
  onCancel: () => void;
}> = ({ session, isAttending, loading, onAttend, onCancel }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.row, isAttending && styles.rowConfirmed]}>
      {/* Left: time */}
      <View style={styles.rowTime}>
        <Text style={styles.rowTimeText}>
          {session.startDateTime ? formatTime(session.startDateTime) : '--:--'}
        </Text>
        {session.endDateTime ? (
          <Text style={styles.rowTimeEnd}>{formatTime(session.endDateTime)}</Text>
        ) : null}
      </View>

      {/* Center: info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{session.title}</Text>
        {!!(session.room || session.agendaRoom) && (
          <Text style={styles.rowMeta}>📍 {session.room || session.agendaRoom}</Text>
        )}
        {!!session.typeSession && (
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{session.typeSession}</Text>
          </View>
        )}
      </View>

      {/* Right: attend button */}
      <TouchableOpacity
        style={[styles.btn, isAttending ? styles.btnConfirmed : styles.btnPending]}
        onPress={isAttending ? onCancel : onAttend}
        disabled={loading}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isAttending ? colors.text.secondary : '#fff'} />
        ) : (
          <Text style={[styles.btnText, isAttending && styles.btnTextConfirmed]}>
            {isAttending ? `✓ ${t('attendance.confirmed')}` : t('attendance.attend')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const AttendanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [myAttendances, setMyAttendances] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async (isRefresh = false) => {
    if (!activeEventId) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [agendaRes, attendanceRes] = await Promise.all([
        get<any>(`/events/${activeEventId}/agendas`),
        get<any>(`/events/${activeEventId}/sessions/my-attendances`).catch(() => []),
      ]);

      const agendas: AgendaDoc[] = Array.isArray(agendaRes)
        ? agendaRes
        : agendaRes?.items ?? agendaRes?.data?.items ?? [];

      const attendances: any[] = Array.isArray(attendanceRes)
        ? attendanceRes
        : attendanceRes?.items ?? attendanceRes?.data?.items ?? [];

      // Solo agendas publicadas, solo sesiones con requiresAttendance
      const attendanceSessions: AttendanceSession[] = agendas
        .filter((a) => a.isPublished)
        .flatMap((a) =>
          a.sessions
            .filter((s) => s.requiresAttendance)
            .map((s) => ({
              ...s,
              agendaDressCode: a.dressCode,
              agendaRoom: a.room,
            }))
        )
        .sort((a, b) =>
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
        );

      setSessions(attendanceSessions);
      setMyAttendances(
        attendances.map((a: any) =>
          typeof a.sessionId === 'object' ? a.sessionId?.toString() : String(a.sessionId)
        )
      );
    } catch {
      setError(t('base.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeEventId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAttend = async (sessionId: string) => {
    if (!activeEventId) return;
    setBtnLoading((p) => ({ ...p, [sessionId]: true }));
    try {
      await post(`/events/${activeEventId}/sessions/${sessionId}/attend`, {});
      setMyAttendances((prev) => [...prev, sessionId]);
    } catch {}
    finally { setBtnLoading((p) => ({ ...p, [sessionId]: false })); }
  };

  const handleCancel = async (sessionId: string) => {
    if (!activeEventId) return;
    setBtnLoading((p) => ({ ...p, [sessionId]: true }));
    try {
      await del(`/events/${activeEventId}/sessions/${sessionId}/attend`);
      setMyAttendances((prev) => prev.filter((id) => id !== sessionId));
    } catch {}
    finally { setBtnLoading((p) => ({ ...p, [sessionId]: false })); }
  };

  // ── Estados ────────────────────────────────────────────────────────────────

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

  if (sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>✅</Text>
        <Text style={styles.emptyTitle}>{t('attendance.title')}</Text>
        <Text style={styles.emptyText}>{t('attendance.empty')}</Text>
      </View>
    );
  }

  const confirmed = myAttendances.filter((id) => sessions.some((s) => s._id === id)).length;
  const grouped = groupByDate(sessions);
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
        <Text style={styles.headerTitle}>{t('attendance.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('attendance.subtitle')}</Text>
      </View>

      {/* Summary: confirmadas / pendientes / total */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#22c55e' }]}>{confirmed}</Text>
          <Text style={styles.summaryLabel}>{t('attendance.confirmed')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            {sessions.length - confirmed}
          </Text>
          <Text style={styles.summaryLabel}>{t('attendance.pending')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{sessions.length}</Text>
          <Text style={styles.summaryLabel}>{t('attendance.total')}</Text>
        </View>
      </View>

      {/* Sesiones agrupadas por día */}
      {dateKeys.map((key) => {
        const daySessions = grouped[key];
        const first = daySessions[0];
        return (
          <View key={key}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>
                {first.startDateTime && key !== 'sin-fecha'
                  ? formatDateHeader(first.startDateTime)
                  : 'Sin fecha'}
              </Text>
              {!!first.agendaDressCode && (
                <Text style={styles.dayMeta}>👔 {first.agendaDressCode}</Text>
              )}
            </View>

            <View style={styles.dayCard}>
              {daySessions.map((session, idx) => (
                <React.Fragment key={session._id}>
                  <SessionRow
                    session={session}
                    isAttending={myAttendances.includes(session._id)}
                    loading={!!btnLoading[session._id]}
                    onAttend={() => handleAttend(session._id)}
                    onCancel={() => handleCancel(session._id)}
                  />
                  {idx < daySessions.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.bottomPad} />
    </ScrollView>
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
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body2, color: colors.text.secondary, marginTop: 4 },

  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { ...typography.h2, color: colors.text.primary, fontWeight: '700' },
  summaryLabel: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  dayHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dayHeaderText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayMeta: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },

  dayCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowConfirmed: { backgroundColor: '#22c55e' + '0D' },

  rowTime: { alignItems: 'center', minWidth: 44 },
  rowTimeText: { ...typography.caption, color: colors.text.primary, fontWeight: '700' },
  rowTimeEnd: { ...typography.caption, color: colors.text.secondary, marginTop: 1 },

  rowInfo: { flex: 1 },
  rowTitle: { ...typography.body2, color: colors.text.primary, fontWeight: '600', marginBottom: 2 },
  rowMeta: { ...typography.caption, color: colors.text.secondary },
  typePill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.primary + '18',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  typePillText: { fontSize: 10, fontWeight: '600', color: colors.primary },

  btn: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 34,
  },
  btnPending: { backgroundColor: colors.primary },
  btnConfirmed: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#22c55e' },
  btnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  btnTextConfirmed: { color: '#22c55e' },

  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  emptyText: { ...typography.body2, color: colors.text.secondary, textAlign: 'center' },

  errorText: { ...typography.body1, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryBtnText: { ...typography.body2, color: '#fff', fontWeight: '600' },

  bottomPad: { height: spacing.xxl },
});
