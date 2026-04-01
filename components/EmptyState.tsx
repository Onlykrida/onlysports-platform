import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Inbox,
  MessageCircle,
  Bell,
  Briefcase,
  Search,
  Users,
  TrendingUp,
  Camera,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface EmptyStateProps {
  preset?: keyof typeof PRESETS;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCTA?: () => void;
}

const PRESETS = {
  feed: {
    icon: Users,
    title: 'Your feed is waiting',
    subtitle: 'Follow athletes and coaches to see their posts, highlights, and updates here.',
    ctaLabel: 'Discover Athletes',
  },
  messages: {
    icon: MessageCircle,
    title: 'Start a conversation',
    subtitle: 'Connect with scouts and coaches. Your first message could change your career.',
    ctaLabel: 'Find People',
  },
  notifications: {
    icon: Bell,
    title: 'All caught up',
    subtitle: 'Complete your profile to get noticed by scouts and receive notifications.',
    ctaLabel: 'Complete Profile',
  },
  opportunities: {
    icon: Briefcase,
    title: 'Opportunities loading...',
    subtitle: 'New tryouts, scholarships, and tournaments are posted daily. Check back soon!',
    ctaLabel: 'Browse All',
  },
  search: {
    icon: Search,
    title: 'Find your next star',
    subtitle: 'Search by sport, position, location, or name to discover talent.',
  },
  posts: {
    icon: Camera,
    title: 'Share your journey',
    subtitle: 'Post your first highlight, training clip, or achievement to get noticed.',
    ctaLabel: 'Create Post',
  },
  achievements: {
    icon: Trophy,
    title: 'Every win counts',
    subtitle: 'Add your achievements — even small victories show dedication to scouts.',
    ctaLabel: 'Add Achievement',
  },
  stats: {
    icon: TrendingUp,
    title: 'Track your progress',
    subtitle: "Take a fitness test or add your stats to show scouts what you're made of.",
    ctaLabel: 'Take Fitness Test',
  },
  generic: {
    icon: Inbox,
    title: 'Nothing here yet',
    subtitle: 'Check back soon for updates.',
  },
};

export default function EmptyState({
  preset = 'generic',
  icon,
  title,
  subtitle,
  ctaLabel,
  onCTA,
}: EmptyStateProps) {
  const config = PRESETS[preset];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displaySubtitle = subtitle || config.subtitle;
  const displayCTA = ctaLabel || ('ctaLabel' in config ? config.ctaLabel : undefined);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon size={36} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.subtitle}>{displaySubtitle}</Text>
      {displayCTA && onCTA && (
        <TouchableOpacity style={styles.ctaButton} onPress={onCTA} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{displayCTA}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxl,
    minHeight: 280,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    ...theme.shadow.ctaGlow,
  },
  ctaText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background,
  },
});
