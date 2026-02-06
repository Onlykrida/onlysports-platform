import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Platform,
  Animated,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { Globe2, Handshake, Rocket, Trophy } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  console.log('WelcomeScreen: render');
  const scale = useRef(new Animated.Value(1)).current;

  const bgUri = useMemo(() => (
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1920&auto=format&fit=crop'
  ), []);

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: Platform.OS !== 'web' }).start();
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
        colors={[
          'rgba(4, 11, 22, 0.85)',
          'rgba(4, 11, 22, 0.92)',
          'rgba(4, 11, 22, 0.96)',
        ]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: 'https://r2-pub.rork.com/generated-images/ad75ea0e-6774-4791-b63d-3c24452a4a85.png' }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <View style={styles.logoTextContainer}>
                  <Text accessibilityRole="header" testID="title-shadow" style={styles.logoShadow}>
                    OnlyKrida
                  </Text>
                  <Text testID="title" style={styles.logo}>OnlyKrida</Text>
                </View>
              </View>
              <Text testID="tagline" style={styles.tagline}>
                Where Athletes Get Discovered. Where Scouts Find Talent.
              </Text>
            </View>

            <View style={styles.features}>
              <FeatureCard
                testID="feature-talent"
                icon={<Trophy color={theme.colors.secondary} size={28} />}
                title="Showcase Your Talent"
                subtitle="Upload reels, highlights, achievements"
              />
              <FeatureCard
                testID="feature-connect"
                icon={<Handshake color={theme.colors.secondary} size={28} />}
                title="Connect with Scouts & Teams"
                subtitle="Follow, endorse, and network"
              />
              <FeatureCard
                testID="feature-career"
                icon={<Rocket color={theme.colors.secondary} size={28} />}
                title="Build Your Career"
                subtitle="Sponsorships, exposure, contracts"
              />
              <FeatureCard
                testID="feature-global"
                icon={<Globe2 color={theme.colors.secondary} size={28} />}
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
                    <Text style={styles.ctaText}>Get Started – Join Now</Text>
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
    padding: theme.spacing.lg,
  },
  header: { alignItems: 'center', marginTop: height * 0.08 },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginRight: theme.spacing.md,
  },
  logoTextContainer: {
    position: 'relative',
  },
  logoShadow: {
    position: 'absolute',
    top: 0,
    fontSize: 46,
    fontWeight: theme.fontWeight.extrabold as any,
    color: '#0ea5e9',
    opacity: 0.25,
    textShadowColor: '#22d3ee',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  logo: {
    fontSize: 46,
    fontWeight: theme.fontWeight.extrabold as any,
    color: theme.colors.white,
  },
  tagline: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    textAlign: 'center',
    maxWidth: 700,
  },
  features: { gap: theme.spacing.md, marginTop: theme.spacing.lg },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg ?? theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  featureTextWrap: { marginLeft: theme.spacing.md, flex: 1 },
  featureTitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold as any,
  },
  featureSubtitle: {
    marginTop: 2,
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  buttons: { gap: theme.spacing.md },
  ctaGradient: {
    borderRadius: theme.borderRadius.lg ?? theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
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
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
  },
});