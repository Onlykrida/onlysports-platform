import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  RotateCcw,
  Save,
  Trophy,
  Zap,
  MapPin,
  Gauge,
  Timer,
  ArrowUp,
  Camera,
  CheckCircle,
} from 'lucide-react-native';
import { Platform } from 'react-native';

const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/constants/theme';
import VerificationBadge from '@/components/VerificationBadge';
import { getTierMeta } from '@/constants/verification';
import { supabase } from '@/constants/supabase';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/auth-context';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import { FitnessTestResult, VerificationTier } from '@/types';
import {
  calculateVO2max,
  calculateDistance,
  getSpeedForLevel,
  getZone,
  getNextZoneTarget,
  getImprovementTips,
  getAgeGroup,
  getSprintZone,
  getAgilityZone,
  getVerticalJumpZone,
  SPRINT_TIPS,
  AGILITY_TIPS,
  JUMP_TIPS,
  ZoneDefinition,
  TestType,
  Gender,
  AgeGroup,
} from '@/constants/fitness-test-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachResult {
  name: string;
  id?: string;
  level: number;
  shuttle: number;
}

const TEST_LABELS: Record<TestType, string> = {
  yoyo: 'Yo-Yo Test',
  sprint_20m: '20m Sprint',
  sprint_40m: '40m Sprint',
  agility_ttest: 'Agility T-Test',
  vertical_jump: 'Vertical Jump',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeepTestResultsScreen() {
  const { user: currentUser } = useAuth();
  const {
    saveYoYoResult,
    saveSprintResult,
    saveAgilityResult,
    saveJumpResult,
    saveBatchYoYoResults,
  } = useFitnessTest();

  const params = useLocalSearchParams<{
    testType?: string;
    level?: string;
    shuttle?: string;
    mode?: string;
    results?: string;
    // Sprint params
    sprintTime?: string;
    sprintDistance?: string;
    // Agility params
    agilityTime?: string;
    // Jump params
    jumpHeight?: string;
    // Sensor params
    sensorData?: string;
    sensorTurns?: string;
  }>();

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleVideoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.7,
        videoMaxDuration: 60,
      });
      if (result.canceled) return;
      setIsUploadingVideo(true);
      const asset = result.assets[0];
      const fileName = `${currentUser?.id}/${Date.now()}.mp4`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('test-videos')
        .upload(fileName, blob, { contentType: 'video/mp4' });
      if (error) {
        Alert.alert('Upload Failed', error.message);
      } else {
        const { data: urlData } = supabase.storage.from('test-videos').getPublicUrl(fileName);
        setVideoUrl(urlData.publicUrl);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Parse common params
  const testType = (params.testType || 'yoyo') as TestType;
  const testMode = (params.mode || 'self') as 'self' | 'coached';

  // Parse sensor data from params
  const sensorDataParam = params.sensorData ? JSON.parse(params.sensorData as string) : null;
  const sensorTurns = params.sensorTurns ? parseInt(params.sensorTurns as string, 10) : 0;

  // Determine verification tier
  const verificationTier: VerificationTier = (() => {
    if (testMode === 'coached') return 'coach_verified';
    if (sensorDataParam?.movement_validation?.isLikelyRunning) return 'app_measured';
    if (testMode === 'self' && sensorDataParam) return 'app_measured';
    return 'self_reported' as VerificationTier;
  })();
  const testLabel = TEST_LABELS[testType] || 'Yo-Yo Test';

  // Gender & age group from auth context
  const gender: Gender = ((currentUser as any)?.gender ?? 'male') as Gender;
  const ageGroup: AgeGroup = getAgeGroup((currentUser as any)?.date_of_birth);

  // ─── Yo-Yo params ──────────────────────────────────────────────────────────
  const soloLevel = parseInt(params.level || '1', 10);
  const soloShuttle = parseInt(params.shuttle || '1', 10);

  // ─── Sprint params ─────────────────────────────────────────────────────────
  const sprintTime = parseFloat(params.sprintTime || '0');
  const sprintDistance = parseInt(params.sprintDistance || '20', 10) as 20 | 40;

  // ─── Agility params ────────────────────────────────────────────────────────
  const agilityTime = parseFloat(params.agilityTime || '0');

  // ─── Jump params ───────────────────────────────────────────────────────────
  const jumpHeight = parseFloat(params.jumpHeight || '0');

  // ─── Coach results (Yo-Yo only) ────────────────────────────────────────────
  const coachResults: CoachResult[] = useMemo(() => {
    if (testMode !== 'coached' || !params.results) return [];
    try {
      const parsed = JSON.parse(params.results) as CoachResult[];
      return parsed.sort((a, b) => {
        if (a.level !== b.level) return b.level - a.level;
        return b.shuttle - a.shuttle;
      });
    } catch {
      return [];
    }
  }, [testMode, params.results]);

  // ─── Computed values per test type ─────────────────────────────────────────

  const computedResults = useMemo(() => {
    if (testType === 'yoyo') {
      const distance = calculateDistance(soloLevel, soloShuttle);
      const vo2max = calculateVO2max(distance);
      const peakSpeed = getSpeedForLevel(soloLevel);
      const zone = getZone(distance, gender, ageGroup);
      const nextZoneTarget = getNextZoneTarget(distance, gender, ageGroup);
      const tips = getImprovementTips(zone.name);
      return { distance, vo2max, peakSpeed, zone, nextZoneTarget, tips };
    }

    if (testType === 'sprint_20m' || testType === 'sprint_40m') {
      const dist = testType === 'sprint_20m' ? 20 : 40;
      const zone = getSprintZone(sprintTime, dist as 20 | 40, gender, ageGroup);
      const speed = sprintTime > 0 ? Math.round((dist / sprintTime) * 3.6 * 10) / 10 : 0;
      const tips = SPRINT_TIPS[zone.name] ?? SPRINT_TIPS.starter;
      return { zone, tips, speed };
    }

    if (testType === 'agility_ttest') {
      const zone = getAgilityZone(agilityTime, gender, ageGroup);
      const tips = AGILITY_TIPS[zone.name] ?? AGILITY_TIPS.starter;
      return { zone, tips };
    }

    if (testType === 'vertical_jump') {
      const zone = getVerticalJumpZone(jumpHeight, gender, ageGroup);
      const tips = JUMP_TIPS[zone.name] ?? JUMP_TIPS.starter;
      return { zone, tips };
    }

    // Fallback
    const distance = calculateDistance(soloLevel, soloShuttle);
    const zone = getZone(distance, gender, ageGroup);
    return { zone, tips: getImprovementTips(zone.name) };
  }, [
    testType,
    soloLevel,
    soloShuttle,
    sprintTime,
    sprintDistance,
    agilityTime,
    jumpHeight,
    gender,
    ageGroup,
  ]);

  // ─── Save Result ──────────────────────────────────────────────────────────

  const handleSaveSolo = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to save results.');
      return;
    }

    setIsSaving(true);
    try {
      let result: { error?: string };

      if (testType === 'yoyo') {
        result = await saveYoYoResult({
          athlete_id: currentUser.id,
          test_mode: 'self',
          level: soloLevel,
          shuttle: soloShuttle,
          verification_tier: verificationTier,
          sensor_data: sensorDataParam,
          video_url: videoUrl ?? undefined,
        });
      } else if (testType === 'sprint_20m' || testType === 'sprint_40m') {
        result = await saveSprintResult({
          athlete_id: currentUser.id,
          test_mode: 'self',
          sprint_time: sprintTime,
          sprint_distance: sprintDistance,
          verification_tier: verificationTier,
          sensor_data: sensorDataParam,
          video_url: videoUrl ?? undefined,
        });
      } else if (testType === 'agility_ttest') {
        result = await saveAgilityResult({
          athlete_id: currentUser.id,
          test_mode: 'self',
          agility_time: agilityTime,
          verification_tier: verificationTier,
          sensor_data: sensorDataParam,
          video_url: videoUrl ?? undefined,
        });
      } else if (testType === 'vertical_jump') {
        result = await saveJumpResult({
          athlete_id: currentUser.id,
          test_mode: 'self',
          jump_height: jumpHeight,
          verification_tier: verificationTier,
          sensor_data: sensorDataParam,
          video_url: videoUrl ?? undefined,
        });
      } else {
        result = { error: 'Unknown test type' };
      }

      if (!result.error) {
        setHasSaved(true);
        Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', `Your ${testLabel} result has been saved!`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile' as any) },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to save result. Please try again.');
      }
    } catch (e) {
      console.warn('FitnessTestResults: save exception', e);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCoach = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to save results.');
      return;
    }

    setIsSaving(true);
    try {
      const batchData = coachResults.map((r) => ({
        athlete_id: r.id || `unregistered_${r.name}`,
        conducted_by: currentUser.id,
        test_mode: 'coached' as const,
        level: r.level,
        shuttle: r.shuttle,
      }));

      const result = await saveBatchYoYoResults(batchData);

      if (!result.error) {
        setHasSaved(true);
        Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', `${coachResults.length} results saved successfully!`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile' as any) },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to save results.');
      }
    } catch (e) {
      console.warn('FitnessTestResults: coach save exception', e);
      Alert.alert('Error', 'An error occurred while saving results.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    router.replace('/beep-test-live' as any);
  };

  // ─── Render Helpers ─────────────────────────────────────────────────────────

  const renderYoYoStats = () => {
    const { distance, vo2max, peakSpeed } = computedResults as any;
    const totalShuttles = Math.round((distance ?? 0) / 40);
    return (
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Zap size={16} color={theme.colors.cyan} />}
          label="VO2max"
          value={`${vo2max}`}
          unit="ml/kg/min"
          color={theme.colors.cyan}
        />
        <StatCard
          icon={<MapPin size={16} color={theme.colors.orange} />}
          label="Distance"
          value={distance >= 1000 ? `${(distance / 1000).toFixed(1)}k` : `${distance}`}
          unit="metres"
          color={theme.colors.orange}
        />
        <StatCard
          icon={<Trophy size={16} color={theme.colors.primary} />}
          label="Shuttles"
          value={`${totalShuttles}`}
          unit="total"
          color={theme.colors.primary}
        />
        <StatCard
          icon={<Gauge size={16} color={theme.colors.red} />}
          label="Peak Speed"
          value={`${peakSpeed}`}
          unit="km/h"
          color={theme.colors.red}
        />
      </View>
    );
  };

  const renderSprintStats = () => {
    const { speed } = computedResults as any;
    const dist = testType === 'sprint_20m' ? 20 : 40;
    return (
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Timer size={16} color={theme.colors.cyan} />}
          label="Time"
          value={`${sprintTime.toFixed(2)}`}
          unit="seconds"
          color={theme.colors.cyan}
        />
        <StatCard
          icon={<Gauge size={16} color={theme.colors.orange} />}
          label="Speed"
          value={`${speed}`}
          unit="km/h"
          color={theme.colors.orange}
        />
        <StatCard
          icon={<MapPin size={16} color={theme.colors.primary} />}
          label="Distance"
          value={`${dist}`}
          unit="metres"
          color={theme.colors.primary}
        />
      </View>
    );
  };

  const renderAgilityStats = () => {
    return (
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Timer size={16} color={theme.colors.cyan} />}
          label="Time"
          value={`${agilityTime.toFixed(2)}`}
          unit="seconds"
          color={theme.colors.cyan}
        />
      </View>
    );
  };

  const renderJumpStats = () => {
    return (
      <View style={styles.statsGrid}>
        <StatCard
          icon={<ArrowUp size={16} color={theme.colors.cyan} />}
          label="Height"
          value={`${jumpHeight}`}
          unit="cm"
          color={theme.colors.cyan}
        />
      </View>
    );
  };

  const renderStatsForTestType = () => {
    switch (testType) {
      case 'yoyo':
        return renderYoYoStats();
      case 'sprint_20m':
      case 'sprint_40m':
        return renderSprintStats();
      case 'agility_ttest':
        return renderAgilityStats();
      case 'vertical_jump':
        return renderJumpStats();
      default:
        return renderYoYoStats();
    }
  };

  const renderMainValue = () => {
    switch (testType) {
      case 'yoyo':
        return (
          <Text style={styles.resultLevel}>
            Level {soloLevel}.{soloShuttle}
          </Text>
        );
      case 'sprint_20m':
      case 'sprint_40m':
        return <Text style={styles.resultLevel}>{sprintTime.toFixed(2)}s</Text>;
      case 'agility_ttest':
        return <Text style={styles.resultLevel}>{agilityTime.toFixed(2)}s</Text>;
      case 'vertical_jump':
        return <Text style={styles.resultLevel}>{jumpHeight}cm</Text>;
      default:
        return (
          <Text style={styles.resultLevel}>
            Level {soloLevel}.{soloShuttle}
          </Text>
        );
    }
  };

  // ─── Render: Solo Results ─────────────────────────────────────────────────

  if (testMode === 'self') {
    const { zone, tips, nextZoneTarget } = computedResults as any;

    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <Stack.Screen
            options={{
              title: `${testLabel.toUpperCase()} RESULTS`,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: theme.colors.text,
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                  <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
              ),
            }}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Result Card */}
            <View style={[styles.resultCard, { borderColor: zone.color + '40' }]}>
              {/* Zone Badge */}
              <View style={[styles.zoneBadge, { backgroundColor: zone.color + '20' }]}>
                <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                <Text style={[styles.zoneLabel, { color: zone.color }]}>
                  {zone.label.toUpperCase()}
                </Text>
              </View>

              {/* Main Value */}
              {renderMainValue()}

              {/* Stats Grid */}
              {renderStatsForTestType()}

              {/* Zone Tagline */}
              <Text style={[styles.zoneTagline, { color: zone.color }]}>"{zone.tagline}"</Text>
            </View>

            {/* Next Goal (Yo-Yo only) */}
            {testType === 'yoyo' && nextZoneTarget && (
              <View style={styles.goalSection}>
                <Text style={styles.goalSectionTitle}>YOUR NEXT GOAL</Text>
                <View style={styles.goalCard}>
                  <Text style={styles.goalText}>
                    <Text
                      style={{
                        color: nextZoneTarget.zone.color,
                        fontWeight: theme.fontWeight.black,
                      }}
                    >
                      {nextZoneTarget.zone.label.toUpperCase()}
                    </Text>{' '}
                    zone — {nextZoneTarget.distanceNeeded}m away
                  </Text>
                  <Text style={styles.goalSubtext}>
                    {nextZoneTarget.shuttlesNeeded} more shuttle
                    {nextZoneTarget.shuttlesNeeded !== 1 ? 's' : ''} (~
                    {nextZoneTarget.distanceNeeded}m) to go
                  </Text>
                </View>
              </View>
            )}

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsSectionTitle}>HOW TO IMPROVE</Text>
              {(tips ?? []).map((tip: string, i: number) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipBullet, { backgroundColor: zone.color }]} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Verification Tier Badge */}
            <View style={{ alignItems: 'center', paddingVertical: 12, gap: 8 }}>
              <VerificationBadge tier={verificationTier} size="lg" showLabel />
              <Text
                style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' }}
              >
                {getTierMeta(verificationTier).description}
              </Text>
            </View>

            {/* Video Proof Upload */}
            {!videoUrl ? (
              <TouchableOpacity
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 20,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  gap: 6,
                  marginVertical: 12,
                }}
                onPress={handleVideoUpload}
                disabled={isUploadingVideo}
              >
                <Camera size={20} color={theme.colors.primary} />
                <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
                  {isUploadingVideo ? 'Uploading...' : 'Add Video Proof'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                  Upgrades your verification badge
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  backgroundColor: 'rgba(48,209,88,0.1)',
                  borderRadius: 10,
                  marginVertical: 12,
                }}
              >
                <CheckCircle size={16} color={theme.colors.success} />
                <Text style={{ fontSize: 13, color: theme.colors.success, fontWeight: '600' }}>
                  Video proof attached
                </Text>
              </View>
            )}

            {/* Coach Verify CTA */}
            {verificationTier !== 'coach_verified' && verificationTier !== 'center_tested' && (
              <View
                style={{
                  padding: 14,
                  backgroundColor: 'rgba(100,210,255,0.08)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(100,210,255,0.2)',
                  marginVertical: 12,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 14, color: '#64D2FF', fontWeight: '700' }}>
                  Want higher trust?
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  Coach-Verified athletes get 5x more scout attention
                </Text>
                <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                  After saving, invite your coach to verify this result
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title={hasSaved ? 'Saved' : 'Save Result'}
                onPress={handleSaveSolo}
                variant="success"
                size="large"
                loading={isSaving}
                disabled={hasSaved}
                icon={<Save size={18} color={theme.colors.background} />}
              />
              <Button
                title="Retake Test"
                onPress={handleRetake}
                variant="ghost"
                size="medium"
                icon={<RotateCcw size={16} color={theme.colors.text} />}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  // ─── Render: Coach Results (Yo-Yo only) ─────────────────────────────────────

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: `${testLabel.toUpperCase()} RESULTS`,
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: theme.colors.text,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.coachHeaderText}>
            {coachResults.length} Athlete{coachResults.length !== 1 ? 's' : ''} Tested
          </Text>

          {/* Results List */}
          {coachResults.map((result, index) => {
            const distance = calculateDistance(result.level, result.shuttle);
            const zone = getZone(distance, gender, ageGroup);
            const vo2 = calculateVO2max(distance);

            return (
              <View key={`${result.name}_${index}`} style={styles.coachResultRow}>
                {/* Rank */}
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                {/* Info */}
                <View style={styles.coachResultInfo}>
                  <Text style={styles.coachResultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                  <Text style={styles.coachResultMeta}>
                    L{result.level}.{result.shuttle}
                  </Text>
                </View>

                {/* Zone Badge */}
                <View style={[styles.coachZoneBadge, { backgroundColor: zone.color + '20' }]}>
                  <Text style={[styles.coachZoneText, { color: zone.color }]}>
                    {zone.label.toUpperCase()}
                  </Text>
                </View>

                {/* VO2 */}
                <Text style={styles.coachVO2}>{vo2.toFixed(1)}</Text>
              </View>
            );
          })}

          {coachResults.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results to display</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={hasSaved ? 'Saved' : 'Save All Results'}
              onPress={handleSaveCoach}
              variant="success"
              size="large"
              loading={isSaving}
              disabled={hasSaved || coachResults.length === 0}
              icon={<Save size={18} color={theme.colors.background} />}
            />
            <Button
              title="New Test"
              onPress={handleRetake}
              variant="ghost"
              size="medium"
              icon={<RotateCcw size={16} color={theme.colors.text} />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

// ─── Stat Card Sub-component ──────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={statStyles.card}>
      <View style={statStyles.header}>
        {icon}
        <Text style={statStyles.label}>{label}</Text>
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.unit}>{unit}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: '45%' as any,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs + 2,
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
  },
  unit: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + 20,
    gap: theme.spacing.lg,
  },

  // ── Solo Result Card ────────────────────────────────────────────────────
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 2,
  },
  resultLevel: {
    fontSize: 48,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    lineHeight: 56,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    width: '100%',
  },
  zoneTagline: {
    fontSize: theme.fontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // ── Next Goal ───────────────────────────────────────────────────────────
  goalSection: {
    gap: theme.spacing.sm,
  },
  goalSectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textMuted,
    letterSpacing: 2,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  goalText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  goalSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // ── Tips ────────────────────────────────────────────────────────────────
  tipsSection: {
    gap: theme.spacing.md,
  },
  tipsSectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textMuted,
    letterSpacing: 2,
  },
  tipRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },

  // ── Actions ─────────────────────────────────────────────────────────────
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },

  // ── Coach Results ───────────────────────────────────────────────────────
  coachHeaderText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coachResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  coachResultInfo: {
    flex: 1,
  },
  coachResultName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  coachResultMeta: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  coachZoneBadge: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.sm,
  },
  coachZoneText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1,
  },
  coachVO2: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
});
