import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Timer,
  TrendingUp,
  Target,
  Lightbulb,
  ChevronRight,
  Zap,
  Wind,
  ArrowUp,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { FitnessTestResult, FitnessTestType } from '@/types';
import {
  getZone,
  getNextZoneTarget,
  getImprovementTips,
  getSprintZone,
  getAgilityZone,
  getVerticalJumpZone,
  ZoneDefinition,
  Gender,
  AgeGroup,
} from '@/constants/fitness-test-data';
import { Button } from '@/components/Button';
import VerificationBadge from '@/components/VerificationBadge';

// ─── Constants ──────────────────────────────────────────────────────────────────

const TEST_TYPE_CONFIG: Record<
  FitnessTestType,
  { label: string; shortLabel: string; unit: string; icon: typeof Timer }
> = {
  // v1.0
  yoyo: { label: 'Yo-Yo IR1', shortLabel: 'Yo-Yo', unit: 'm', icon: Timer },
  sprint_20m: { label: '20m Sprint', shortLabel: '20m', unit: 's', icon: Zap },
  sprint_40m: { label: '40m Sprint', shortLabel: '40m', unit: 's', icon: Zap },
  agility_ttest: { label: 'Agility T-Test', shortLabel: 'Agility', unit: 's', icon: Wind },
  vertical_jump: { label: 'Vertical Jump', shortLabel: 'Jump', unit: 'cm', icon: ArrowUp },
  // v1.5 wedge — placeholder labels; refined by the test screens that ship them
  sprint_10m: { label: '10m Sprint', shortLabel: '10m', unit: 's', icon: Zap },
  sprint_30m: { label: '30m Sprint', shortLabel: '30m', unit: 's', icon: Zap },
  gps_time_trial: { label: 'GPS Time Trial', shortLabel: 'GPS', unit: 's', icon: Timer },
  juggling_count: { label: 'Juggling Count', shortLabel: 'Juggle', unit: 'reps', icon: Timer },
  wall_volley_count: { label: 'Wall Volley', shortLabel: 'Volley', unit: 'reps', icon: Timer },
  dribble_cones_count: { label: 'Dribble Cones', shortLabel: 'Dribble', unit: 'reps', icon: Wind },
  spot_shooting_pct: { label: 'Spot Shooting', shortLabel: 'Shooting', unit: '%', icon: ArrowUp },
  drag_flick_accuracy: { label: 'Drag Flick', shortLabel: 'Flick', unit: '%', icon: ArrowUp },
  crossing_accuracy: { label: 'Crossing', shortLabel: 'Cross', unit: '%', icon: ArrowUp },
  bowling_accuracy: { label: 'Bowling Line+Length', shortLabel: 'Bowl', unit: '%', icon: ArrowUp },
};

// ─── Props ──────────────────────────────────────────────────────────────────────

