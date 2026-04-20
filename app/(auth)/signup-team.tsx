import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Mail,
  Lock,
  Building2,
  MapPin,
  Users,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StepIndicator } from '@/components/StepIndicator';
import { useAuth } from '@/hooks/auth-context';

export default function SignupTeamScreen() {
  const { signup, updateProfile } = useAuth();
  const [teamName, setTeamName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [league, setLeague] = useState<string>('');
  const [founded, setFounded] = useState<string>('');
  const [homeVenue, setHomeVenue] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState<boolean>(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!teamName.trim()) newErrors.teamName = 'Team/Club name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!sport.trim()) newErrors.sport = 'Sport is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (skipOptional = false) => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup(email, password, teamName, 'team');
      if (result.error) {
        setErrors({ general: result.error });
        return;
      }
      const upd = await updateProfile({
        sport,
        bio: bio || undefined,
        location: location || undefined,
        stats: {},
        roleSpecificData: {
          league: league || undefined,
          founded: founded || undefined,
          homeVenue: homeVenue || undefined,
        },
      });
      if (upd.error) {
        setErrors({ general: upd.error });
        return;
      }
      router.replace('/');
    } catch (error) {
      console.error('Signup team error:', error);
      setErrors({ general: 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <StepIndicator currentStep={2} totalSteps={2} />

          <View style={styles.header}>
            <Text style={styles.title}>Almost there!</Text>
            <Text style={styles.subtitle}>Set up your team and start building your legacy</Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="Team/Club Name"
              placeholder="Your team name"
              value={teamName}
              onChangeText={setTeamName}
              error={errors.teamName}
              icon={<Building2 size={20} color={theme.colors.textSecondary} />}
            />
            <Input
              label="Email"
              placeholder="contact@club.com"
              value={email}
              onChangeText={setEmail}
              type="email"
              error={errors.email}
              icon={<Mail size={20} color={theme.colors.textSecondary} />}
            />
            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              type="password"
              error={errors.password}
              icon={<Lock size={20} color={theme.colors.textSecondary} />}
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              type="password"
              error={errors.confirmPassword}
              icon={<Lock size={20} color={theme.colors.textSecondary} />}
            />
            <Input
              label="Sport"
              placeholder="e.g., Cricket"
              value={sport}
              onChangeText={setSport}
              error={errors.sport}
              icon={<Trophy size={20} color={theme.colors.textSecondary} />}
              testID="team-sport"
            />
          </View>

          {!showOptional && (
            <TouchableOpacity style={styles.skipButton} onPress={() => handleSignup(true)}>
              <Text style={styles.skipText}>Skip for now &#8594;</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.optionalToggle}
            onPress={() => setShowOptional(!showOptional)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionalToggleText}>Add more details (optional)</Text>
            {showOptional ? (
              <ChevronUp size={20} color={theme.colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showOptional && (
            <View style={styles.form}>
              <Input
                label="Team Description"
                placeholder="Tell us about your team/club"
                value={bio}
                onChangeText={setBio}
                multiline
                icon={<Building2 size={20} color={theme.colors.textSecondary} />}
                testID="team-bio"
              />
              <Input
                label="League/Competition"
                placeholder="e.g., ISL"
                value={league}
                onChangeText={setLeague}
                icon={<Users size={20} color={theme.colors.textSecondary} />}
                testID="team-league"
              />
              <Input
                label="Founded Year"
                placeholder="e.g., 2010"
                value={founded}
                onChangeText={setFounded}
                icon={<Trophy size={20} color={theme.colors.textSecondary} />}
                testID="team-founded"
              />
              <Input
                label="Home Venue"
                placeholder="e.g., Stadium Name"
                value={homeVenue}
                onChangeText={setHomeVenue}
                icon={<Building2 size={20} color={theme.colors.textSecondary} />}
                testID="team-venue"
              />
              <Input
                label="City, Country"
                placeholder="e.g., Pune, IN"
                value={location}
                onChangeText={setLocation}
                icon={<MapPin size={20} color={theme.colors.textSecondary} />}
                testID="team-location"
              />
            </View>
          )}

          <View style={styles.footer}>
            <Button
              title="Sign Up as Team/Club"
              onPress={() => handleSignup(false)}
              loading={loading}
              size="large"
            />
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login' as any)}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: theme.spacing.lg, paddingBottom: 120 },
  header: { marginBottom: theme.spacing.xl },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  form: {},
  footer: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
  loginLink: { alignItems: 'center', padding: theme.spacing.md },
  loginText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  loginTextBold: { fontWeight: theme.fontWeight.semibold, color: theme.colors.primary },
  errorContainer: {
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: { color: theme.colors.danger, fontSize: theme.fontSize.sm, textAlign: 'center' },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  skipText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  optionalToggleText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
});
