import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, Video, MapPin, Camera } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { showAlert } from '@/constants/cross-platform-alert';
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

type RejectReason =
  | 'not_present'
  | 'video_unclear'
  | 'video_missing'
  | 'wrong_athlete'
  | 'incomplete_test'
  | 'other';

const REJECT_REASONS: { key: RejectReason; label: string; subtitle: string }[] = [
  {
    key: 'not_present',
    label: "I wasn't there",
    subtitle: 'No physical attendance, no video either',
  },
  {
    key: 'video_unclear',
    label: 'Video unclear',
    subtitle: 'Too blurry, unclear angle, or test not visible',
  },
  {
    key: 'video_missing',
    label: 'No video uploaded',
    subtitle: 'Athlete needs to upload proof first',
  },
  {
    key: 'wrong_athlete',
    label: "Can't confirm it's the athlete",
    subtitle: "Face isn't visible at the start",
  },
  {
    key: 'incomplete_test',
    label: 'Test looks incomplete',
    subtitle: 'Protocol not fully followed',
  },
  {
    key: 'other',
    label: 'Other reason',
    subtitle: 'Add a free-text note below',
  },
];

export default function VerifyResultScreen() {
  const { requestId, testResultId, athleteName, athleteAvatar } = useLocalSearchParams<{
    requestId: string;
    testResultId: string;
    athleteName: string;
    athleteAvatar?: string;
  }>();

  const { approveVerification, rejectVerification } = useFitnessTest();
  const [fullResult, setFullResult] = useState<FullTestResult | null>(null);
  const [athleteNotes, setAthleteNotesState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickedMode, setPickedMode] = useState<'remote_video' | 'in_person' | null>(null);
  const [showRejectPicker, setShowRejectPicker] = useState(false);
  const [pickedReason, setPickedReason] = useState<RejectReason | null>(null);
  const [otherReasonText, setOtherReasonText] = useState('');

  // Fetch the full row — old version only had whatever was passed in params.
  // Need video_url + every metric so the verifier sees the actual evidence.
  // Also pulls athlete_notes from the verification_requests row so the
  // verifier can read context the athlete attached to the request.
  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !testResultId) {
        setIsLoading(false);
        return;
      }
      try {
        const [resultResponse, requestResponse] = await Promise.all([
          supabase
            .from('fitness_test_results')
            .select(
              'id, test_type, test_mode, zone, level, shuttle, sprint_time, agility_time, jump_height, vo2max, total_distance, video_url, sensor_data, test_date',
            )
            .eq('id', testResultId)
            .maybeSingle(),
          requestId
            ? supabase
                .from('verification_requests')
                .select('athlete_notes')
                .eq('id', requestId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (resultResponse.error) {
          if (__DEV__) console.warn('VerifyResult: fetch error', resultResponse.error);
          setFullResult(null);
        } else {
          setFullResult(resultResponse.data as any);
        }
        // athlete_notes is pre-migration-safe: PostgREST returns
        // PGRST204 (column not found) gracefully here. Just ignore on error.
        if (!requestResponse.error && (requestResponse.data as any)?.athlete_notes) {
          setAthleteNotesState((requestResponse.data as any).athlete_notes);
        }
      } catch (e) {
        if (__DEV__) console.warn('VerifyResult: load exception', e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [testResultId, requestId]);

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
      showAlert('Error', result.error);
      setPickedMode(null);
      return;
    }
    const modeLabel = mode === 'in_person' ? 'In-Person Verified' : 'Video Verified';
    showAlert('Verified!', `${athleteName}'s result has been ${modeLabel.toLowerCase()}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  // Step 1 of reject: open the reason picker. We don't auto-reject without a
  // reason — the athlete needs categorical feedback to know what to fix.
  const handleReject = () => {
    setShowRejectPicker(true);
  };

  // Step 2 of reject: user picked a reason (and optional free text); send.
  const submitReject = async () => {
    if (!requestId || !pickedReason) return;
    setIsProcessing(true);
    const notes = pickedReason === 'other' ? otherReasonText.trim() || undefined : undefined;
    const { error } = await rejectVerification(requestId, pickedReason, notes);
    setIsProcessing(false);
    if (error) {
      showAlert('Error', error);
      return;
    }
    setShowRejectPicker(false);
    showAlert('Declined', 'Verification request declined. The athlete has been notified.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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

            {/* Athlete-attached note — context the athlete added when sending
                the request. Helps the verifier understand circumstances
                without a separate DM thread. */}
            {athleteNotes && (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>NOTE FROM ATHLETE</Text>
                <Text style={styles.notesBody}>{athleteNotes}</Text>
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

      {/* Reject reason picker modal — categorical reason becomes part of
          the athlete notification copy so they know what to fix and retry */}
      <Modal
        visible={showRejectPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRejectPicker(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Why are you declining?</Text>
            <TouchableOpacity
              onPress={() => setShowRejectPicker(false)}
              style={styles.headerButton}
              hitSlop={8}
            >
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            <Text style={styles.pickerSubtitle}>
              The athlete will see this in their notification. Specific feedback helps them retry
              with a better recording or find the right verifier.
            </Text>
            {REJECT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.reasonRow, pickedReason === r.key && styles.reasonRowActive]}
                onPress={() => setPickedReason(r.key)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.reasonLabel, pickedReason === r.key && styles.reasonLabelActive]}
                  >
                    {r.label}
                  </Text>
                  <Text style={styles.reasonSubtitle}>{r.subtitle}</Text>
                </View>
                {pickedReason === r.key && <CheckCircle size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
            {pickedReason === 'other' && (
              <TextInput
                style={styles.otherInput}
                placeholder="Tell the athlete what was wrong"
                placeholderTextColor={theme.colors.textMuted}
                value={otherReasonText}
                onChangeText={setOtherReasonText}
                multiline
                maxLength={300}
                returnKeyType="done"
                blurOnSubmit
              />
            )}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.rejectBtnSolid,
                (!pickedReason || isProcessing) && styles.actionBtnDisabled,
              ]}
              onPress={submitReject}
              disabled={!pickedReason || isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator color={theme.colors.red} />
              ) : (
                <Text style={styles.rejectBtnSolidText}>Send decline</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  // Athlete-attached note card
  notesCard: {
    backgroundColor: theme.colors.cyan + '15',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.cyan + '33',
  },
  notesLabel: {
    fontSize: 10,
    color: theme.colors.cyan,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  notesBody: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 19,
  },

  // Reject reason picker modal
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  pickerCancel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  pickerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reasonLabelActive: {
    color: theme.colors.primary,
  },
  reasonSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  otherInput: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 13,
    color: theme.colors.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  rejectBtnSolid: {
    backgroundColor: theme.colors.red + '15',
    borderWidth: 1,
    borderColor: theme.colors.red,
    marginTop: 8,
  },
  rejectBtnSolidText: {
    color: theme.colors.red,
    fontSize: 15,
    fontWeight: '700',
  },
});