interface FitnessTestCardProps {
  variant: 'athlete' | 'scout' | 'empty';
  latestByType?: Partial<Record<FitnessTestType, FitnessTestResult>>;
  history?: FitnessTestResult[];
  gender?: Gender;
  ageGroup?: AgeGroup;
  onTakeTest?: () => void;
  onViewHistory?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDistance(meters: number): string {
  return meters.toLocaleString() + 'm';
}

function getZoneForResult(
  result: FitnessTestResult,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): ZoneDefinition {
  switch (result.test_type) {
    case 'yoyo':
      return getZone(result.total_distance ?? 0, gender, ageGroup);
    case 'sprint_10m':
      return getSprintZone(result.sprint_time ?? 99, 10, gender, ageGroup);
    case 'sprint_20m':
      return getSprintZone(result.sprint_time ?? 99, 20, gender, ageGroup);
    case 'sprint_30m':
      return getSprintZone(result.sprint_time ?? 99, 30, gender, ageGroup);
    case 'sprint_40m':
      return getSprintZone(result.sprint_time ?? 99, 40, gender, ageGroup);
    case 'agility_ttest':
      return getAgilityZone(result.agility_time ?? 99, gender, ageGroup);
    case 'vertical_jump':
      return getVerticalJumpZone(result.jump_height ?? 0, gender, ageGroup);
    default:
      return getZone(0, gender, ageGroup);
  }
}

function getPrimaryValue(result: FitnessTestResult): string {
  switch (result.test_type) {
    case 'yoyo':
      return formatDistance(result.total_distance ?? 0);
    case 'sprint_10m':
    case 'sprint_20m':
    case 'sprint_30m':
    case 'sprint_40m':
      return `${result.sprint_time?.toFixed(2) ?? '—'}s`;
    case 'agility_ttest':
      return `${result.agility_time?.toFixed(2) ?? '—'}s`;
    case 'vertical_jump':
      return `${result.jump_height ?? '—'}cm`;
    default:
      return '—';
  }
}

function getZoneProgress(result: FitnessTestResult, zone: ZoneDefinition): number {
  // For Yo-Yo, use distance-based progress within zone
  if (result.test_type === 'yoyo' && zone.maxDistance > 0) {
    const distance = result.total_distance ?? 0;
    const range = zone.maxDistance - zone.minDistance;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, (distance - zone.minDistance) / range));
  }
  // For other tests, show a flat indicator (zone already determined)
  return 0.6;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const FitnessTestCard: React.FC<FitnessTestCardProps> = ({
  variant,
  latestByType,
  history,
  gender = 'male',
  ageGroup = 'senior',
  onTakeTest,
  onViewHistory,
}) => {
  if (variant === 'empty') {
    return <EmptyVariant onTakeTest={onTakeTest} />;
  }

  const results = latestByType ?? {};
  const testTypes = Object.keys(results) as FitnessTestType[];

  if (testTypes.length === 0) {
    return <EmptyVariant onTakeTest={onTakeTest} />;
  }

  if (variant === 'scout') {
    return (
      <ScoutVariant
        latestByType={results}
        history={history}
        gender={gender}
        ageGroup={ageGroup}
        onViewHistory={onViewHistory}
      />
    );
  }

  return (
    <AthleteVariant
      latestByType={results}
      gender={gender}
      ageGroup={ageGroup}
      onTakeTest={onTakeTest}
      onViewHistory={onViewHistory}
    />
  );
};

// ─── Empty Variant ──────────────────────────────────────────────────────────────

const EmptyVariant: React.FC<{ onTakeTest?: () => void }> = ({ onTakeTest }) => (
  <View style={styles.container}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Timer size={20} color={theme.colors.primary} />
        <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
          FITNESS TESTS
        </Text>
      </View>
    </View>

    <View style={styles.emptyContent}>
      <Text style={styles.emptyHeading} numberOfLines={1} ellipsizeMode="tail">
        Know your fitness level.
      </Text>
      <Text style={styles.emptyBody} numberOfLines={3} ellipsizeMode="tail">
        Take fitness tests to measure your endurance, speed, agility, and power. Get a clear path to
        improve.
      </Text>
    </View>

    {onTakeTest && (
      <View style={styles.buttonRow}>
        <Button
          title="Take My First Test"
          onPress={onTakeTest}
          variant="outline"
          size="medium"
          icon={<Timer size={16} color={theme.colors.primary} />}
        />
      </View>
    )}
  </View>
);

// ─── Test Result Row (compact) ──────────────────────────────────────────────────

interface TestResultRowProps {
  result: FitnessTestResult;
  gender: Gender;
  ageGroup: AgeGroup;
}

const TestResultRow: React.FC<TestResultRowProps> = ({ result, gender, ageGroup }) => {
  const config = TEST_TYPE_CONFIG[result.test_type];
  const zone = getZoneForResult(result, gender, ageGroup);
  const IconComponent = config.icon;

  return (
    <View style={styles.testResultRow}>
      <View style={styles.testResultLeft}>
        <IconComponent size={14} color={theme.colors.textSecondary} />
        <Text style={styles.testResultLabel} numberOfLines={1} ellipsizeMode="tail">
          {config.shortLabel}
        </Text>
      </View>
      <Text style={styles.testResultValue} numberOfLines={1} ellipsizeMode="tail">
        {getPrimaryValue(result)}
      </Text>
      <View style={[styles.zoneBadgeSmall, { backgroundColor: zone.color }]}>
        <Text style={styles.zoneBadgeSmallText} numberOfLines={1} ellipsizeMode="tail">
          {zone.label}
        </Text>
      </View>
      {result.verification_tier && (
        <VerificationBadge
          tier={result.verification_tier}
          mode={result.verification_mode}
          testType={result.test_type}
          size="sm"
        />
      )}
    </View>
  );
};

