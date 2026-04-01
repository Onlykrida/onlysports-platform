import React, { useState } from 'react';
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
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import VerificationBadge from '@/components/VerificationBadge';
import { supabase } from '@/constants/supabase';
import CachedImage from '@/components/CachedImage';

export default function VerifyResultScreen() {
  const { requestId, testResultId, athleteName, athleteAvatar, testType, zone, value } =
    useLocalSearchParams<{
      requestId: string;
      testResultId: string;
      athleteName: string;
      athleteAvatar?: string;
      testType: string;
      zone: string;
      value: string;
    }>();

  const { approveVerification } = useFitnessTest();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (!requestId || !testResultId) return;
    setIsProcessing(true);
    const result = await approveVerification(requestId, testResultId);
    setIsProcessing(false);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Verified!', `${athleteName}'s result has been verified.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
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

        <View style={styles.resultCard}>
          <Text style={styles.testTypeLabel}>
            {(testType || '').replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.resultValue}>{value || '-'}</Text>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneText}>{(zone || '').toUpperCase()}</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <VerificationBadge tier="coach_verified" size="lg" showLabel />
          </View>
          <Text style={styles.upgradeText}>Will upgrade to Coach-Verified</Text>
        </View>

        <Text style={styles.questionText}>Did you witness this athlete perform this test?</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle size={20} color="#fff" />
                <Text style={styles.approveBtnText}>Yes, I Verify This</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={handleReject}
            disabled={isProcessing}
          >
            <XCircle size={20} color={theme.colors.danger} />
            <Text style={styles.rejectBtnText}>I Wasn't Present</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerButton: { padding: 8 },
  content: { padding: 20, gap: 20 },
  athleteInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  athleteName: { fontSize: 18, color: theme.colors.text, fontWeight: '700' },
  requestLabel: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  resultCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: 'rgba(48,209,88,0.15)',
  },
  zoneText: { fontSize: 13, color: theme.colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  upgradeText: { fontSize: 11, color: '#64D2FF', fontWeight: '600', marginTop: 4 },
  questionText: { fontSize: 16, color: theme.colors.text, textAlign: 'center', fontWeight: '600' },
  actions: { gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  approveBtn: { backgroundColor: theme.colors.primary },
  approveBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  rejectBtnText: { color: theme.colors.danger, fontSize: 15, fontWeight: '600' },
});
