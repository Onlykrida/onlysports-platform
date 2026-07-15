import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  ListChecks,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { formatDate } from '@/constants/format-date';
import { getOpportunityTypeColor } from '@/constants/opportunity-meta';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';
import EmptyState from '@/components/EmptyState';
import { useOpportunities } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';

// Opportunity detail + explicit confirm-apply.
// Previously the list card's "Apply Now" submitted in ONE blind tap — no
// requirements shown, no statement of what gets shared with the team. For
// teenagers applying to trials that's a trust requirement, not polish
// (design audit, promoted to Wave A).
export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { opportunities, applyToOpportunity } = useOpportunities();
  const { user } = useAuth();
  const { track } = useAnalytics();

  const opportunity = opportunities.find((o) => o.id === id);

  const [confirming, setConfirming] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const canApply = user?.role === 'athlete' && !opportunity?.hasApplied && !applied;

  const handleConfirmApply = useCallback(async () => {
    if (!opportunity) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      const { error } = await applyToOpportunity(opportunity.id);
      if (error) {
        setApplyError(error);
        return;
      }
      track(EVENTS.OPPORTUNITY_APPLIED, { opportunityId: opportunity.id });
      setApplied(true);
      setConfirming(false);
    } catch {
      setApplyError('Failed to submit application. Check your connection and try again.');
    } finally {
      setIsApplying(false);
    }
  }, [opportunity, applyToOpportunity, track]);

  if (!opportunity) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Stack.Screen options={{ title: 'Opportunity', headerShown: true }} />
          <EmptyState
            preset="opportunities"
            title="This opportunity has moved on"
            subtitle="It may have closed or been removed. New tryouts and trials are posted daily."
            ctaLabel="Browse Opportunities"
            onCTA={() => router.back()}
          />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const typeColor = getOpportunityTypeColor(opportunity.type);

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack.Screen
          options={{
            title: 'Opportunity',
            headerShown: true,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tags */}
          <View style={styles.tagRow}>
            <View style={[styles.typeTag, { borderColor: typeColor }]}>
              <Text style={[styles.typeTagText, { color: typeColor }]}>
                {opportunity.type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.sportTag}>
              <Text style={styles.sportTagText}>{opportunity.sport}</Text>
            </View>
            {opportunity.paid && (
              <View style={styles.paidTag}>
                <DollarSign size={11} color={theme.colors.primary} />
                <Text style={styles.paidTagText}>PAID</Text>
              </View>
            )}
          </View>

          {/* Title + team */}
          <Text style={styles.title}>{opportunity.title}</Text>
          <View style={styles.teamRow}>
            <CachedImage source={opportunity.teamAvatar} size={32} placeholder="avatar" />
            <Text style={styles.teamName} numberOfLines={1}>
              {opportunity.teamName || 'Team'}
            </Text>
          </View>

          {/* Key facts */}
          <View style={styles.factsCard}>
            <View style={styles.factRow}>
              <MapPin size={15} color={theme.colors.orange} />
              <Text style={styles.factText}>{opportunity.location}</Text>
            </View>
            <View style={styles.factRow}>
              <Calendar size={15} color={theme.colors.cyan} />
              <Text style={styles.factText}>Apply by {formatDate(opportunity.deadline)}</Text>
            </View>
            <View style={styles.factRow}>
              <Users size={15} color={theme.colors.textSecondary} />
              <Text style={styles.factText}>
                {opportunity.applicationsCount ?? 0} athlete
                {(opportunity.applicationsCount ?? 0) === 1 ? '' : 's'} applied
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>ABOUT THIS OPPORTUNITY</Text>
          <Text style={styles.description}>{opportunity.description}</Text>

          {/* Requirements */}
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>REQUIREMENTS</Text>
              <View style={styles.requirementsCard}>
                {opportunity.requirements.map((req, i) => (
                  <View key={i} style={styles.requirementRow}>
                    <ListChecks size={14} color={theme.colors.primary} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* What's shared — the athlete sees exactly what the team gets
              BEFORE committing */}
          {canApply && (
            <>
              <Text style={styles.sectionTitle}>
                WHAT {opportunity.teamName ? opportunity.teamName.toUpperCase() : 'THE TEAM'} WILL
                SEE
              </Text>
              <View style={styles.sharedCard}>
                <View style={styles.sharedRow}>
                  <ShieldCheck size={14} color={theme.colors.cyan} />
                  <Text style={styles.sharedText}>
                    Your profile: name, sport, position, location
                  </Text>
                </View>
                <View style={styles.sharedRow}>
                  <ShieldCheck size={14} color={theme.colors.cyan} />
                  <Text style={styles.sharedText}>
                    Your portfolio: posts, achievements, and fitness test results with their
                    verification tiers
                  </Text>
                </View>
                <View style={styles.sharedRow}>
                  <ShieldCheck size={14} color={theme.colors.cyan} />
                  <Text style={styles.sharedText}>
                    Nothing else — no contact details until you choose to reply
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Apply flow */}
          {applied || opportunity.hasApplied ? (
            <View style={styles.appliedCard}>
              <CheckCircle2 size={20} color={theme.colors.primary} />
              <Text style={styles.appliedText}>
                Application sent. {opportunity.teamName || 'The team'} can now view your portfolio —
                keep it sharp.
              </Text>
            </View>
          ) : canApply ? (
            confirming ? (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Send this application?</Text>
                <Text style={styles.confirmText}>
                  {opportunity.teamName || 'The team'} will see your profile and portfolio as
                  described above. You can&apos;t unsend an application.
                </Text>
                {applyError && <Text style={styles.errorText}>{applyError}</Text>}
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setConfirming(false)}
                    disabled={isApplying}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel application"
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmApply}
                    disabled={isApplying}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm and send application"
                  >
                    {isApplying ? (
                      <ActivityIndicator size="small" color={theme.colors.black} />
                    ) : (
                      <Text style={styles.confirmBtnText}>CONFIRM & SEND</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setConfirming(true)}
                accessibilityRole="button"
                accessibilityLabel="Review and apply"
              >
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            )
          ) : user?.role !== 'athlete' ? (
            <Text style={styles.roleNote}>Only athletes can apply to opportunities.</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { padding: theme.spacing.sm },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  typeTagText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: 0.5,
  },
  sportTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  sportTagText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  paidTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(48,209,88,0.12)',
  },
  paidTagText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  teamName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  factsCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  factText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  requirementsCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  requirementText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 19,
  },
  sharedCard: {
    backgroundColor: 'rgba(100,210,255,0.06)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(100,210,255,0.25)',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  sharedText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  applyBtn: {
    minHeight: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.ctaGlow,
  },
  applyBtnText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.black,
    letterSpacing: 2,
  },
  confirmCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: theme.spacing.md,
  },
  confirmTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  confirmText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  confirmBtn: {
    flex: 1.4,
    minHeight: 46,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.black,
    letterSpacing: 1,
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.35)',
    padding: theme.spacing.md,
  },
  appliedText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 19,
  },
  roleNote: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
