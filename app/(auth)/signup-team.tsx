import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Building2, MapPin, Users, Trophy } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!teamName.trim()) newErrors.teamName = 'Team/Club name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!sport.trim()) newErrors.sport = 'Sport is required';
    if (!bio.trim()) newErrors.bio = 'Team description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
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
        bio, 
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Team/Club Profile</Text>
            <Text style={styles.subtitle}>Set up your organization</Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input label="Team/Club Name" placeholder="Your team name" value={teamName} onChangeText={setTeamName} error={errors.teamName} icon={<Building2 size={20} color={theme.colors.textSecondary} />} />
            <Input label="Email" placeholder="contact@club.com" value={email} onChangeText={setEmail} type="email" error={errors.email} icon={<Mail size={20} color={theme.colors.textSecondary} />} />
            <Input label="Password" placeholder="Create a password" value={password} onChangeText={setPassword} type="password" error={errors.password} icon={<Lock size={20} color={theme.colors.textSecondary} />} />
            <Input label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} type="password" error={errors.confirmPassword} icon={<Lock size={20} color={theme.colors.textSecondary} />} />

            <Input label="Team Description" placeholder="Tell us about your team/club" value={bio} onChangeText={setBio} error={errors.bio} multiline icon={<Building2 size={20} color={theme.colors.textSecondary} />} testID="team-bio" />
            
            <Input label="Sport" placeholder="e.g., Cricket" value={sport} onChangeText={setSport} error={errors.sport} icon={<Trophy size={20} color={theme.colors.textSecondary} />} testID="team-sport" />
            <Input label="League/Competition" placeholder="e.g., ISL" value={league} onChangeText={setLeague} icon={<Users size={20} color={theme.colors.textSecondary} />} testID="team-league" />
            <Input label="Founded Year" placeholder="e.g., 2010" value={founded} onChangeText={setFounded} icon={<Trophy size={20} color={theme.colors.textSecondary} />} testID="team-founded" />
            <Input label="Home Venue" placeholder="e.g., Stadium Name" value={homeVenue} onChangeText={setHomeVenue} icon={<Building2 size={20} color={theme.colors.textSecondary} />} testID="team-venue" />
            <Input label="City, Country" placeholder="e.g., Pune, IN" value={location} onChangeText={setLocation} icon={<MapPin size={20} color={theme.colors.textSecondary} />} testID="team-location" />
          </View>

          <View style={styles.footer}>
            <Button title="Sign Up as Team/Club" onPress={handleSignup} loading={loading} size="large" />
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? <Text style={styles.loginTextBold}>Sign In</Text></Text>
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
  scrollContent: { flexGrow: 1, padding: theme.spacing.lg },
  header: { marginBottom: theme.spacing.xl },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  form: { flex: 1 },
  footer: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
  loginLink: { alignItems: 'center', padding: theme.spacing.md },
  loginText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  loginTextBold: { fontWeight: theme.fontWeight.semibold, color: theme.colors.primary },
  errorContainer: { backgroundColor: '#fee2e2', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorText: { color: '#dc2626', fontSize: theme.fontSize.sm, textAlign: 'center' },
});