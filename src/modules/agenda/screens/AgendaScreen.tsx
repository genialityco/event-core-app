import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { get, post, del } from '@/src/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Speaker {
  _id: string;
  names: string;
  imageUrl?: string;
}

interface Session {
  _id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  room?: string;
  typeSession?: string;
  requiresAttendance?: boolean;
  speakers?: Speaker[];
}

interface AgendaDoc {
  _id: string;
  sessions: Session[];
  isPublished: boolean;
  dressCode?: string;
  room?: string;
}

interface SessionWithMeta extends Session {
  agendaId: string;
  agendaDressCode?: string;
  agendaRoom?: string;
}

interface DayGroup {
  key: string;         // YYYY-M-D
  label: string;       // "Lun 3"
  fullLabel: string;   // "Lunes, 3 mar"
  sessions: SessionWithMeta[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const getDuration = (start: string, end: string): string => {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins <= 0) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getDayKey = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const getDayShortLabel = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });

const getDayFullLabel = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
};

function buildDayGroups(sessions: SessionWithMeta[]): DayGroup[] {
  const map = new Map<string, SessionWithMeta[]>();
  for (const s of sessions) {
    const key = s.startDateTime ? getDayKey(s.startDateTime) : 'sin-fecha';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const first = items[0];
    return {
      key,
      label: first.startDateTime && key !== 'sin-fecha'
        ? getDayShortLabel(first.startDateTime) : 'Sin fecha',
      fullLabel: first.startDateTime && key !== 'sin-fecha'
        ? getDayFullLabel(first.startDateTime) : 'Sin fecha',
      sessions: items,
    };
  });
}

// ─── Day Tabs ─────────────────────────────────────────────────────────────────

