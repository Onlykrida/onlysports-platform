import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  showText?: boolean;
}

const SIZES = {
  small: { icon: 28, fontSize: 16, gap: 6 },
  medium: { icon: 40, fontSize: 22, gap: 8 },
  large: { icon: 56, fontSize: 30, gap: 12 },
  hero: { icon: 80, fontSize: 44, gap: 16 },
};

function LogoIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#30D158" />
          <Stop offset="1" stopColor="#248A3D" />
        </LinearGradient>
      </Defs>
      {/* Background circle */}
      <Circle cx="50" cy="50" r="48" fill="url(#logoGrad)" />
      {/* K letterform — bold athletic style */}
      <Path
        d="M32 25 L32 75 L42 75 L42 55 L58 75 L72 75 L52 52 L70 25 L56 25 L42 48 L42 25 Z"
        fill="#0a0a0a"
      />
    </Svg>
  );
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const dims = SIZES[size];

  return (
    <View style={styles.container}>
      <LogoIcon size={dims.icon} />
      {showText && (
        <View>
          <Text style={[styles.brandName, { fontSize: dims.fontSize }]}>
            Only<Text style={styles.brandAccent}>Krida</Text>
          </Text>
          {size === 'hero' && <Text style={styles.tagline}>Where talent meets opportunity</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: theme.colors.primary,
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
