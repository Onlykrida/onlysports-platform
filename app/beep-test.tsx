import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Headphones,
  Edit3,
  ChevronRight,
  Info,
  Zap,
  Timer,
  TrendingUp,
  ArrowUp,
  Camera,
  Lock,
  Activity,
  Target,
  Crosshair,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { TestType } from '@/constants/fitness-test-data';
import BackgroundGradient from '@/components/BackgroundGradient';
import VerificationBadge from '@/components/VerificationBadge';
import { getTierMeta } from '@/constants/verification';

interface SpeedTestCard {
  title: string;
  description: string;
  testType: TestType;
  icon: React.ReactNode;
  accentColor: string;
}

const SPEED_POWER_TESTS: SpeedTestCard[] = [
  {
    title: 'SPRINT 10M',
    description: 'Pure acceleration test — first 10 metres only.',
    testType: 'sprint_10m',
    icon: <Zap size={22} color={theme.colors.primary} />,
    accentColor: theme.colors.primary,
  },
  {
    title: 'SPRINT 20M',
    description: 'Measure your explosive acceleration over 20 metres.',
    testType: 'sprint_20m',
    icon: <Zap size={22} color={theme.colors.cyan} />,
    accentColor: theme.colors.cyan,
  },
  {
    title: 'SPRINT 30M',
    description: 'Acceleration plus transition into top-end speed.',
    testType: 'sprint_30m',
    icon: <Timer size={22} color={theme.colors.cyan} />,
    accentColor: theme.colors.cyan,
  },
  {
    title: 'SPRINT 40M',
    description: 'Test your top-end speed over 40 metres.',
    testType: 'sprint_40m',
    icon: <Timer size={22} color={theme.colors.orange} />,
    accentColor: theme.colors.orange,
  },
  {
    title: 'AGILITY T-TEST',
    description: 'Assess your change-of-direction speed and agility.',
    testType: 'agility_ttest',
    icon: <TrendingUp size={22} color={theme.colors.primary} />,
    accentColor: theme.colors.primary,
  },
  {
    title: 'VERTICAL JUMP',
    description: 'Measure your lower-body explosive power.',
    testType: 'vertical_jump',
    icon: <ArrowUp size={22} color="#BF5AF2" />,
    accentColor: '#BF5AF2',
  },
];

// Sport-specific tests requiring camera/CV pipelines or GPS — marked as
// coming-soon for v1.5. Schema (test_type CHECK + FitnessTestType union)
// already supports these so save paths can land later without migration.
interface ComingSoonCard {
  title: string;
  description: string;
  sportTag: string;
  icon: React.ReactNode;
}

const COMING_SOON_TESTS: ComingSoonCard[] = [
  {
    title: 'GPS TIME TRIAL',
    description: 'Cricket 2km, athletics Cooper, badminton AIR-BT pace.',
    sportTag: 'Multiple sports',
    icon: <Activity size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'JUGGLING COUNTER',
    description: 'Camera-tracked ball control reps in 60 seconds.',
    sportTag: 'Football',
    icon: <Camera size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'WALL VOLLEY',
    description: 'Continuous wall-volley count — racket sport agility.',
    sportTag: 'Badminton · Tennis',
    icon: <Camera size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'DRIBBLE CONES',
    description: 'Slalom timed dribble through cones with CV verification.',
    sportTag: 'Basketball · Football',
    icon: <Camera size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'SPOT SHOOTING %',
    description: 'Shots-made vs attempted across five spots.',
    sportTag: 'Basketball',
    icon: <Crosshair size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'DRAG FLICK ACCURACY',
    description: 'Penalty-corner drag flicks — accuracy & power.',
    sportTag: 'Hockey',
    icon: <Target size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'CROSSING ACCURACY',
    description: 'Crosses landing in defined target zones.',
    sportTag: 'Football',
    icon: <Target size={20} color={theme.colors.textSecondary} />,
  },
  {
    title: 'BOWLING LINE + LENGTH',
    description: 'Bowling accuracy across line + length targets.',
    sportTag: 'Cricket',
    icon: <Target size={20} color={theme.colors.textSecondary} />,
  },
];

