import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAI } from '@/hooks/ai-context';

const IMPACT_COLORS: Record<string, string> = {
  high: theme.colors.primary,
  medium: theme.colors.cyan,
  low: theme.colors.textMuted,
};

export default function AIProfileCoach() {
  const { profileTips, getProfileTips, isTipsLoading, isConfigured } = useAI();
  const [expanded, setExpanded] = useState(true);

  const handleLoad = useCallback(() => {
    if (!isTipsLoading) getProfileTips();
  }, [getProfileTips, isTipsLoading]);

  if (!isConfigured) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Sparkles size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>AI Profile Coach</Text>
            <Text style={styles.subtitle}>Powered by Krida AI</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={theme.colors.textMuted} />
        ) : (
          <ChevronDown size={20} color={theme.colors.textMuted} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {profileTips.length === 0 && !isTipsLoading ? (
            <TouchableOpacity style={styles.generateButton} onPress={handleLoad}>
              <Sparkles size={18} color={theme.colors.background} />
              <Text style={styles.generateButtonText}>Get AI suggestions</Text>
            </TouchableOpacity>
          ) : isTipsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.loadingText}>Analyzing your profile...</Text>
            </View>
          ) : (
            <View style={styles.tipsList}>
              {profileTips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipHeader}>
                    <View
                      style={[
                        styles.impactBadge,
                        { backgroundColor: IMPACT_COLORS[tip.impact] + '20' },
                      ]}
                    >
                      <Text style={[styles.impactText, { color: IMPACT_COLORS[tip.impact] }]}>
                        {tip.impact} impact
                      </Text>
                    </View>
                    <Text style={styles.tipField}>{tip.field}</Text>
                  </View>
                  <Text style={styles.tipSuggestion}>{tip.suggestion}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.refreshButton} onPress={handleLoad}>
                <Text style={styles.refreshText}>Refresh suggestions</Text>
                <ArrowRight size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.15)',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadow.ctaGlow,
  },
  generateButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  tipsList: {
    gap: theme.spacing.md,
  },
  tipCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  impactBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  impactText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  tipField: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  tipSuggestion: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  refreshText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
