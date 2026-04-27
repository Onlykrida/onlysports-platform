import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import CachedImage from '@/components/CachedImage';

interface PendingRequest {
  id: string;
  test_result_id: string;
  athlete_id: string;
  athlete_name: string;
  athlete_avatar?: string | null;
  test_type: string;
  zone: string | null;
  display_value: string;
}

interface Props {
  coachId: string;
}

// Surfaces the verification-request queue right at the top of CoachHome.
// Coaches drive the `coach_verified` tier (1.0× scoutConfidenceMultiplier vs
// 0.85× app-tested), which is the platform's biggest moat — but until this
// card existed, there was no way to reach the approval flow from the
// dashboard. Tapping a row deep-links to /verify-result with the params
// the existing screen expects.
export default function CoachVerificationQueue({ coachId }: Props) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !coachId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Pull pending requests + the joined fitness_test_result + athlete profile.
      // Limited to 10; UI shows the first 3 inline and a "View all" entry if more.
      const { data, error } = await supabase
        .from('verification_requests')
        .select(
          `
          id,
          test_result_id,
          athlete_id,
          fitness_test_results:test_result_id (
            test_type,
            zone,
            level,
            shuttle,
            sprint_time,
            agility_time,
            jump_height
          ),
          profiles:athlete_id (
            name,
            avatar
          )
          `,
        )
        .eq('coach_id', coachId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (
          error.code === 'PGRST205' ||
          msg.includes('does not exist') ||
          msg.includes('could not find the table')
        ) {
          setTableMissing(true);
          setRequests([]);
          return;
        }
        if (__DEV__) console.warn('CoachVerificationQueue: fetch error', error);
        setRequests([]);
        return;
      }

      const mapped: PendingRequest[] = (data ?? []).map((row: any) => {
        const test = row.fitness_test_results;
        const profile = row.profiles;
        return {
          id: row.id,
          test_result_id: row.test_result_id,
          athlete_id: row.athlete_id,
          athlete_name: profile?.name ?? 'Athlete',
          athlete_avatar: profile?.avatar ?? null,
          test_type: test?.test_type ?? 'unknown',
          zone: test?.zone ?? null,
          display_value: formatTestValue(test),
        };
      });
      setRequests(mapped);
    } catch (e) {
      if (__DEV__) console.warn('CoachVerificationQueue: load exception', e);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (tableMissing) return null; // pre-deploy environments — silent

  const handleOpen = (req: PendingRequest) => {
    router.push({
      pathname: '/verify-result' as any,
      params: {
        requestId: req.id,
        testResultId: req.test_result_id,
        athleteName: req.athlete_name,
        athleteAvatar: req.athlete_avatar ?? '',
        testType: req.test_type,
        zone: req.zone ?? '',
        value: req.display_value,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <ShieldCheck size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>VERIFICATION QUEUE</Text>
            <Text style={styles.subtitle}>
              {isLoading
                ? 'Loading…'
                : requests.length === 0
                  ? 'You’re all caught up'
                  : `${requests.length} athlete${requests.length === 1 ? '' : 's'} awaiting your stamp`}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : requests.length === 0 ? (
        <Text style={styles.emptyHint}>
          Athletes you’ve worked with will request your sign-off here. Coach-verified results earn
          1.0× scout trust vs 0.85× for app-tested.
        </Text>
      ) : (
        <View style={styles.list}>
          {requests.slice(0, 3).map((req) => (
            <TouchableOpacity
              key={req.id}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handleOpen(req)}
            >
              <CachedImage
                source={req.athlete_avatar ?? undefined}
                size={36}
                placeholder="avatar"
              />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1} ellipsizeMode="tail">
                  {req.athlete_name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1} ellipsizeMode="tail">
                  {req.test_type.replace(/_/g, ' ').toUpperCase()}
                  {req.display_value ? ` · ${req.display_value}` : ''}
                  {req.zone ? ` · ${req.zone.toUpperCase()}` : ''}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
          {requests.length > 3 && (
            <Text style={styles.moreLabel}>
              + {requests.length - 3} more — tap any row to review
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function formatTestValue(test: any): string {
  if (!test) return '';
  if (test.test_type === 'yoyo' && test.level != null) {
    return `Lv ${test.level}.${test.shuttle ?? 0}`;
  }
  if (typeof test.sprint_time === 'number') return `${test.sprint_time.toFixed(2)}s`;
  if (typeof test.agility_time === 'number') return `${test.agility_time.toFixed(2)}s`;
  if (typeof test.jump_height === 'number') return `${test.jump_height} cm`;
  return '';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.dashBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingRow: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  list: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  rowMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  moreLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingTop: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    paddingTop: theme.spacing.xs,
  },
});