export default function FitnessTestScreen() {
  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack.Screen
          options={{
            title: 'Fitness Testing',
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: theme.colors.text,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Page Title */}
          <Text style={styles.pageTitle}>FITNESS TESTING</Text>
          <Text style={styles.pageSubtitle}>
            Track your athletic performance across key fitness metrics
          </Text>

          {/* How Verification Works — promoted to top so users see the moat first */}
          <View style={styles.tiersSection}>
            <Text style={styles.tiersSectionTitle}>How Verification Works</Text>
            <Text style={styles.tiersSectionDesc}>
              Higher verification = more scout trust = more visibility
            </Text>
            {(['self_reported', 'app_measured', 'coach_verified', 'center_tested'] as const).map(
              (tier) => {
                const meta = getTierMeta(tier);
                return (
                  <View key={tier} style={styles.tierRow}>
                    <VerificationBadge tier={tier} size="md" showLabel />
                    <Text style={styles.tierRowDesc}>{meta.description}</Text>
                  </View>
                );
              },
            )}
          </View>

          {/* Section: Yo-Yo IR1 Endurance */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.sectionTitle}>YO-YO IR1 ENDURANCE</Text>
          </View>

          {/* Guided Audio Test Card */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/beep-test-live' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.optionIconRow}>
              <View style={[styles.iconBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Headphones size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.optionTitle} numberOfLines={1} ellipsizeMode="tail">
                GUIDED AUDIO TEST
              </Text>
            </View>
            <Text style={styles.optionDescription} numberOfLines={3} ellipsizeMode="tail">
              Run along with the beeps. The app times everything for you. Just tap "I stopped" when
              done.
            </Text>
            <View style={styles.optionCta}>
              <Text style={styles.optionCtaText}>Start Guided Test</Text>
              <ChevronRight size={18} color={theme.colors.black} />
            </View>
          </TouchableOpacity>

          {/* Yo-Yo Manual Entry Card */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/beep-test-manual' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.optionIconRow}>
              <View style={[styles.iconBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                <Edit3 size={24} color={theme.colors.accent} />
              </View>
              <Text style={styles.optionTitle} numberOfLines={1} ellipsizeMode="tail">
                ENTER RESULT MANUALLY
              </Text>
            </View>
            <Text style={styles.optionDescription} numberOfLines={3} ellipsizeMode="tail">
              Already tested at school, academy, or with a coach? Enter your Yo-Yo IR1 score.
            </Text>
            <View style={[styles.optionCta, { backgroundColor: theme.colors.accent }]}>
              <Text style={styles.optionCtaText}>Enter Result</Text>
              <ChevronRight size={18} color={theme.colors.black} />
            </View>
          </TouchableOpacity>

          {/* Section: Speed & Power */}
          <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
            <View style={[styles.sectionDot, { backgroundColor: theme.colors.cyan }]} />
            <Text style={styles.sectionTitle}>SPEED & POWER</Text>
          </View>

          {SPEED_POWER_TESTS.map((test) => (
            <View key={test.testType} style={styles.dualCard}>
              <View style={styles.dualCardTop}>
                <View style={[styles.iconBadge, { backgroundColor: test.accentColor + '20' }]}>
                  {test.icon}
                </View>
                <View style={styles.testCardText}>
                  <Text style={styles.testCardTitle} numberOfLines={1} ellipsizeMode="tail">
                    {test.title}
                  </Text>
                  <Text style={styles.testCardDescription} numberOfLines={2} ellipsizeMode="tail">
                    {test.description}
                  </Text>
                </View>
              </View>
              <View style={styles.dualCtaRow}>
                <TouchableOpacity
                  style={[styles.dualCtaPrimary, { backgroundColor: test.accentColor }]}
                  onPress={() => router.push(`/guided-test?testType=${test.testType}` as any)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Start guided ${test.title} test`}
                >
                  <Text style={styles.dualCtaPrimaryText}>Start Guided</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dualCtaSecondary}
                  onPress={() => router.push(`/beep-test-manual?testType=${test.testType}` as any)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Enter ${test.title} manually`}
                >
                  <Text style={styles.dualCtaSecondaryText}>Enter Manually →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Section: Sport-Specific (Coming Soon) — camera/CV + GPS pipelines */}
          <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
            <View style={[styles.sectionDot, { backgroundColor: theme.colors.textMuted }]} />
            <Text style={styles.sectionTitle}>SPORT-SPECIFIC</Text>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonPillText}>SOON</Text>
            </View>
          </View>
          <Text style={styles.comingSoonIntro}>
            These need camera or GPS verification — we’re shipping them sport-by-sport over the next
            two waves. Tell us which one you want first.
          </Text>

          {COMING_SOON_TESTS.map((test) => (
            <View key={test.title} style={[styles.testCard, styles.testCardLocked]}>
              <View style={styles.testCardLeft}>
                <View
                  style={[styles.iconBadge, { backgroundColor: theme.colors.textMuted + '20' }]}
                >
                  {test.icon}
                </View>
                <View style={styles.testCardText}>
                  <View style={styles.lockedTitleRow}>
                    <Text style={styles.testCardTitleLocked} numberOfLines={1} ellipsizeMode="tail">
                      {test.title}
                    </Text>
                    <Text style={styles.sportTag} numberOfLines={1} ellipsizeMode="tail">
                      {test.sportTag}
                    </Text>
                  </View>
                  <Text style={styles.testCardDescription} numberOfLines={2} ellipsizeMode="tail">
                    {test.description}
                  </Text>
                </View>
              </View>
              <Lock size={16} color={theme.colors.textMuted} />
            </View>
          ))}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Info size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoTitle} numberOfLines={1} ellipsizeMode="tail">
                ABOUT FITNESS TESTING
              </Text>
            </View>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>Yo-Yo IR1</Text>
              {' \u2014 '}A 20m shuttle run that measures endurance and VO2max. Used by every
              professional sport worldwide.
            </Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>Sprint Tests</Text>
              {' \u2014 '}Measure your acceleration (20m) and top-end speed (40m). Critical for
              football, athletics, and rugby.
            </Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>Agility T-Test</Text>
              {' \u2014 '}Tests lateral movement, change of direction, and agility. Key for
              basketball, tennis, and field sports.
            </Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>Vertical Jump</Text>
              {' \u2014 '}Measures lower-body explosive power. Essential for volleyball, basketball,
              and track & field.
            </Text>
          </View>
        </ScrollView>
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
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  pageSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  optionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.md,
  },
  optionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  optionDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  optionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadow.ctaGlow,
  },
  optionCtaText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  testCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Dual-CTA Speed/Power card: vertical layout with Start Guided + Enter Manually
  dualCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: theme.spacing.md,
  },
  dualCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dualCtaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  dualCtaPrimary: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  dualCtaPrimaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dualCtaSecondary: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  dualCtaSecondaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  testCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  testCardText: {
    flex: 1,
    gap: 4,
  },
  testCardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  testCardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  testCardLocked: {
    opacity: 0.7,
  },
  testCardTitleLocked: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  lockedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sportTag: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  comingSoonPill: {
    backgroundColor: theme.colors.textMuted + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: theme.spacing.xs,
  },
  comingSoonPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  comingSoonIntro: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  tiersSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 12,
    gap: 8,
  },
  tiersSectionTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '700',
  },
  tiersSectionDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  tierRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 6,
  },
  tierRowDesc: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
