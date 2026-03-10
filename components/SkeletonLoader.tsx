import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

type SkeletonShape = 'circle' | 'rect' | 'text';

interface SkeletonLoaderProps {
  width: number | `${number}%`;
  height: number;
  shape?: SkeletonShape;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  shape = 'rect',
  borderRadius,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const resolvedBorderRadius = (() => {
    if (borderRadius !== undefined) return borderRadius;
    switch (shape) {
      case 'circle':
        return typeof width === 'number' ? width / 2 : height / 2;
      case 'text':
        return theme.borderRadius.sm;
      case 'rect':
      default:
        return theme.borderRadius.md;
    }
  })();

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: resolvedBorderRadius,
          backgroundColor: theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};
