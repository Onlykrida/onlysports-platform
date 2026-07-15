import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Zap,
  Headphones,
  Edit3,
  ChevronRight,
  Eye,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';
import VerificationBadge from '@/components/VerificationBadge';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';
import { useFollow } from '@/hooks/follow-context';

// Post-signup athlete onboarding. Signup already collects sport/position/
// location — what new athletes were missing is DIRECTION: they landed on an
// empty feed with no next action (design vision §5.1). Three steps, fully
// skippable, ~60 seconds:
//   1. Why scouts will find you (the verified-portfolio pitch, 3 lines)
//   2. Prove your first number (routes into the Combine paths)
//   3. Follow the scene (seed the feed so it isn't empty)
export default function OnboardingScreen() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { followUser, isFollowing } = useFollow();
  const [step, setStep] = useState(0);

  // Coaches, scouts, academies — the accounts that make an athlete's feed
  // useful on day one. Cache-based is fine at current scale.
  const suggested = useMemo(
    () =>
      users
        .filter(
          (u) =>
            u.id !== user?.id &&
            (u.role === 'coach' || u.role === 'scout' || u.role === 'academy' || u.role === 'team'),
        )
        .slice(0, 5),
    [users, user?.id],
  );

  const finish = () => router.replace('/(tabs)' as any);

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Progress dots */}
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          {step === 0 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>WELCOME TO ONLYKRIDA</Text>
              <Text style={styles.title}>
                {user?.name ? `${user.name.split(' ')[0]}, scouts` : 'Scouts'} can&apos;t pick who
                they never see.
              </Text>
              <View style={styles.pitchCard}>
                <View style={styles.pitchRow}>
                  <ShieldCheck size={18} color={theme.colors.primary} />
                  <Text style={styles.pitchText}>
                    Verified fitness results are what scouts filter by — one real number beats a
                    highlight reel of claims.
                  </Text>
                </View>
                <View style={styles.pitchRow}>
                  <Eye size={18} color={theme.colors.cyan} />
                  <Text style={styles.pitchText}>
                    Your portfolio works 24/7. You&apos;ll see every scout who views it.
                  </Text>
                </View>
                <View style={styles.pitchRow}>
                  <TrendingUp size={18} color={theme.colors.orange} />
                  <Text style={styles.pitchText}>
                    Zones grow with you — Starter to Unstoppable. Every champion started somewhere.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setStep(1)}
                accessibilityRole="button"
                accessibilityLabel="Next"
              >
                <Text style={styles.primaryBtnText}>LET&apos;S GO</Text>
                <ChevronRight size={18} color={theme.colors.black} />
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>STEP 1 OF YOUR COMBINE</Text>
              <Text style={styles.title}>Prove your first number.</Text>
              <Text style={styles.subtitle}>
                Two minutes now puts a real, filterable stat on your portfolio.
              </Text>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => router.replace('/beep-test-live' as any)}
                accessibilityRole="button"
                accessibilityLabel="Start the guided Yo-Yo test"
              >
                <View style={[styles.choiceIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Headphones size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>Guided Yo-Yo test</Text>
                  <Text style={styles.choiceDesc}>App-timed shuttle run · earns App-Tested</Text>
                </View>
                <VerificationBadge tier="app_measured" size="sm" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => router.replace('/beep-test-manual?testType=sprint_20m' as any)}
                accessibilityRole="button"
                accessibilityLabel="Enter a sprint result you already have"
              >
                <View style={[styles.choiceIcon, { backgroundColor: theme.colors.cyan + '20' }]}>
                  <Zap size={22} color={theme.colors.cyan} />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>Enter a result I have</Text>
                  <Text style={styles.choiceDesc}>
                    20m sprint from school or academy · Self-Reported
                  </Text>
                </View>
                <VerificationBadge tier="self_reported" size="sm" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => router.replace('/beep-test' as any)}
                accessibilityRole="button"
                accessibilityLabel="Browse all fitness tests"
              >
                <View style={[styles.choiceIcon, { backgroundColor: theme.colors.orange + '20' }]}>
                  <Edit3 size={22} color={theme.colors.orange} />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>See all tests</Text>
                  <Text style={styles.choiceDesc}>Sprints, agility, vertical jump, Yo-Yo</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipLink}
                onPress={() => setStep(2)}
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
              >
                <Text style={styles.skipText}>I&apos;ll do this later →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>LAST STEP</Text>
              <Text style={styles.title}>Follow the scene.</Text>
              <Text style={styles.subtitle}>
                Coaches and scouts you follow are likelier to notice you back.
              </Text>

              {suggested.length > 0 ? (
                suggested.map((s) => {
                  const followed = isFollowing(s.id);
                  return (
                    <View key={s.id} style={styles.followRow}>
                      <CachedImage source={s.avatar} size={40} placeholder="avatar" />
                      <View style={styles.followText}>
                        <Text style={styles.followName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.followMeta} numberOfLines={1}>
                          {s.role.toUpperCase()}
                          {s.sport ? ` · ${s.sport}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.followBtn, followed && styles.followBtnDone]}
                        onPress={() => !followed && followUser(s.id)}
                        accessibilityRole="button"
                        accessibilityLabel={followed ? `Following ${s.name}` : `Follow ${s.name}`}
                      >
                        <Text style={[styles.followBtnText, followed && styles.followBtnTextDone]}>
                          {followed ? 'FOLLOWING' : 'FOLLOW'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.subtitle}>
                  The scene is warming up — you&apos;ll find coaches and scouts in Search.
                </Text>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={finish}
                accessibilityRole="button"
                accessibilityLabel="Finish onboarding, go to my feed"
              >
                <Text style={styles.primaryBtnText}>TAKE ME TO MY FEED</Text>
                <ChevronRight size={18} color={theme.colors.black} />
              </TouchableOpacity>
            </View>
          )}

          {step < 2 && (
            <TouchableOpacity
              style={styles.skipAll}
              onPress={finish}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={styles.skipAllText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 22,
  },
  step: { gap: theme.spacing.md },
  kicker: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.primary,
    letterSpacing: 2.5,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  pitchCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  pitchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  pitchText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    ...theme.shadow.ctaGlow,
  },
  primaryBtnText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.black,
    letterSpacing: 1.5,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    minHeight: 64,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { flex: 1 },
  choiceTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  choiceDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.sm + 2,
  },
  followText: { flex: 1 },
  followName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  followMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  followBtn: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnDone: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  followBtnText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  followBtnTextDone: {
    color: theme.colors.textMuted,
  },
  skipAll: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  skipAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});
