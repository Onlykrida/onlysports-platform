import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import {
  getZone,
  calculateVO2max,
  calculateDistance,
  getSprintZone,
  getAgilityZone,
  getVerticalJumpZone,
  getAgeGroup,
} from '@/constants/fitness-test-data';
import type { Gender, AgeGroup, TestType, ZoneDefinition } from '@/constants/fitness-test-data';
import type { FitnessTestResult } from '@/types';

const CHART_HEIGHT = 180;
const DOT_SIZE = 10;

// ── Test type metadata ───────────────────────────────────────
const TEST_TYPE_CONFIG: Record<
  TestType,
  { label: string; shortLabel: string; unit: string; lowerIsBetter: boolean }
> = {
  // v1.0
  yoyo: { label: 'Yo-Yo IR1', shortLabel: 'Yo-Yo', unit: 'm', lowerIsBetter: false },
  sprint_20m: { label: '20m Sprint', shortLabel: '20m', unit: 's', lowerIsBetter: true },
  sprint_40m: { label: '40m Sprint', shortLabel: '40m', unit: 's', lowerIsBetter: true },
  agility_ttest: { label: 'Agility T-Test', shortLabel: 'Agility', unit: 's', lowerIsBetter: true },
  vertical_jump: {
    label: 'Vertical Jump',
    shortLabel: 'V. Jump',
    unit: 'cm',
    lowerIsBetter: false,
  },
  // v1.5 wedge
  sprint_10m: { label: '10m Sprint', shortLabel: '10m', unit: 's', lowerIsBetter: true },
  sprint_30m: { label: '30m Sprint', shortLabel: '30m', unit: 's', lowerIsBetter: true },
  gps_time_trial: { label: 'GPS Time Trial', shortLabel: 'GPS', unit: 's', lowerIsBetter: true },
  juggling_count: { label: 'Juggling', shortLabel: 'Juggle', unit: 'reps', lowerIsBetter: false },
  wall_volley_count: {
    label: 'Wall Volley',
    shortLabel: 'Volley',
    unit: 'reps',
    lowerIsBetter: false,
  },
  dribble_cones_count: {
    label: 'Dribble Cones',
    shortLabel: 'Dribble',
    unit: 'reps',
    lowerIsBetter: false,
  },
  spot_shooting_pct: {
    label: 'Spot Shooting',
    shortLabel: 'Shoot',
    unit: '%',
    lowerIsBetter: false,
  },
  drag_flick_accuracy: {
    label: 'Drag Flick',
    shortLabel: 'Flick',
    unit: '%',
    lowerIsBetter: false,
  },
  crossing_accuracy: { label: 'Crossing', shortLabel: 'Cross', unit: '%', lowerIsBetter: false },
  bowling_accuracy: {
    label: 'Bowling Line+Length',
    shortLabel: 'Bowl',
    unit: '%',
    lowerIsBetter: false,
  },
};

