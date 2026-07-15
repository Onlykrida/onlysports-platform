import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { X, Check, Target, TrendingUp } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import VerificationBadge from '@/components/VerificationBadge';
import RequestVerificationModal from '@/components/RequestVerificationModal';
import {
  getMaxShuttlesForLevel,
  getSpeedForLevel,
  calculateVO2max,
  calculateDistance,
  getZone,
  getNextZoneTarget,
  getImprovementTips,
  getSprintZone,
  getAgilityZone,
  getVerticalJumpZone,
  getAgeGroup,
  getAdjacentLevel,
  VALID_YOYO_LEVELS,
  SPRINT_TIPS,
  AGILITY_TIPS,
  JUMP_TIPS,
  type TestType,
  type Gender,
  type AgeGroup,
  type ZoneDefinition,
} from '@/constants/fitness-test-data';

// ── Test type metadata ─────────────────────────────────
// v1.5 wedge tests are NOT manual-entry — they require sensor/camera capture.
// Manual fallback exists for v1.0 tests only. v1.5 entries default to title=label
// to keep TS happy if a stray v1.5 test_type ever lands in this screen, but the
// manual-entry UI is gated on the v1.0 set elsewhere (see line 55-61 below).
const TEST_META: Record<TestType, { title: string; shortTitle: string }> = {
  yoyo: { title: 'Yo-Yo Intermittent Recovery Test', shortTitle: 'Yo-Yo Test' },
  sprint_20m: { title: '20m Sprint Test', shortTitle: '20m Sprint' },
  sprint_40m: { title: '40m Sprint Test', shortTitle: '40m Sprint' },
  agility_ttest: { title: 'Agility T-Test', shortTitle: 'T-Test' },
  vertical_jump: { title: 'Vertical Jump Test', shortTitle: 'Vertical Jump' },
  // v1.5 tests are sensor/camera captured, not manual — these stubs exist only
  // so Record<TestType,...> stays type-complete. Manual screen never renders them.
  sprint_10m: { title: '10m Sprint Test', shortTitle: '10m Sprint' },
  sprint_30m: { title: '30m Sprint Test', shortTitle: '30m Sprint' },
  gps_time_trial: { title: 'GPS Time Trial', shortTitle: 'GPS' },
  juggling_count: { title: 'Juggling Counter', shortTitle: 'Juggle' },
  wall_volley_count: { title: 'Wall Volley Counter', shortTitle: 'Volley' },
  dribble_cones_count: { title: 'Dribble Cones Counter', shortTitle: 'Dribble' },
  spot_shooting_pct: { title: 'Spot Shooting %', shortTitle: 'Shooting' },
  drag_flick_accuracy: { title: 'Drag Flick Accuracy', shortTitle: 'Flick' },
  crossing_accuracy: { title: 'Crossing Accuracy', shortTitle: 'Cross' },
  bowling_accuracy: { title: 'Bowling Line + Length', shortTitle: 'Bowl' },
};

