import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { theme } from '@/constants/theme';

interface PostSkeletonProps {
  count?: number;
  testID?: string;
}

const pulseConfig = {
  min: 0.4,
  max: 0.9,
  duration: 1200,
};

const PostSkeleton: React.FC<PostSkeletonProps> = ({ count = 3, testID }) => {
  const opacity = useRef(new Animated.Value(pulseConfig.min)).current;

  useEffect(() => {
    console.log('[PostSkeleton] mounting with count:', count);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: pulseConfig.max,
          duration: pulseConfig.duration,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: pulseConfig.min,
          duration: pulseConfig.duration,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      console.log('[PostSkeleton] unmounting');
      animation.stop();
    };
  }, [count, opacity]);

  const placeholders = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <View style={styles.wrapper} testID={testID ?? 'post-skeleton-wrapper'}>
      {placeholders.map((_, index) => (
        <View key={`post-skeleton-${index}`} style={styles.card} testID={`post-skeleton-${index}`}>
          <View style={styles.header}>
            <Animated.View style={[styles.avatar, { opacity }]} />
            <View style={styles.headerText}>
              <Animated.View style={[styles.title, { opacity }]} />
              <Animated.View style={[styles.subtitle, { opacity }]} />
            </View>
          </View>
          <Animated.View style={[styles.body, { opacity }]} />
          <Animated.View style={[styles.media, { opacity }]} />
          <View style={styles.actions}>
            {['power', 'comments', 'share'].map((action) => (
              <Animated.View
                key={`${action}-${index}`}
                style={[styles.action, { opacity }]}
                testID={`post-skeleton-${action}-${index}`}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default React.memo(PostSkeleton);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.electric,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    height: 16,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceLight,
    width: '60%',
  },
  subtitle: {
    height: 12,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceLight,
    width: '40%',
  },
  body: {
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
  },
  media: {
    height: 220,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceLight,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    flex: 1,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceLight,
    marginHorizontal: theme.spacing.xs,
  },
});
