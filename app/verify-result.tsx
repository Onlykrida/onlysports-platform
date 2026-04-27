import React, { useCallback, useEffect, useState } from 'react';
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
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, Video, MapPin, Camera } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import VerificationBadge from '@/components/VerificationBadge';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import CachedImage from '@/components/CachedImage';
import VideoPlayer from '@/components/VideoPlayer';

// Two verification modes — each is a different trust signal:
//   remote_video → verifier watched the athlete's uploaded video
//   in_person   → verifier was physically present at the test
// In-person is the higher trust tier (full visibility, no video editing risk).
// We store the mode on fitness_test_results so the athlete's profile and the
// verifier's track record can both display HOW it was verified, not just WHO.

interface FullTestResult {
  id: string;
  test_type: string;
  test_mode: string;
  zone: string | null;
  level: number | null;
  shuttle: number | null;
  sprint_time: number | null;
  agility_time: number | null;
  jump_height: number | null;
  vo2max: number | null;
  total_distance: number | null;
  video_url: string | null;
  sensor_data: any;
  test_date: string;
}

export default function VerifyResultScreen() {
  const { requestId, testResultId, athleteName, athleteAvatar } = useLocalSearchParams<{
    requestId: string;
    testResultId: string;
    athleteName: string;
    athleteAvatar?: string;
  }>();

  const { approveVerification } = useFitnessTest();
  const [fullResult, setFullResult] = useState<FullTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickedMode, setPickedMode] = useState<'remote_video' | 'in_person' | null>(null);

  // Fetch the full row — old version only had whatever was passed in params.
  // Need video_url + every metric so the verifier sees the actual evidence.
  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !testResultId) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('fitness_test_results')
          .select(
            'id, test_type, test_mode, zone, level, shuttle, sprint_time, agility_time, jump_height, vo2max, total_distance, video_url, sensor_data, test_date',
          )
          .eq('id', testResultId)
          .maybeSingle();
        if (error) {
          if (__DEV__) console.warn('VerifyResult: fetch error', error);
          setFullResult(null);
        } else {
          setFullResult(data as any);
        }
      } catch (e) {
        if (__DEV__) console.warn('VerifyResult: load exception', e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [testResultId]);

  const formatValue = useCallback((r: FullTestResult | null): string => {
    if (!r) return '-';
    if (r.test_type === 'yoyo' && r.level != null) {
      return `Lv ${r.level}.${r.shuttle ?? 0}`;
    }
    if (r.sprint_time != null) return `${Number(r.sprint_time).toFixed(2)}s`;
    if (r.agility_time != null) return `${Number(r.agility_time).toFixed(2)}s`;
    if (r.jump_height != null) return `${r.jump_height} cm`;
    return '-';
  }, []);

  const handleApprove = async (mode: 'remote_video' | 'in_person') => {
    if (!requestId || !testResultId) return;
    setPickedMode(mode);
    setIsProcessing(true);
    const result = await approveVerification(requestId, testResultId, mode);
    setIsProcessing(false);
    if (result.error) {
      Alert.alert('Error', result.error);
      setPickedMode(null);
      return;
    }
    const modeLabel = mode === 'in_person' ? 'In-Person Verified' : 'Video Verified';
    Alert.alert('Verified!', `${athleteName}'s result has been ${modeLabel.toLowerCase()}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleReject = async () => {
    if (!requestId) return;
    setIsProcessing(true);
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', requestId);
    setIsProcessing(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Declined', 'Verification request declined.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const hasVideo = !!fullResult?.video_url;
  const testTypeLabel = (fullResult?.test_type ?? '').replace(/_/g, ' ').toUpperCase();
  const zone = fullResult?.zone ?? '';
  const value = formatValue(fullResult);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Verify Result',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.athleteInfo}>
          <CachedImage source={athleteAvatar} size={60} placeholder="avatar" />
          <View style={{ flex: 1 }}>
            <Text style={styles.athleteName}>{athleteName || 'Athlete'}</Text>
            <Text style={styles.requestLabel}>wants you to verify their result</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading test details…</Text>
          </View>
        ) : (
          <>
            {/* Video proof — if athlete uploaded one */}
            {hasVideo && (
              <View style={styles.videoCard}>
                <View style={styles.videoLabel}>
                  <Video size={14} color={theme.colors.cyan} />
                  <Text style={styles.videoLabelText}>VIDEO PROOF</Text>
                </View>
                <VideoPlayer uri={fullResult!.video_url!} height={220} muted={false} loop={false} />
              </View>
            )}

            {!hasVideo && (
              <View style={styles.noVideoCard}>
                <Camera size={20} color={theme.colors.textMuted} />
                <Text style={styles.noVideoText}>
                  Athlete didn’t upload video proof. Verify only if you were physically present.
                </Text>
              </View>
            )}

            <View style={styles.resultCard}>
              <Text style={styles.testTypeLabel}>{testTypeLabel}</Text>
              <Text style={styles.resultValue}>{value}</Text>
              {zone && (
                <View style={styles.zoneBadge}>
                  <Text style={styles.zoneText}>{zone.toUpperCase()}</Text>
                </View>
              )}
              {fullResult?.vo2max != null && (
                <Text style={styles.metricLine}>VO₂max {fullResult.vo2max}</Text>
              )}
              {fullResult?.total_distance != null && (
                <Text style={styles.metricLine}>{fullResult.total_distance}m total</Text>
              )}
              <View style={{ marginTop: 12 }}>
                <VerificationBadge tier="coach_verified" size="lg" showLabel />
              </View>
              <Text style={styles.upgradeText}>Will upgrade to Coach-Verified</Text>
            </View>

            <Text style={styles.questionText}>How are you verifying this result?</Text>

            <View style={styles.actions}>
              {/* In-person — strongest trust */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.inPersonBtn,
                  pickedMode === 'in_person' && styles.actionBtnActive,
                ]}
                onPress={() => handleApprove('in_person')}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                {isProcessing && pickedMode === 'in_person' ? (
                  <ActivityIndicator color={theme.colors.black} />
                ) : (
                  <>
                    <MapPin size={20} color={theme.colors.black} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.inPersonText}>I was present — Verify</Text>
                      <Text style={styles.btnSubtext}>Strongest signal: physical attendance</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {/* Remote video — only enabled if a video was uploaded */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.videoBtn,
                  !hasVideo && styles.actionBtnDisabled,
                  pickedMode === 'remote_video' && styles.actionBtnActive,
                ]}
                onPress={() => handleApprove('remote_video')}
                disabled={isProcessing || !hasVideo}
                activeOpacity={0.85}
              >
                {isProcessing && pickedMode === 'remote_video' ? (
                  <ActivityIndicator color={theme.colors.cyan} />
                ) : (
                  <>
                    <Video
                      size={20}
                      color={hasVideo ? theme.colors.cyan : theme.colors.textMuted}
                    />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.videoBtnText,
                          !hasVideo && { color: theme.colors.textMuted },
                        ]}
                      >
                        {hasVideo ? 'Watched the video — Verify' : 'No video uploaded'}
                      </Text>
                      <Text style={styles.btnSubtext}>
                        {hasVideo
                          ? 'Confirms what you saw on the recording'
                          : 'Athlete needs to upload a video first'}
                      </Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {/* Reject */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={handleReject}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <XCircle size={20} color={theme.colors.red} />
                <Text style={styles.rejectBtnText}>Decline — not enough proof</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerButton: { padding: 8 },
  content: { padding: 20, gap: 18 },
  athleteInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  athleteName: { fontSize: 18, color: theme.colors.text, fontWeight: '700' },
  requestLabel: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  loadingBlock: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 13, color: theme.colors.textSecondary },
  videoCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.dashBorder,
  },
  videoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.cyan + '15',
  },
  videoLabelText: {
    fontSize: 11,
    color: theme.colors.cyan,
    fontWeight: '700',
    letterSpacing: 1,
  },
  noVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 12,
    ...theme.dashBorder,
  },
  noVideoText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  resultCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 8,
  },
  testTypeLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  resultValue: { fontSize: 44, color: theme.colors.text, fontWeight: '900' },
  zoneBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '26',
  },
  zoneText: { fontSize: 13, color: theme.colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  metricLine: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  upgradeText: { fontSize: 11, color: theme.colors.cyan, fontWeight: '600', marginTop: 4 },
  questionText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
  },
  actions: { gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionBtnActive: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  inPersonBtn: {
    backgroundColor: theme.colors.primary,
  },
  inPersonText: {
    color: theme.colors.black,
    fontSize: 15,
    fontWeight: '700',
  },
  videoBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.cyan,
  },
  videoBtnText: {
    color: theme.colors.cyan,
    fontSize: 15,
    fontWeight: '700',
  },
  btnSubtext: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 2,
    fontWeight: '500',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  rejectBtnText: { color: theme.colors.red, fontSize: 15, fontWeight: '600' },
});