export default function FitnessTestManualScreen() {
  const params = useLocalSearchParams<{ testType?: string; verify?: string }>();
  const testType: TestType = [
    'yoyo',
    'sprint_10m',
    'sprint_20m',
    'sprint_30m',
    'sprint_40m',
    'agility_ttest',
    'vertical_jump',
  ].includes(params.testType ?? '')
    ? (params.testType as TestType)
    : 'yoyo';

  // Helper: which sprint distance does this test type represent?
  const sprintDistance = (() => {
    if (testType === 'sprint_10m') return 10 as const;
    if (testType === 'sprint_20m') return 20 as const;
    if (testType === 'sprint_30m') return 30 as const;
    if (testType === 'sprint_40m') return 40 as const;
    return null;
  })();

  const { user: currentUser } = useAuth();
  const { saveYoYoResult, saveSprintResult, saveAgilityResult, saveJumpResult } = useFitnessTest();

  // Derive gender & age group from user profile
  const gender: Gender = (currentUser as any)?.gender === 'female' ? 'female' : 'male';
  const ageGroup: AgeGroup = getAgeGroup((currentUser as any)?.date_of_birth);

  const meta = TEST_META[testType];

  // ── Yo-Yo state ──────────────────────────────────────
  const [level, setLevel] = useState(5);
  const [shuttle, setShuttle] = useState(1);

  // ── Sprint / Agility state (time in seconds) ────────
  const [timeInput, setTimeInput] = useState('');

  // ── Vertical Jump state (cm) ─────────────────────────
  const [heightInput, setHeightInput] = useState('');

  // ── Shared state ─────────────────────────────────────
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Verification request modal state ────────────────
  // After a successful save, athletes get an opt-in path to ask a coach to
  // verify the result. Approval lifts tier self_reported (0.7×) →
  // coach_verified (1.0×). Modal is the existing component used by
  // beep-test-results.tsx after sensor-driven Yo-Yo; here we surface it for
  // every manual entry path (Yo-Yo + Speed/Power).
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [lastSavedResultId, setLastSavedResultId] = useState<string | null>(null);

  // ── Save outcome state ───────────────────────────────
  // Feedback must be inline UI, not Alert.alert: RN-web silently drops
  // Alert callbacks, which made saves invisible and allowed duplicate
  // submissions (the form stayed live after each successful save).
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verificationSentTo, setVerificationSentTo] = useState<string | null>(null);
  // Snapshot at save time: inputs stay editable behind the success panel,
  // so live currentZone could drift from what was actually saved.
  const [savedZoneLabel, setSavedZoneLabel] = useState<string | null>(null);

  // ── Yo-Yo derived ───────────────────────────────────
  const maxShuttles = useMemo(() => getMaxShuttlesForLevel(level), [level]);
  const safeShuttle = useMemo(() => Math.min(shuttle, maxShuttles), [shuttle, maxShuttles]);

  const yoyoResults = useMemo(() => {
    if (testType !== 'yoyo') return null;
    const distance = calculateDistance(level, safeShuttle);
    const vo2max = calculateVO2max(distance);
    const peakSpeed = getSpeedForLevel(level);
    const zone = getZone(distance, gender, ageGroup);
    const nextTarget = getNextZoneTarget(distance, gender, ageGroup);
    const tips = getImprovementTips(zone.name);
    return { distance, vo2max, peakSpeed, zone, nextTarget, tips };
  }, [testType, level, safeShuttle, gender, ageGroup]);

  // ── Sprint derived ──────────────────────────────────
  const sprintResults = useMemo(() => {
    if (sprintDistance === null) return null;
    const time = parseFloat(timeInput);
    if (isNaN(time) || time <= 0) return null;
    const zone = getSprintZone(time, sprintDistance, gender, ageGroup);
    const speed = Math.round((sprintDistance / time) * 3.6 * 100) / 100; // m/s -> km/h
    const tips = SPRINT_TIPS[zone.name];
    return { time, zone, speed, tips };
  }, [sprintDistance, timeInput, gender, ageGroup]);

  // ── Agility derived ─────────────────────────────────
  const agilityResults = useMemo(() => {
    if (testType !== 'agility_ttest') return null;
    const time = parseFloat(timeInput);
    if (isNaN(time) || time <= 0) return null;
    const zone = getAgilityZone(time, gender, ageGroup);
    const tips = AGILITY_TIPS[zone.name];
    return { time, zone, tips };
  }, [testType, timeInput, gender, ageGroup]);

  // ── Vertical Jump derived ───────────────────────────
  const jumpResults = useMemo(() => {
    if (testType !== 'vertical_jump') return null;
    const height = parseInt(heightInput, 10);
    if (isNaN(height) || height <= 0) return null;
    const zone = getVerticalJumpZone(height, gender, ageGroup);
    const tips = JUMP_TIPS[zone.name];
    return { height, zone, tips };
  }, [testType, heightInput, gender, ageGroup]);

  // ── Unified zone/tips accessor ──────────────────────
  const currentZone: ZoneDefinition | null = useMemo(() => {
    if (yoyoResults) return yoyoResults.zone;
    if (sprintResults) return sprintResults.zone;
    if (agilityResults) return agilityResults.zone;
    if (jumpResults) return jumpResults.zone;
    return null;
  }, [yoyoResults, sprintResults, agilityResults, jumpResults]);

  const currentTips: string[] = useMemo(() => {
    if (yoyoResults) return yoyoResults.tips;
    if (sprintResults) return sprintResults.tips;
    if (agilityResults) return agilityResults.tips;
    if (jumpResults) return jumpResults.tips;
    return [];
  }, [yoyoResults, sprintResults, agilityResults, jumpResults]);

  const hasValidInput = testType === 'yoyo' || !!sprintResults || !!agilityResults || !!jumpResults;

  // ── Handlers ────────────────────────────────────────
  const handleLevelStep = (direction: 1 | -1) => {
    const newLevel = getAdjacentLevel(level, direction);
    setLevel(newLevel);
    const newMax = getMaxShuttlesForLevel(newLevel);
    if (shuttle > newMax) setShuttle(newMax);
  };

  const handleLevelJump = (steps: number) => {
    // Jump multiple valid levels at once (e.g. -5 or +5 valid levels)
    const idx = VALID_YOYO_LEVELS.indexOf(level);
    const startIdx = idx >= 0 ? idx : 0;
    const newIdx = Math.max(0, Math.min(VALID_YOYO_LEVELS.length - 1, startIdx + steps));
    const newLevel = VALID_YOYO_LEVELS[newIdx];
    setLevel(newLevel);
    const newMax = getMaxShuttlesForLevel(newLevel);
    if (shuttle > newMax) setShuttle(newMax);
  };

  const handleShuttleChange = (newShuttle: number) => {
    setShuttle(Math.max(1, Math.min(maxShuttles, newShuttle)));
  };

  const handleSave = async () => {
    if (!currentUser) {
      setSaveError('You must be logged in to save results.');
      return;
    }
    if (!hasValidInput) {
      setSaveError('Please enter a valid value before saving.');
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      let result: { error?: string; id?: string } = {};

      if (testType === 'yoyo') {
        result = await saveYoYoResult({
          athlete_id: currentUser.id,
          test_mode: 'manual',
          level,
          shuttle: safeShuttle,
          gender,
          dateOfBirth: (currentUser as any)?.date_of_birth,
          notes: notes.trim() || undefined,
          verification_tier: 'self_reported' as const,
        });
      } else if (sprintDistance !== null) {
        const time = parseFloat(timeInput);
        result = await saveSprintResult({
          athlete_id: currentUser.id,
          test_mode: 'manual',
          sprint_time: time,
          sprint_distance: sprintDistance,
          gender,
          dateOfBirth: (currentUser as any)?.date_of_birth,
          notes: notes.trim() || undefined,
          verification_tier: 'self_reported' as const,
        });
      } else if (testType === 'agility_ttest') {
        const time = parseFloat(timeInput);
        result = await saveAgilityResult({
          athlete_id: currentUser.id,
          test_mode: 'manual',
          agility_time: time,
          gender,
          dateOfBirth: (currentUser as any)?.date_of_birth,
          notes: notes.trim() || undefined,
          verification_tier: 'self_reported' as const,
        });
      } else if (testType === 'vertical_jump') {
        const height = parseInt(heightInput, 10);
        result = await saveJumpResult({
          athlete_id: currentUser.id,
          test_mode: 'manual',
          jump_height: height,
          gender,
          dateOfBirth: (currentUser as any)?.date_of_birth,
          notes: notes.trim() || undefined,
          verification_tier: 'self_reported' as const,
        });
      }

      if (result.error) {
        setSaveError(result.error);
        return;
      }

      // Swap the save button for an inline success panel. The panel owns the
      // next steps (Ask a coach / Done), so the form can't be re-submitted.
      // result.id may be absent (mock client / unconfigured env) — the panel
      // then simply omits the coach-verification action.
      if (result.id) setLastSavedResultId(result.id);
      setSavedZoneLabel(currentZone?.label ?? null);
      setSaveState('saved');
      // Capture-method picker's "Enter + video proof" path (?verify=1):
      // the athlete already chose coach verification — open the request
      // modal immediately instead of waiting for the panel tap.
      if (result.id && params.verify === '1') {
        setVerificationModalVisible(true);
      }
    } catch (e) {
      if (__DEV__) console.log('FitnessTestManual: save exception', e);
      setSaveError('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Not logged in ───────────────────────────────────
  if (!currentUser) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={styles.emptyText}>Please log in to enter a fitness test result.</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  // ── Render ──────────────────────────────────────────
  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack.Screen
          options={{
            title: `Enter ${meta.shortTitle} Result`,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
            // Hidden once saved — the success panel owns post-save actions;
            // leaving this live re-ran handleSave and inserted duplicates.
            headerRight: () =>
              saveState === 'saved' ? null : (
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.headerButton}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Save result"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Check size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ),
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ═══ INPUT SECTION ═══ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                {testType === 'yoyo' ? 'SCORE' : 'INPUT'}
              </Text>
            </View>

            {/* ── Yo-Yo: Level + Shuttle pickers ── */}
            {testType === 'yoyo' && (
              <>
                <View style={styles.pickerRow}>
                  <Text style={styles.pickerLabel} numberOfLines={1}>
                    Level
                  </Text>
                  <View style={styles.pickerControls}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleLevelJump(-5)}>
                      <Text style={styles.pickerBtnText}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleLevelStep(-1)}>
                      <Text style={styles.pickerBtnText}>-1</Text>
                    </TouchableOpacity>
                    <View style={styles.pickerValueBadge}>
                      <Text style={styles.pickerValueText}>{level}</Text>
                    </View>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleLevelStep(1)}>
                      <Text style={styles.pickerBtnText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleLevelJump(5)}>
                      <Text style={styles.pickerBtnText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.pickerRow}>
                  <Text style={styles.pickerLabel} numberOfLines={1}>
                    Shuttle
                  </Text>
                  <View style={styles.pickerControls}>
                    <TouchableOpacity
                      style={styles.pickerBtn}
                      onPress={() => handleShuttleChange(safeShuttle - 1)}
                    >
                      <Text style={styles.pickerBtnText}>-1</Text>
                    </TouchableOpacity>
                    <View style={styles.pickerValueBadge}>
                      <Text style={styles.pickerValueText}>{safeShuttle}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.pickerBtn}
                      onPress={() => handleShuttleChange(safeShuttle + 1)}
                    >
                      <Text style={styles.pickerBtnText}>+1</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.pickerHint} numberOfLines={1} ellipsizeMode="tail">
                  Max {maxShuttles} shuttles at Level {level}
                </Text>
              </>
            )}

            {/* ── Sprint / Agility: Time input ── */}
            {(sprintDistance !== null || testType === 'agility_ttest') && (
              <View style={styles.timeInputContainer}>
                <Text style={styles.pickerLabel} numberOfLines={1}>
                  Time (seconds)
                </Text>
                <TextInput
                  style={styles.timeInput}
                  value={timeInput}
                  onChangeText={(text) => {
                    // Allow digits and one decimal point, max 2 decimal places
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    setTimeInput(cleaned);
                  }}
                  placeholder={
                    testType === 'agility_ttest'
                      ? 'e.g. 10.25'
                      : sprintDistance === 10
                        ? 'e.g. 1.85'
                        : sprintDistance === 20
                          ? 'e.g. 3.45'
                          : sprintDistance === 30
                            ? 'e.g. 4.65'
                            : 'e.g. 5.50'
                  }
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <Text style={styles.pickerHint} numberOfLines={1} ellipsizeMode="tail">
                  {sprintDistance !== null
                    ? `Enter your ${sprintDistance}m sprint time to 2 decimal places`
                    : 'Enter your T-Test completion time to 2 decimal places'}
                </Text>
              </View>
            )}

            {/* ── Vertical Jump: Height input ── */}
            {testType === 'vertical_jump' && (
              <View style={styles.timeInputContainer}>
                <Text style={styles.pickerLabel} numberOfLines={1}>
                  Jump Height (cm)
                </Text>
                <TextInput
                  style={styles.timeInput}
                  value={heightInput}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setHeightInput(cleaned);
                  }}
                  placeholder="e.g. 55"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
                <Text style={styles.pickerHint} numberOfLines={1} ellipsizeMode="tail">
                  Enter your vertical jump height in centimeters
                </Text>
              </View>
            )}
          </View>

          {/* ═══ RESULTS SECTION ═══ */}
          {currentZone && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  YOUR RESULTS
                </Text>
              </View>

              <View style={styles.resultsCard}>
                {/* Zone Badge */}
                <View style={[styles.zoneBadge, { backgroundColor: currentZone.color }]}>
                  <Text style={styles.zoneBadgeText} numberOfLines={1} ellipsizeMode="tail">
                    {currentZone.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.zoneTagline} numberOfLines={1} ellipsizeMode="tail">
                  {'\u201C'}
                  {currentZone.tagline}
                  {'\u201D'}
                </Text>

                <View style={styles.resultsDivider} />

                {/* ── Yo-Yo metrics ── */}
                {yoyoResults && (
                  <View style={styles.resultsGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {yoyoResults.vo2max}
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1} ellipsizeMode="tail">
                        VO2max (ml/kg/min)
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {yoyoResults.distance.toLocaleString()}m
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1}>
                        Distance
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {yoyoResults.peakSpeed} km/h
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1}>
                        Peak Speed
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── Sprint metrics ── */}
                {sprintResults && (
                  <View style={styles.resultsGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {sprintResults.time.toFixed(2)}s
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1} ellipsizeMode="tail">
                        Time
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {sprintResults.speed} km/h
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1}>
                        Avg Speed
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── Agility metrics ── */}
                {agilityResults && (
                  <View style={styles.resultsGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {agilityResults.time.toFixed(2)}s
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1} ellipsizeMode="tail">
                        Completion Time
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── Vertical Jump metrics ── */}
                {jumpResults && (
                  <View style={styles.resultsGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue} numberOfLines={1}>
                        {jumpResults.height} cm
                      </Text>
                      <Text style={styles.resultLabel} numberOfLines={1} ellipsizeMode="tail">
                        Jump Height
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ═══ NEXT GOAL (Yo-Yo only) ═══ */}
          {yoyoResults?.nextTarget && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Target size={16} color={theme.colors.text} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  YOUR NEXT GOAL
                </Text>
              </View>

              <View style={styles.goalCard}>
                <Text style={styles.goalText} numberOfLines={2} ellipsizeMode="tail">
                  <Text
                    style={{
                      fontWeight: theme.fontWeight.black,
                      color: yoyoResults.nextTarget.zone.color,
                    }}
                  >
                    {yoyoResults.nextTarget.zone.label.toUpperCase()}
                  </Text>{' '}
                  zone — {yoyoResults.nextTarget.distanceNeeded}m away
                </Text>
                <Text style={styles.goalSubtext} numberOfLines={2} ellipsizeMode="tail">
                  {yoyoResults.nextTarget.shuttlesNeeded} more shuttle
                  {yoyoResults.nextTarget.shuttlesNeeded !== 1 ? 's' : ''} (~
                  {yoyoResults.nextTarget.distanceNeeded}m) to go
                </Text>
                <Text style={styles.goalMotivation} numberOfLines={1} ellipsizeMode="tail">
                  {'\u201C'}You&apos;re closer than you think{'\u201D'}
                </Text>
              </View>
            </View>
          )}

          {/* ═══ HOW TO IMPROVE ═══ */}
          {currentTips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <TrendingUp size={16} color={theme.colors.text} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  HOW TO IMPROVE
                </Text>
              </View>

              <View style={styles.tipsCard}>
                {currentTips.map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText} numberOfLines={3} ellipsizeMode="tail">
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ═══ NOTES ═══ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                NOTES
              </Text>
            </View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes about this test…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ═══ VERIFICATION TIER INDICATOR ═══ */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: 'rgba(142,142,147,0.1)',
              borderRadius: 8,
              marginBottom: 12,
              marginHorizontal: theme.spacing.md,
            }}
          >
            <VerificationBadge tier="self_reported" size="sm" showLabel />
            <Text
              style={{ flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}
            >
              Manual entries are Self-Reported. Take the guided test for higher trust.
            </Text>
          </View>

          {/* ═══ SAVE BUTTON / SUCCESS PANEL ═══ */}
          {saveState === 'saved' ? (
            <View style={styles.successCard}>
              <View style={styles.successHeader}>
                <Check size={22} color={theme.colors.primary} />
                <Text style={styles.successTitle}>
                  Saved! {meta.shortTitle} — {savedZoneLabel ?? ''} zone
                </Text>
              </View>
              {verificationSentTo ? (
                <Text style={styles.successSub}>
                  Verification request sent to {verificationSentTo}. They&apos;ll get a
                  notification.
                </Text>
              ) : lastSavedResultId ? (
                <Text style={styles.successSub}>
                  Want a coach to verify it? You can attach a video and pick a coach to review.
                </Text>
              ) : null}
              <View style={styles.successActions}>
                {lastSavedResultId && !verificationSentTo && (
                  <TouchableOpacity
                    style={styles.successPrimaryBtn}
                    onPress={() => setVerificationModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Ask a coach to verify this result"
                  >
                    <Text style={styles.successPrimaryText}>ASK A COACH</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.successSecondaryBtn}
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel="Done, go back"
                >
                  <Text style={styles.successSecondaryText}>DONE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.saveSection}>
              {saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (isSaving || !hasValidInput) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaving || !hasValidInput}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Save result"
                accessibilityState={{ disabled: isSaving || !hasValidInput }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={theme.colors.black} />
                ) : (
                  <Text style={styles.saveButtonText}>SAVE RESULT</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Coach-verification request modal — opened after a successful save
            when the athlete taps "Ask a coach". Video upload is enabled so
            athletes can attach a clip for the coach to review remotely. */}
        {lastSavedResultId && (
          <RequestVerificationModal
            visible={verificationModalVisible}
            testResultId={lastSavedResultId}
            testTypeLabel={meta.shortTitle}
            enableVideoUpload
            onClose={() => {
              setVerificationModalVisible(false);
              router.back();
            }}
            onSubmitted={(coachName) => {
              setVerificationModalVisible(false);
              setVerificationSentTo(coachName);
            }}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
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
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },

  // Sections
  section: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Picker (Yo-Yo)
  pickerRow: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  pickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  pickerBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  pickerValueBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    minWidth: 70,
    alignItems: 'center',
  },
  pickerValueText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  pickerHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // Time / Height Input
  timeInputContainer: {
    gap: theme.spacing.sm,
  },
  timeInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    textAlign: 'center',
  },

  // Results Card
  resultsCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  zoneBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  zoneBadgeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    letterSpacing: 1.5,
  },
  zoneTagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  resultsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    width: '100%',
  },
  resultItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  resultValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  resultLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Goal Card
  goalCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.sm,
  },
  goalText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  goalSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  goalMotivation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  tipText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },

  // Notes
  notesInput: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
  },

  // Save
  saveSection: {
    padding: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.ctaGlow,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  saveErrorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },

  // Post-save success panel (replaces the save button)
  successCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  successTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  successSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  successActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  successPrimaryBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  successPrimaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    letterSpacing: 1,
  },
  successSecondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  successSecondaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    letterSpacing: 1,
  },
});
