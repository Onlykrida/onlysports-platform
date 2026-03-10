import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { theme } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ] as StyleProp<ViewStyle>}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8} // Slightly less opacity for better feedback
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost' 
              ? theme.colors.primary 
              : variant === 'secondary' || variant === 'success'
              ? theme.colors.black
              : theme.colors.white
          }
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              variantTextStyles[variant],
              sizeTextStyles[size],
              textStyle,
            ] as StyleProp<TextStyle>}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl, // Large, bold, rounded buttons
    gap: theme.spacing.sm,
  },
  // Electric Blue - energetic, professional, fresh (for buttons & highlights)
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow.electric, // Electric blue glow
  },
  // Neon Green - sporty, modern, dynamic (for success states or highlights)
  secondary: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadow.glow, // Neon green glow
  },
  // Crimson Red - passion, energy, urgency (great for CTAs or accents)
  accent: {
    backgroundColor: theme.colors.accent,
    ...theme.shadow.fire, // Crimson red glow
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.electric,
  },
  ghost: {
    backgroundColor: theme.colors.surface,
  },
  success: {
    backgroundColor: theme.colors.success,
    ...theme.shadow.glow,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    ...theme.shadow.fire,
  },
  small: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 52, // Larger for sporty feel
  },
  large: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
    minHeight: 60, // Large, bold buttons
  },
  xl: {
    paddingHorizontal: theme.spacing.xxl + theme.spacing.md,
    paddingVertical: theme.spacing.xl + theme.spacing.sm,
    minHeight: 68, // Extra large for main CTAs
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontWeight: theme.fontWeight.extrabold, // Bold sporty text
    textTransform: 'uppercase' as const,
    letterSpacing: 1, // More spacing for sporty feel
  },
  primaryText: {
    color: theme.colors.white, // White text on electric blue
  },
  secondaryText: {
    color: theme.colors.black, // Black text on neon green
  },
  accentText: {
    color: theme.colors.white, // White text on crimson red
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.text,
  },
  successText: {
    color: theme.colors.black, // Black text on neon green
  },
  dangerText: {
    color: theme.colors.white, // White text on crimson red
  },
  smallText: {
    fontSize: theme.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.fontSize.md,
  },
  largeText: {
    fontSize: theme.fontSize.lg,
  },
  xlText: {
    fontSize: theme.fontSize.xl,
  },
});

const variantStyles: Record<NonNullable<ButtonProps['variant']>, ViewStyle> = {
  primary: styles.primary,
  secondary: styles.secondary,
  accent: styles.accent,
  outline: styles.outline,
  ghost: styles.ghost,
  success: styles.success,
  danger: styles.danger,
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, ViewStyle> = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
  xl: styles.xl,
};

const variantTextStyles: Record<NonNullable<ButtonProps['variant']>, TextStyle> = {
  primary: styles.primaryText,
  secondary: styles.secondaryText,
  accent: styles.accentText,
  outline: styles.outlineText,
  ghost: styles.ghostText,
  success: styles.successText,
  danger: styles.dangerText,
};

const sizeTextStyles: Record<NonNullable<ButtonProps['size']>, TextStyle> = {
  small: styles.smallText,
  medium: styles.mediumText,
  large: styles.largeText,
  xl: styles.xlText,
};