const ALL_TEST_TYPES: TestType[] = [
  // v1.0
  'yoyo',
  'sprint_20m',
  'sprint_40m',
  'agility_ttest',
  'vertical_jump',
  // v1.5 — appended in display order; per-sport filtering at render time
  'sprint_10m',
  'sprint_30m',
  'gps_time_trial',
  'juggling_count',
  'wall_volley_count',
  'dribble_cones_count',
  'spot_shooting_pct',
  'drag_flick_accuracy',
  'crossing_accuracy',
  'bowling_accuracy',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function getTestModeLabel(result: FitnessTestResult): string {
  switch (result.test_mode) {
    case 'coached':
      return 'Coach-tested';
    case 'manual':
      return 'Manual entry';
    case 'self':
    default:
      return 'Self-tested';
  }
}

function getZoneEmoji(zone: string): string {
  switch (zone) {
    case 'starter':
      return '\u{1F535}';
    case 'building':
      return '\u{1F535}';
    case 'rising':
      return '\u{1F7E0}';
    case 'strong':
      return '\u{1F7E2}';
    case 'elite':
      return '\u{1F7E2}';
    case 'unstoppable':
      return '\u{1F7E1}';
    default:
      return '\u{26AA}';
  }
}

function getZoneForResult(
  result: FitnessTestResult,
  gender: Gender,
  ageGroup: AgeGroup,
): ZoneDefinition {
  switch (result.test_type) {
    case 'yoyo': {
      const distance =
        result.total_distance ?? calculateDistance(result.level ?? 5, result.shuttle ?? 1);
      return getZone(distance, gender, ageGroup);
    }
    case 'sprint_20m':
      return getSprintZone(result.sprint_time ?? 0, 20, gender, ageGroup);
    case 'sprint_40m':
      return getSprintZone(result.sprint_time ?? 0, 40, gender, ageGroup);
    case 'agility_ttest':
      return getAgilityZone(result.agility_time ?? 0, gender, ageGroup);
    case 'vertical_jump':
      return getVerticalJumpZone(result.jump_height ?? 0, gender, ageGroup);
    default:
      return getZone(0, gender, ageGroup);
  }
}

function getPrimaryMetric(result: FitnessTestResult): number {
  switch (result.test_type) {
    case 'yoyo':
      return result.total_distance ?? calculateDistance(result.level ?? 5, result.shuttle ?? 1);
    case 'sprint_20m':
    case 'sprint_40m':
      return result.sprint_time ?? 0;
    case 'agility_ttest':
      return result.agility_time ?? 0;
    case 'vertical_jump':
      return result.jump_height ?? 0;
    default:
      return 0;
  }
}

function getChartValue(result: FitnessTestResult): number {
  const metric = getPrimaryMetric(result);
  const config = TEST_TYPE_CONFIG[result.test_type];
  // For lower-is-better metrics, invert for chart display
  if (config.lowerIsBetter && metric > 0) {
    return (1 / metric) * 100; // Scale up for visibility
  }
  return metric;
}

function formatPrimaryMetric(result: FitnessTestResult): string {
  switch (result.test_type) {
    case 'yoyo':
      return `L${result.level ?? '?'}.${result.shuttle ?? '?'}`;
    case 'sprint_20m':
    case 'sprint_40m':
      return `${(result.sprint_time ?? 0).toFixed(2)}s`;
    case 'agility_ttest':
      return `${(result.agility_time ?? 0).toFixed(2)}s`;
    case 'vertical_jump':
      return `${result.jump_height ?? 0}cm`;
    default:
      return '—';
  }
}

function formatSecondaryMetric(result: FitnessTestResult): string | null {
  switch (result.test_type) {
    case 'yoyo': {
      const distance =
        result.total_distance ?? calculateDistance(result.level ?? 5, result.shuttle ?? 1);
      const vo2max = result.vo2max ?? calculateVO2max(distance);
      return `VO2max ${vo2max.toFixed(1)} | ${distance.toLocaleString()}m`;
    }
    default:
      return null;
  }
}

function getBestResultComparator(
  testType: TestType,
): (a: FitnessTestResult, b: FitnessTestResult) => number {
  const config = TEST_TYPE_CONFIG[testType];
  if (config.lowerIsBetter) {
    return (a, b) => getPrimaryMetric(a) - getPrimaryMetric(b); // Lower wins
  }
  return (a, b) => getPrimaryMetric(b) - getPrimaryMetric(a); // Higher wins
}

function getImprovementDiff(
  oldest: FitnessTestResult,
  latest: FitnessTestResult,
  testType: TestType,
): { diff: number; trend: 'improving' | 'flat' | 'declining' } {
  const oldVal = getPrimaryMetric(oldest);
  const newVal = getPrimaryMetric(latest);
  const config = TEST_TYPE_CONFIG[testType];

  const rawDiff = newVal - oldVal;
  const absDiff = Math.abs(rawDiff);

  let trend: 'improving' | 'flat' | 'declining';
  if (config.lowerIsBetter) {
    // For time-based: decrease is improvement
    if (rawDiff < -0.05) trend = 'improving';
    else if (rawDiff > 0.05) trend = 'declining';
    else trend = 'flat';
  } else {
    // For distance/height: increase is improvement
    if (rawDiff > 0.5) trend = 'improving';
    else if (rawDiff < -0.5) trend = 'declining';
    else trend = 'flat';
  }

  return { diff: absDiff, trend };
}

function formatImprovementDiff(diff: number, testType: TestType): string {
  const config = TEST_TYPE_CONFIG[testType];
  switch (testType) {
    case 'yoyo':
      return `${diff.toFixed(0)}m`;
    case 'sprint_20m':
    case 'sprint_40m':
    case 'agility_ttest':
      return `${diff.toFixed(2)}s`;
    case 'vertical_jump':
      return `${diff.toFixed(1)}cm`;
    default:
      return `${diff.toFixed(1)}${config.unit}`;
  }
}

export default function FitnessTestHistoryScreen() {
  const { user } = useAuth();
  const {
    athleteId,
    athleteName,
    testType: testTypeParam,
  } = useLocalSearchParams<{
    athleteId?: string;
    athleteName?: string;
    testType?: string;
  }>();

  const [activeTestType, setActiveTestType] = useState<TestType>(
    (ALL_TEST_TYPES.includes(testTypeParam as TestType) ? testTypeParam : 'yoyo') as TestType,
  );
  const [results, setResults] = useState<FitnessTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState<Gender>('male');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('senior');

  const targetId = athleteId || user?.id;
  const displayName = athleteName || user?.name || 'Athlete';

  // Fetch profile for gender/age group
  useEffect(() => {
    async function loadProfile() {
      if (!targetId || !isSupabaseConfigured) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('gender, date_of_birth')
          .eq('id', targetId)
          .single();
        if (data?.gender && (data.gender === 'male' || data.gender === 'female')) {
          setGender(data.gender as Gender);
        }
        if (data?.date_of_birth) {
          setAgeGroup(getAgeGroup(data.date_of_birth));
        }
      } catch {
        // Defaults remain
      }
    }
    void loadProfile();
  }, [targetId]);

  const loadHistory = useCallback(async () => {
    if (!targetId || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Pull the verifier profile alongside the result so the row can show
      // "Verified by [Name] · [mode]". The FK fitness_test_results.verified_by
      // → profiles.id makes this expansion safe.
      const { data, error } = await supabase
        .from('fitness_test_results')
        .select('*, verifier:verified_by(name, role)')
        .eq('athlete_id', targetId)
        .eq('test_type', activeTestType)
        .order('test_date', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === 'PGRST205') {
          setIsLoading(false);
          return;
        }
        if (__DEV__) console.error('Failed to load fitness test history:', error);
        setIsLoading(false);
        return;
      }

      setResults((data as any[]) || []);
    } catch (e) {
      if (__DEV__) console.error('FitnessTestHistory: load exception', e);
    } finally {
      setIsLoading(false);
    }
  }, [targetId, activeTestType]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const config = TEST_TYPE_CONFIG[activeTestType];

  // Computed summary values
  const summary = useMemo(() => {
    if (results.length === 0) return null;

    const latest = results[0];
    const oldest = results[results.length - 1];

    const sorted = [...results].sort(getBestResultComparator(activeTestType));
    const bestResult = sorted[0];

    const latestZone = getZoneForResult(latest, gender, ageGroup);

    return {
      currentZone: latestZone,
      bestMetric: formatPrimaryMetric(bestResult),
      testsTaken: results.length,
      firstTestDate: oldest.test_date,
    };
  }, [results, activeTestType, gender, ageGroup]);

  // Improvement calculation
  const improvement = useMemo(() => {
    if (results.length < 2) return null;

    const oldest = results[results.length - 1];
    const latest = results[0];

    const { diff, trend } = getImprovementDiff(oldest, latest, activeTestType);

    const oldDate = new Date(oldest.test_date);
    const newDate = new Date(latest.test_date);
    const monthsDiff = Math.max(
      1,
      Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );

    return {
      diffLabel: formatImprovementDiff(diff, activeTestType),
      months: monthsDiff,
      trend,
    };
  }, [results, activeTestType]);

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack.Screen
          options={{
            title: `${config.label} History`,
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: theme.colors.text,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ChevronLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />

        {/* Test Type Filter Tabs */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBarContent}
          >
            {ALL_TEST_TYPES.map((tt) => {
              const ttConfig = TEST_TYPE_CONFIG[tt];
              const isActive = tt === activeTestType;
              return (
                <TouchableOpacity
                  key={tt}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setActiveTestType(tt)}
                >
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {ttConfig.shortLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No {config.label} results yet</Text>
            <Text style={styles.emptySubtext}>Take your first test to start tracking!</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.screenTitle} numberOfLines={1} ellipsizeMode="tail">
                {config.label.toUpperCase()} HISTORY
              </Text>
              <Text style={styles.athleteName} numberOfLines={1} ellipsizeMode="tail">
                {displayName}
              </Text>
            </View>

            {/* Summary Card */}
            {summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SUMMARY</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Current Zone</Text>
                    <View style={styles.zoneBadge}>
                      <View
                        style={[styles.zoneDot, { backgroundColor: summary.currentZone.color }]}
                      />
                      <Text
                        style={[styles.summaryValue, { color: summary.currentZone.color }]}
                        numberOfLines={1}
                      >
                        {summary.currentZone.label.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Personal Best</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {summary.bestMetric}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tests Taken</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {summary.testsTaken}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>First Test</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {formatDate(summary.firstTestDate)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Progress Chart */}
            {results.length >= 2 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROGRESS</Text>
                <View style={styles.chartCard}>
                  <ProgressChart
                    results={results}
                    testType={activeTestType}
                    gender={gender}
                    ageGroup={ageGroup}
                  />
                </View>

                {/* Improvement Badge */}
                {improvement && (
                  <View
                    style={[
                      styles.improvementBadge,
                      improvement.trend === 'improving' && styles.improvementBadgeGreen,
                      improvement.trend === 'flat' && styles.improvementBadgeOrange,
                      improvement.trend === 'declining' && styles.improvementBadgeRed,
                    ]}
                  >
                    <Text style={styles.improvementText}>
                      {improvement.trend === 'improving'
                        ? `\u2191 Improving! +${improvement.diffLabel} in ${improvement.months} month${improvement.months !== 1 ? 's' : ''}`
                        : improvement.trend === 'declining'
                          ? `\u2193 -${improvement.diffLabel} in ${improvement.months} month${improvement.months !== 1 ? 's' : ''}`
                          : `\u2194 Steady over ${improvement.months} month${improvement.months !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* All Results */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ALL RESULTS</Text>
              {results.map((result) => (
                <ResultCard key={result.id} result={result} gender={gender} ageGroup={ageGroup} />
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

/* --- Progress Chart Component --- */
function ProgressChart({
  results,
  testType,
  gender,
  ageGroup,
}: {
  results: FitnessTestResult[];
  testType: TestType;
  gender: Gender;
  ageGroup: AgeGroup;
}) {
  const chartWidth =
    Dimensions.get('window').width - theme.spacing.md * 2 - theme.spacing.md * 2 - 40;
  const config = TEST_TYPE_CONFIG[testType];

  // Results are newest first; reverse for chronological order
  const chronological = useMemo(() => [...results].reverse(), [results]);

  const chartValues = chronological.map((r) => getChartValue(r));
  const minVal = Math.min(...chartValues);
  const maxVal = Math.max(...chartValues);
  const padding = (maxVal - minVal) * 0.15 || 1;
  const rangeMin = minVal - padding;
  const rangeMax = maxVal + padding;
  const range = rangeMax - rangeMin;

  // Y-axis labels
  const ySteps = 4;
  const yLabels: number[] = [];
  for (let i = 0; i <= ySteps; i++) {
    yLabels.push(rangeMin + (range * i) / ySteps);
  }
  const yLabelsReversed = [...yLabels].reverse();

  // Format y-axis label based on test type
  function formatYLabel(val: number): string {
    if (config.lowerIsBetter) {
      // Invert back to actual time
      const actualTime = 100 / val;
      return `${actualTime.toFixed(1)}s`;
    }
    if (testType === 'yoyo') return `${Math.round(val)}m`;
    if (testType === 'vertical_jump') return `${Math.round(val)}cm`;
    return `${val.toFixed(0)}`;
  }

  // Calculate positions
  const points = chronological.map((r, idx) => {
    const chartVal = getChartValue(r);
    const x =
      chronological.length === 1 ? chartWidth / 2 : (idx / (chronological.length - 1)) * chartWidth;
    const y = CHART_HEIGHT - ((chartVal - rangeMin) / range) * CHART_HEIGHT;
    const zone = getZoneForResult(r, gender, ageGroup);
    return { x, y, chartVal, zone, date: r.test_date, result: r };
  });

  // Determine line color based on trend
  const isImproving =
    chartValues.length >= 2 && chartValues[chartValues.length - 1] > chartValues[0];
  const lineColor = isImproving ? theme.colors.primary : theme.colors.warning;

  return (
    <View style={styles.chartContainer}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        {yLabelsReversed.map((label, i) => (
          <Text key={`y-${i}`} style={styles.yAxisLabel}>
            {formatYLabel(label)}
          </Text>
        ))}
      </View>

      {/* Chart area */}
      <View style={[styles.chartArea, { width: chartWidth, height: CHART_HEIGHT }]}>
        {/* Horizontal grid lines */}
        {yLabels.map((label, i) => {
          const y = CHART_HEIGHT - ((label - rangeMin) / range) * CHART_HEIGHT;
          return <View key={`grid-${i}`} style={[styles.gridLine, { top: y }]} />;
        })}

        {/* Lines connecting dots */}
        {points.map((point, idx) => {
          if (idx === 0) return null;
          const prev = points[idx - 1];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <View
              key={`line-${idx}`}
              style={[
                styles.chartLine,
                {
                  left: prev.x + DOT_SIZE / 2,
                  top: prev.y + DOT_SIZE / 2 - 1,
                  width: length,
                  backgroundColor: lineColor,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                },
              ]}
            />
          );
        })}

        {/* Dots */}
        {points.map((point, idx) => (
          <View
            key={`dot-${idx}`}
            style={[
              styles.chartDot,
              {
                left: point.x,
                top: point.y,
                backgroundColor: point.zone.color,
              },
            ]}
          />
        ))}

        {/* Score labels on dots */}
        {points.map((point, idx) => (
          <Text
            key={`label-${idx}`}
            style={[
              styles.dotLabel,
              {
                left: point.x - 15,
                top: point.y - 18,
              },
            ]}
            numberOfLines={1}
          >
            {formatPrimaryMetric(point.result)}
          </Text>
        ))}

        {/* X-axis date labels */}
        <View style={[styles.xAxis, { width: chartWidth }]}>
          {points.map((point, idx) => {
            // Show max 5 labels to avoid crowding
            if (
              points.length > 5 &&
              idx % Math.ceil(points.length / 5) !== 0 &&
              idx !== points.length - 1
            ) {
              return null;
            }
            return (
              <Text
                key={`x-${idx}`}
                style={[styles.xAxisLabel, { left: point.x - 15 }]}
                numberOfLines={1}
              >
                {formatShortDate(point.date)}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* --- Result Card Component --- */
function ResultCard({
  result,
  gender,
  ageGroup,
}: {
  result: FitnessTestResult;
  gender: Gender;
  ageGroup: AgeGroup;
}) {
  const zoneDef = getZoneForResult(result, gender, ageGroup);
  const zoneColor = zoneDef.color;
  const secondary = formatSecondaryMetric(result);

  return (
    <View style={[styles.resultCard, { borderLeftColor: zoneColor }]}>
      <Text style={styles.resultDate} numberOfLines={1} ellipsizeMode="tail">
        {formatDate(result.test_date)}
      </Text>
      <View style={styles.resultMain}>
        <View style={styles.resultZoneBadge}>
          <Text style={styles.resultZoneEmoji}>{getZoneEmoji(result.zone)}</Text>
          <Text style={[styles.resultZoneName, { color: zoneColor }]} numberOfLines={1}>
            {zoneDef.label.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.resultScore} numberOfLines={1}>
          {formatPrimaryMetric(result)}
        </Text>
        {secondary && (
          <Text style={styles.resultVo2} numberOfLines={1}>
            {secondary}
          </Text>
        )}
      </View>
      <View style={styles.resultMeta}>
        {result.test_type === 'yoyo' && result.total_distance != null && (
          <>
            <Text style={styles.resultMetaText} numberOfLines={1} ellipsizeMode="tail">
              {result.total_distance.toLocaleString()}m
            </Text>
            <Text style={styles.resultMetaDot}>{'\u2022'}</Text>
          </>
        )}
        <Text style={styles.resultMetaText} numberOfLines={1} ellipsizeMode="tail">
          {getTestModeLabel(result)}
        </Text>
      </View>
      {/* Verifier line \u2014 appears only for verified results. The mode pill
          tells you whether they were physically present or watched a video. */}
      {(result as any).verifier?.name && (
        <View style={styles.verifierRow}>
          <Text style={styles.verifierText} numberOfLines={1} ellipsizeMode="tail">
            Verified by <Text style={styles.verifierName}>{(result as any).verifier.name}</Text>
          </Text>
          {(result as any).verification_mode && (
            <View
              style={[
                styles.modePill,
                (result as any).verification_mode === 'in_person' && styles.modePillStrong,
              ]}
            >
              <Text
                style={[
                  styles.modePillText,
                  (result as any).verification_mode === 'in_person' && styles.modePillTextStrong,
                ]}
              >
                {(result as any).verification_mode === 'in_person'
                  ? 'In-Person'
                  : (result as any).verification_mode === 'remote_video'
                    ? 'Video'
                    : 'Sensor'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Filter Bar
  filterBar: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterBarContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#000',
    fontWeight: theme.fontWeight.bold,
  },

  // Header
  headerSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  screenTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  athleteName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Sections
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.sm,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Chart
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    width: 36,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingRight: theme.spacing.xs,
  },
  yAxisLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  chartArea: {
    position: 'relative',
    marginLeft: theme.spacing.sm,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  chartDot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  dotLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    width: 40,
    textAlign: 'center',
  },
  xAxis: {
    position: 'absolute',
    top: CHART_HEIGHT + 6,
    left: 0,
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },

  // Improvement Badge
  improvementBadge: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  improvementBadgeGreen: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  improvementBadgeOrange: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
  },
  improvementBadgeRed: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  improvementText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },

  // Result Cards
  resultCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 3,
  },
  resultDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  resultMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  resultZoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  resultZoneEmoji: {
    fontSize: 12,
  },
  resultZoneName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
  },
  resultScore: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  resultVo2: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resultMetaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  resultMetaDot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  verifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  verifierText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  verifierName: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  modePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.cyan + '22',
  },
  modePillStrong: {
    backgroundColor: theme.colors.primary + '26',
  },
  modePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.cyan,
    letterSpacing: 0.5,
  },
  modePillTextStrong: {
    color: theme.colors.primary,
  },
});
