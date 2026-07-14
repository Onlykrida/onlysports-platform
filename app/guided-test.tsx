import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams, Redirect } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Zap,
  Timer,
  TrendingUp,
  ArrowUp,
  Package,
  Settings,
  Activity,
  AlertTriangle,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { TestType } from '@/constants/fitness-test-data';
import { GUIDED_INSTRUCTIONS } from '@/constants/guided-test-instructions';
import { BackgroundGradient } from '@/components/BackgroundGradient';

interface GuidedTestMeta {
  title: string;
  tagline: string;
  icon: React.ReactNode;
  accentColor: string;
}

const GUIDED_META: Partial<Record<TestType, GuidedTestMeta>> = {
  sprint_10m: {
    title: 'SPRINT 10M',
    tagline: 'Pure acceleration — your first 10 metres.',
    icon: <Zap size={28} color={theme.colors.primary} />,
    accentColor: theme.colors.primary,
  },
  sprint_20m: {
    title: 'SPRINT 20M',
    tagline: 'Explosive acceleration over 20 metres.',
    icon: <Zap size={28} color={theme.colors.cyan} />,
    accentColor: theme.colors.cyan,
  },
  sprint_30m: {
    title: 'SPRINT 30M',
    tagline: 'Acceleration into top-end speed.',
    icon: <Timer size={28} color={theme.colors.cyan} />,
    accentColor: theme.colors.cyan,
  },
  sprint_40m: {
    title: 'SPRINT 40M',
    tagline: 'Your top-end speed over 40 metres.',
    icon: <Timer size={28} color={theme.colors.orange} />,
    accentColor: theme.colors.orange,
  },
  agility_ttest: {
    title: 'AGILITY T-TEST',
    tagline: 'Change-of-direction speed and footwork.',
    icon: <TrendingUp size={28} color={theme.colors.primary} />,
    accentColor: theme.colors.primary,
  },
  vertical_jump: {
    title: 'VERTICAL JUMP',
    tagline: 'Lower-body explosive power.',
    icon: <ArrowUp size={28} color="#BF5AF2" />,
    accentColor: '#BF5AF2',
  },
};

export default function GuidedTestScreen() {
  const params = useLocalSearchParams<{ testType?: string }>();
  const testType = (params.testType ?? '') as TestType;

  const meta = GUIDED_META[testType];
  const instructions = GUIDED_INSTRUCTIONS[testType];
  const manualHref = useMemo(() => `/beep-test-manual?testType=${testType}` as any, [testType]);

  // Fallback: unknown or unsupported testType — back to the hub.
  // Placed AFTER all hook calls to keep hook order stable across renders.
  if (!meta || !instructions) {
    return <Redirect href={'/beep-test' as any} />;
  }

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack.Screen
          options={{
            title: 'Guided Test',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.heroIconBadge, { backgroundColor: meta.accentColor + '20' }]}>
              {meta.icon}
            </View>
            <Text style={styles.pageTitle}>{meta.title}</Text>
            <Text style={styles.pageSubtitle}>{meta.tagline}</Text>
          </View>

          {/* Section 1: What you'll need */}
          <InstructionSection
            icon={<Package size={18} color={theme.colors.cyan} />}
            title="What you'll need"
            items={instructions.needs}
            ordered={false}
          />

          {/* Section 2: How to set up */}
          <InstructionSection
            icon={<Settings size={18} color={theme.colors.cyan} />}
            title="How to set up"
            items={instructions.setup}
            ordered
          />

          {/* Section 3: How to perform */}
          <InstructionSection
            icon={<Activity size={18} color={theme.colors.primary} />}
            title="How to perform"
            items={instructions.howTo}
            ordered
          />

          {/* Section 4: Watch out for */}
          <InstructionSection
            icon={<AlertTriangle size={18} color={theme.colors.orange} />}
            title="Watch out for"
            items={instructions.commonMistakes}
            ordered={false}
            warning
          />

          {/* Attempts hint */}
          <View style={styles.attemptsHint}>
            <Text style={styles.attemptsHintText}>
              Take {instructions.attemptsRecommended} attempts. Enter your best result.
            </Text>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => router.push(manualHref)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="I'm ready, enter result"
          >
            <Text style={styles.primaryCtaText}>I&apos;m ready — enter result</Text>
            <ChevronRight size={20} color={theme.colors.black} />
          </TouchableOpacity>

          {/* Secondary skip */}
          <TouchableOpacity
            style={styles.skipLink}
            onPress={() => router.replace(manualHref)}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="Skip ahead to enter result"
          >
            <Text style={styles.skipLinkText}>Already know what to do? Skip ahead →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

interface InstructionSectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  ordered: boolean;
  warning?: boolean;
}

const InstructionSection: React.FC<InstructionSectionProps> = ({
  icon,
  title,
  items,
  ordered,
  warning,
}) => {
  return (
    <View style={[styles.section, warning && styles.sectionWarning]}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item, idx) => (
        <View key={`${title}-${idx}`} style={styles.itemRow}>
          {ordered ? (
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>{idx + 1}</Text>
            </View>
          ) : (
            <View style={[styles.bullet, warning && styles.bulletWarning]} />
          )}
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

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
  hero: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  heroIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: theme.spacing.md,
  },
  sectionWarning: {
    borderColor: 'rgba(255,159,10,0.15)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  numberBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.cyan,
    marginTop: 10,
    marginLeft: 9,
    marginRight: 9,
  },
  bulletWarning: {
    backgroundColor: theme.colors.orange,
  },
  itemText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  attemptsHint: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  attemptsHintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    ...theme.shadow.ctaGlow,
  },
  primaryCtaText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skipLink: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