const DayTabs: React.FC<{
  days: DayGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
  primary: string;
}> = ({ days, activeKey, onSelect, primary }) => {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={tabStyles.scroll}
      contentContainerStyle={tabStyles.content}
    >
      {days.map((day) => {
        const active = day.key === activeKey;
        return (
          <TouchableOpacity
            key={day.key}
            style={[
              tabStyles.pill,
              active ? { backgroundColor: primary } : tabStyles.pillInactive,
            ]}
            onPress={() => onSelect(day.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                tabStyles.pillText,
                active ? tabStyles.pillTextActive : tabStyles.pillTextInactive,
              ]}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const tabStyles = StyleSheet.create({
  scroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  pillInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: colors.text.secondary },
});

// ─── Session Card ─────────────────────────────────────────────────────────────

const SessionCard: React.FC<{
  session: SessionWithMeta;
  isAttending: boolean;
  onAttend: () => void;
  onCancel: () => void;
  attendLoading: boolean;
  onSpeakerPress: (id: string) => void;
  primary: string;
  isLast: boolean;
}> = ({ session, isAttending, onAttend, onCancel, attendLoading, onSpeakerPress, primary, isLast }) => {
  const { t } = useTranslation();
  const duration = session.startDateTime && session.endDateTime
    ? getDuration(session.startDateTime, session.endDateTime) : '';

  return (
    <View style={rowStyles.row}>
      {/* Time column */}
      <View style={rowStyles.timeCol}>
        <Text style={rowStyles.timeText}>
          {session.startDateTime ? formatTime(session.startDateTime) : '--:--'}
        </Text>
      </View>

      {/* Timeline line + dot */}
      <View style={rowStyles.lineCol}>
        <View style={[rowStyles.dot, { backgroundColor: primary, borderColor: primary + '30' }]} />
        {!isLast && <View style={[rowStyles.line, { backgroundColor: primary + '30' }]} />}
      </View>

      {/* Session content */}
      <View style={[rowStyles.card, { borderLeftColor: primary }]}>
        {/* Type + duration row */}
        <View style={rowStyles.metaRow}>
          {session.typeSession ? (
            <View style={[rowStyles.typeBadge, { backgroundColor: primary + '15' }]}>
              <Text style={[rowStyles.typeBadgeText, { color: primary }]}>
                {session.typeSession}
              </Text>
            </View>
          ) : null}
          {!!duration && (
            <View style={rowStyles.durationBadge}>
              <Ionicons name="time-outline" size={11} color={colors.text.disabled} />
              <Text style={rowStyles.durationText}>{duration}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={rowStyles.title}>{session.title}</Text>

        {/* Room */}
        {!!session.room && (
          <View style={rowStyles.roomRow}>
            <Ionicons name="location-outline" size={13} color={colors.text.secondary} />
            <Text style={rowStyles.roomText}>{session.room}</Text>
          </View>
        )}

        {/* End time */}
        {!!session.endDateTime && (
          <View style={rowStyles.endTimeRow}>
            <Ionicons name="arrow-forward-outline" size={12} color={colors.text.disabled} />
            <Text style={rowStyles.endTimeText}>{formatTime(session.endDateTime)}</Text>
          </View>
        )}

        {/* Speakers */}
        {session.speakers && session.speakers.length > 0 && (
          <View style={rowStyles.speakersRow}>
            {session.speakers.map((sp) => (
              <TouchableOpacity
                key={sp._id}
                onPress={() => onSpeakerPress(sp._id)}
                style={rowStyles.speakerChip}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={11} color={primary} style={{ marginRight: 3 }} />
                <Text style={[rowStyles.speakerText, { color: primary }]}>{sp.names}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Attend button */}
        {session.requiresAttendance && (
          <TouchableOpacity
            style={[
              rowStyles.attendBtn,
              isAttending
                ? { borderColor: '#22c55e', borderWidth: 1.5, backgroundColor: '#f0fdf4' }
                : { backgroundColor: primary },
            ]}
            onPress={isAttending ? onCancel : onAttend}
            activeOpacity={0.8}
            disabled={attendLoading}
          >
            {attendLoading ? (
              <ActivityIndicator size="small" color={isAttending ? '#22c55e' : '#fff'} />
            ) : isAttending ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 5 }} />
                <Text style={[rowStyles.attendBtnText, { color: '#22c55e' }]}>
                  {t('agenda.attending')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                <Text style={[rowStyles.attendBtnText, { color: '#fff' }]}>
                  {t('agenda.attend')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: 4,
  },
  timeCol: {
    width: 52,
    paddingTop: 14,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  lineCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    zIndex: 1,
  },
  line: {
    flex: 1,
    width: 1.5,
    marginTop: 4,
    marginBottom: -4,
    minHeight: 24,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginLeft: 10,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  typeBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 11,
    color: colors.text.disabled,
    fontWeight: '500',
  },
  title: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  roomText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  endTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  endTimeText: {
    fontSize: 11,
    color: colors.text.disabled,
  },
  speakersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  speakerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speakerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  attendBtn: {
    marginTop: spacing.sm,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 36,
  },
  attendBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const AgendaScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();
  const bc = useBrandedColors();

  const [agendas, setAgendas] = useState<AgendaDoc[]>([]);
  const [myAttendances, setMyAttendances] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendLoading, setAttendLoading] = useState<Record<string, boolean>>({});
  const [activeDayKey, setActiveDayKey] = useState<string>('');

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

  // ── Build day groups ──
  const publishedAgendas = agendas.filter((a) => a.isPublished);
  const allSessions: SessionWithMeta[] = publishedAgendas
    .flatMap((a) =>
      a.sessions.map((s) => ({
        ...s,
        agendaId: a._id,
        agendaDressCode: a.dressCode,
        agendaRoom: a.room,
      })),
    )
    .sort((a, b) => {
      if (!a.startDateTime) return 1;
      if (!b.startDateTime) return -1;
      return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
    });

  const dayGroups = buildDayGroups(allSessions);

  // Select today's day if present, otherwise first day
  const resolvedActiveKey = (() => {
    if (activeDayKey && dayGroups.some((d) => d.key === activeDayKey)) return activeDayKey;
    const today = getTodayKey();
    const todayGroup = dayGroups.find((d) => d.key === today);
    return todayGroup ? todayGroup.key : dayGroups[0]?.key ?? '';
  })();

  const activeDayGroup = dayGroups.find((d) => d.key === resolvedActiveKey);

  // ── Loading / error states ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={bc.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: bc.primary }]}
          onPress={() => loadData()}
        >
          <Text style={styles.retryBtnText}>{t('base.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (publishedAgendas.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={[styles.emptyIconWrap, { backgroundColor: bc.primary + '15' }]}>
          <Ionicons name="calendar-outline" size={40} color={bc.primary} />
        </View>
        <Text style={styles.comingSoonTitle}>{t('agenda.comingSoon')}</Text>
        <Text style={styles.comingSoonSub}>{t('agenda.comingSoonSub')}</Text>
      </View>
    );
  }

  if (allSessions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('agenda.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Day selector */}
      {dayGroups.length > 1 && (
        <DayTabs
          days={dayGroups}
          activeKey={resolvedActiveKey}
          onSelect={setActiveDayKey}
          primary={bc.primary}
        />
      )}

      {/* Day label */}
      {activeDayGroup && (
        <View style={[styles.dayLabel, { borderLeftColor: bc.primary }]}>
          <Text style={[styles.dayLabelText, { color: bc.primary }]}>
            {activeDayGroup.fullLabel}
          </Text>
          {activeDayGroup.sessions[0]?.agendaDressCode ? (
            <View style={styles.dayMeta}>
              <Ionicons name="shirt-outline" size={13} color={colors.text.secondary} />
              <Text style={styles.dayMetaText}>
                {activeDayGroup.sessions[0].agendaDressCode}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Timeline */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[bc.primary]}
            tintColor={bc.primary}
          />
        }
      >
        {(activeDayGroup?.sessions ?? []).map((session, idx, arr) => (
          <SessionCard
            key={session._id}
            session={session}
            isAttending={myAttendances.includes(session._id)}
            onAttend={() => handleAttend(session._id)}
            onCancel={() => handleCancel(session._id)}
            attendLoading={!!attendLoading[session._id]}
            onSpeakerPress={(id) => router.push('/speaker/' + id)}
            primary={bc.primary}
            isLast={idx === arr.length - 1}
          />
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },

  dayLabel: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  dayLabelText: {
    ...typography.body1,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dayMetaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
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
  emptyText: {
    ...typography.body1,
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
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { ...typography.body2, color: '#fff', fontWeight: '600' },

  bottomPad: { height: spacing.xxl },
});