// ─── Athlete Variant ────────────────────────────────────────────────────────────

interface AthleteVariantProps {
  latestByType: Partial<Record<FitnessTestType, FitnessTestResult>>;
  gender: Gender;
  ageGroup: AgeGroup;
  onTakeTest?: () => void;
  onViewHistory?: () => void;
}

const AthleteVariant: React.FC<AthleteVariantProps> = ({
  latestByType,
  gender,
  ageGroup,
  onTakeTest,
  onViewHistory,
}) => {
  const testTypes = Object.keys(latestByType) as FitnessTestType[];

  // Use yoyo as the "featured" test if available, otherwise first available
  const featuredType = testTypes.includes('yoyo') ? 'yoyo' : testTypes[0];
  const featuredResult = latestByType[featuredType]!;
  const featuredZone = getZoneForResult(featuredResult, gender, ageGroup);
  const featuredProgress = getZoneProgress(featuredResult, featuredZone);

  // Next goal (only for Yo-Yo since it has distance-based progression)
  const yoyoResult = latestByType.yoyo;
  const nextTarget = yoyoResult
    ? getNextZoneTarget(yoyoResult.total_distance ?? 0, gender, ageGroup)
    : null;

  // Tips for featured zone
  const tips = getImprovementTips(featuredZone.name);

  // Other tests (non-featured)
  const otherTests = testTypes.filter((t) => t !== featuredType);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Timer size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
            FITNESS TESTS
          </Text>
        </View>
        {onViewHistory && (
          <View style={styles.historyLink}>
            <Text
              style={styles.historyLinkText}
              numberOfLines={1}
              ellipsizeMode="tail"
              onPress={onViewHistory}
              accessibilityRole="button"
              accessibilityLabel="View fitness test history"
            >
              History
            </Text>
            <ChevronRight size={14} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Featured Result Card */}
      <View style={styles.card}>
        <View style={styles.resultHeader}>
          <View style={[styles.zoneBadge, { backgroundColor: featuredZone.color }]}>
            <Text style={styles.zoneBadgeText} numberOfLines={1} ellipsizeMode="tail">
              {featuredZone.label}
            </Text>
          </View>
          <VerificationBadge
            tier={featuredResult?.verification_tier || 'self_reported'}
            mode={featuredResult?.verification_mode}
            testType={featuredResult?.test_type}
            size="md"
            showLabel
          />
          <Text style={styles.levelText} numberOfLines={1} ellipsizeMode="tail">
            {getPrimaryValue(featuredResult)}
          </Text>
          <Text style={styles.testTypeLabel} numberOfLines={1} ellipsizeMode="tail">
            {TEST_TYPE_CONFIG[featuredType].label}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.round(featuredProgress * 100)}%`,
                backgroundColor: featuredZone.color,
              },
            ]}
          />
        </View>

        {/* Stats Row (Yo-Yo specific) */}
        {featuredResult.test_type === 'yoyo' && (
          <View style={styles.statsRow}>
            {featuredResult.vo2max != null && (
              <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                VO2max: {featuredResult.vo2max}
              </Text>
            )}
            {featuredResult.total_distance != null && (
              <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                Distance: {formatDistance(featuredResult.total_distance)}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.taglineText} numberOfLines={1} ellipsizeMode="tail">
          {'\u201C'}
          {featuredZone.tagline}
          {'\u201D'}
        </Text>

        <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
          {formatDate(featuredResult.test_date)}
        </Text>
      </View>

      {/* Other Tests Summary */}
      {otherTests.length > 0 && (
        <View style={styles.card}>
          <View style={styles.subSectionHeader}>
            <Target size={16} color={theme.colors.accent} />
            <Text style={styles.subSectionTitle} numberOfLines={1} ellipsizeMode="tail">
              OTHER TESTS
            </Text>
          </View>
          {otherTests.map((testType) => {
            const result = latestByType[testType]!;
            return (
              <TestResultRow key={testType} result={result} gender={gender} ageGroup={ageGroup} />
            );
          })}
        </View>
      )}

      {/* Next Goal Card (Yo-Yo only) */}
      {nextTarget && (
        <View style={styles.card}>
          <View style={styles.subSectionHeader}>
            <Target size={16} color={theme.colors.accent} />
            <Text style={styles.subSectionTitle} numberOfLines={1} ellipsizeMode="tail">
              YOUR NEXT GOAL
            </Text>
          </View>
          <Text style={styles.goalText} numberOfLines={2} ellipsizeMode="tail">
            {nextTarget.zone.label} zone starts at {formatDistance(nextTarget.zone.minDistance)}
          </Text>
          <Text style={styles.goalDetail} numberOfLines={2} ellipsizeMode="tail">
            You need {nextTarget.shuttlesNeeded} more shuttles (~
            {formatDistance(nextTarget.distanceNeeded)})
          </Text>
          <Text style={styles.goalMotivation} numberOfLines={1} ellipsizeMode="tail">
            {'\u201C'}You're closer than you think{'\u201D'}
          </Text>
        </View>
      )}

      {/* How To Improve Card */}
      <View style={styles.card}>
        <View style={styles.subSectionHeader}>
          <Lightbulb size={16} color={theme.colors.accent} />
          <Text style={styles.subSectionTitle} numberOfLines={1} ellipsizeMode="tail">
            HOW TO IMPROVE
          </Text>
        </View>
        {tips.map((tip, idx) => (
          <View key={idx} style={styles.tipRow}>
            <Text style={styles.tipBullet}>{'\u2192'}</Text>
            <Text style={styles.tipText} numberOfLines={3} ellipsizeMode="tail">
              {tip}
            </Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {onTakeTest && (
          <View style={styles.buttonWrapper}>
            <Button
              title="Take Test"
              onPress={onTakeTest}
              variant="outline"
              size="small"
              icon={<Timer size={16} color={theme.colors.primary} />}
            />
          </View>
        )}
        {onViewHistory && (
          <View style={styles.buttonWrapper}>
            <Button
              title="View History"
              onPress={onViewHistory}
              variant="outline"
              size="small"
              icon={<TrendingUp size={16} color={theme.colors.primary} />}
            />
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Scout Variant ──────────────────────────────────────────────────────────────

interface ScoutVariantProps {
  latestByType: Partial<Record<FitnessTestType, FitnessTestResult>>;
  history?: FitnessTestResult[];
  gender: Gender;
  ageGroup: AgeGroup;
  onViewHistory?: () => void;
}

const ScoutVariant: React.FC<ScoutVariantProps> = ({
  latestByType,
  history,
  gender,
  ageGroup,
  onViewHistory,
}) => {
  const testTypes = Object.keys(latestByType) as FitnessTestType[];

  // Trend calculation (across all results in history)
  let trendLabel: string | null = null;
  if (history && history.length >= 2) {
    const yoyoHistory = history.filter((r) => r.test_type === 'yoyo');
    if (yoyoHistory.length >= 2) {
      const newest = yoyoHistory[0];
      const oldest = yoyoHistory[yoyoHistory.length - 1];
      const newestDist = newest.total_distance ?? 0;
      const oldestDist = oldest.total_distance ?? 0;
      const distDiff = newestDist - oldestDist;
      const monthsDiff =
        (new Date(newest.test_date).getTime() - new Date(oldest.test_date).getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      const monthsStr = Math.max(1, Math.round(monthsDiff));

      if (distDiff > 0) {
        trendLabel = `\u2191 Improving (+${formatDistance(distDiff)} in ${monthsStr} month${monthsStr !== 1 ? 's' : ''})`;
      } else if (distDiff === 0) {
        trendLabel = '\u2194 Stable performance';
      } else {
        trendLabel = `Working on rebuilding (${formatDistance(Math.abs(distDiff))} change over ${monthsStr} month${monthsStr !== 1 ? 's' : ''})`;
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Timer size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
            FITNESS ASSESSMENT
          </Text>
        </View>
      </View>

      {/* All Test Results */}
      <View style={styles.card}>
        {testTypes.map((testType) => {
          const result = latestByType[testType]!;
          const zone = getZoneForResult(result, gender, ageGroup);
          const config = TEST_TYPE_CONFIG[testType];
          const IconComponent = config.icon;

          return (
            <View key={testType} style={styles.scoutTestBlock}>
              <View style={styles.scoutTopRow}>
                <IconComponent size={16} color={theme.colors.textSecondary} />
                <Text style={styles.scoutTestName} numberOfLines={1} ellipsizeMode="tail">
                  {config.label}
                </Text>
                <View style={[styles.zoneBadge, { backgroundColor: zone.color }]}>
                  <Text style={styles.zoneBadgeText} numberOfLines={1} ellipsizeMode="tail">
                    {zone.label}
                  </Text>
                </View>
                {result.verification_tier && (
                  <VerificationBadge
                    tier={result.verification_tier}
                    mode={result.verification_mode}
                    testType={result.test_type}
                    size="sm"
                    showLabel
                  />
                )}
                <Text style={styles.scoutValue} numberOfLines={1} ellipsizeMode="tail">
                  {getPrimaryValue(result)}
                </Text>
              </View>

              {/* Extra stats for Yo-Yo */}
              {testType === 'yoyo' && (
                <View style={styles.statsRow}>
                  {result.vo2max != null && (
                    <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                      VO2max: {result.vo2max}
                    </Text>
                  )}
                  {result.peak_speed != null && (
                    <>
                      <Text style={styles.statDivider}>{'\u2022'}</Text>
                      <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                        Peak: {result.peak_speed} km/h
                      </Text>
                    </>
                  )}
                </View>
              )}

              <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
                Tested: {formatDate(result.test_date)}
              </Text>
            </View>
          );
        })}

        {/* Trend */}
        {trendLabel && (
          <View style={styles.trendSection}>
            <Text style={styles.trendLabel} numberOfLines={1} ellipsizeMode="tail">
              {trendLabel}
            </Text>
          </View>
        )}
      </View>

      {/* View Full History Button */}
      {onViewHistory && (
        <View style={styles.buttonRow}>
          <Button
            title="View Full History"
            onPress={onViewHistory}
            variant="outline"
            size="small"
            icon={<TrendingUp size={16} color={theme.colors.primary} />}
          />
        </View>
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  historyLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },

  // Card
  card: {
    backgroundColor: theme.colors.cardBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  // Result header row
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },

  // Zone badge (large)
  zoneBadge: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs + 1,
    borderRadius: theme.borderRadius.sm,
  },
  zoneBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Zone badge (small, for compact rows)
  zoneBadgeSmall: {
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  zoneBadgeSmallText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Level / value text
  levelText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  // Test type label
  testTypeLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Progress bar
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.xs,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  statDivider: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.2)',
  },

  // Tagline
  taglineText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },

  // Date
  dateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Sub-section header inside cards
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: theme.spacing.sm,
  },
  subSectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Test result row (compact, for "other tests")
  testResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  testResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 70,
  },
  testResultLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  testResultValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    flex: 1,
    textAlign: 'right',
    marginRight: theme.spacing.sm,
  },

  // Goal card
  goalText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  goalDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  goalMotivation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontStyle: 'italic',
    fontWeight: theme.fontWeight.medium,
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tipBullet: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
  tipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Scout variant
  scoutTestBlock: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  scoutTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  scoutTestName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    flex: 1,
  },
  scoutValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  scoutVO2: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },

  // Trend section (scout)
  trendSection: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: theme.spacing.sm,
  },
  trendLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.xs,
  },

  // Empty variant
  emptyContent: {
    paddingVertical: theme.spacing.md,
  },
  emptyHeading: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyBody: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  buttonWrapper: {
    flex: 1,
  },
});

// ─── Backward-compatible alias ──────────────────────────────────────────────────
export const BeepTestCard = FitnessTestCard;
export default FitnessTestCard;
