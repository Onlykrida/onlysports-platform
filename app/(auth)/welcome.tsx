import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { Globe2, Handshake, Rocket, Trophy, Sparkles } from 'lucide-react-native';
import Logo from '@/components/Logo';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const scale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const bgUri = useMemo(
    () =>
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1920&auto=format&fit=crop',
    [],
  );

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <ImageBackground
      source={{ uri: bgUri }}
      style={styles.container}
      resizeMode="cover"
      blurRadius={Platform.OS === 'web' ? 2 : 6}
      testID="welcome-bg"
    >
      <LinearGradient
        colors={['rgba(10, 10, 10, 0.80)', 'rgba(10, 10, 10, 0.90)', 'rgba(10, 10, 10, 0.97)']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Animated.View
              style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
            >
              <Logo size="large" showText={true} />
              <Text testID="tagline" style={styles.tagline}>
                YOUR TALENT DESERVES A STAGE.
              </Text>

              <View style={styles.aiBadge}>
                <Sparkles size={14} color={theme.colors.primary} />
                <Text style={styles.aiBadgeText}>Powered by AI</Text>
              </View>
            </Animated.View>

            <View style={styles.features}>
              <FeatureCard
                testID="feature-talent"
                icon={<Trophy color={theme.colors.secondary} size={22} />}
                title="Showcase Your Talent"
                subtitle="Upload reels, highlights, achievements"
              />
              <FeatureCard
                testID="feature-connect"
                icon={<Handshake color={theme.colors.secondary} size={22} />}
                title="Connect with Scouts & Teams"
                subtitle="Follow, endorse, and network"
              />
              <FeatureCard
                testID="feature-career"
                icon={<Rocket color={theme.colors.secondary} size={22} />}
                title="Build Your Career"
                subtitle="Sponsorships, exposure, contracts"
              />
              <FeatureCard
                testID="feature-global"
                icon={<Globe2 color={theme.colors.secondary} size={22} />}
                title="Global Opportunities"
                subtitle="Starting in India & Dubai, scaling worldwide"
              />
            </View>

            <View style={styles.buttons}>
              <Animated.View style={{ transform: [{ scale }] }}>
                <Pressable
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  onPress={() => router.push('/(auth)/role-selection' as any)}
                  accessibilityRole="button"
                  testID="cta-join"
                >
                  <LinearGradient
                    colors={[theme.colors.secondary, theme.colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>GET EARLY ACCESS</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Pressable
                onPress={() => router.push('/(auth)/login' as any)}
                accessibilityRole="button"
                testID="cta-login"
                style={styles.loginWrapper}
              >
                <Text style={styles.loginText}>Already have an account? </Text>
                <Text style={styles.loginLink}>Log in</Text>
              </Pressable>

              <Text style={styles.footer} testID="footer-trust">
                Trusted by athletes, coaches & scouts worldwide.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  testID?: string;
}

function FeatureCard({ icon, title, subtitle, testID }: FeatureCardProps) {
  return (
    <View style={styles.feature} testID={testID}>
      {icon}
      <View style={styles.featureTextWrap}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  header: { alignItems: 'center', marginTop: height * 0.04 },
  tagline: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.orange,
    textAlign: 'center',
    maxWidth: 700,
    fontWeight: theme.fontWeight.bold as any,
    letterSpacing: 3,
  },
  features: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureTextWrap: { marginLeft: theme.spacing.md, flex: 1 },
  featureTitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.black as any,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  featureSubtitle: {
    marginTop: 2,
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  buttons: { gap: theme.spacing.md },
  ctaGradient: {
    borderRadius: theme.borderRadius.lg ?? theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black as any,
    letterSpacing: 3,
  },
  loginWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  loginText: { color: 'rgba(255,255,255,0.8)' },
  loginLink: { color: theme.colors.secondary, fontWeight: theme.fontWeight.semibold as any },
  footer: {
    marginTop: theme.spacing.xs,
    color: '#30D158',
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontWeight: theme.fontWeight.bold as any,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  aiBadgeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold as any,
  },
});
