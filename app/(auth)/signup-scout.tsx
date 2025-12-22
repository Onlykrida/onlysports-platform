import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, User as UserIcon, Search, Building2, MapPin, Target, Users, Globe } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';

export default function SignupScoutScreen() {
  const { signup, updateProfile } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [regions, setRegions] = useState<string>('');
  const [sports, setSports] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [athleteLevels, setAthleteLevels] = useState<string>('');
  const [lookingFor, setLookingFor] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!sports.trim()) newErrors.sports = 'Sports focus is required';
    if (!bio.trim()) newErrors.bio = 'Bio is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup(email, password, name, 'scout');
      if (result.error) {
        setErrors({ general: result.error });
        return;
      }
      const upd = await updateProfile({ 
        bio, 
        sport: sports.split(',')[0]?.trim() || sports,
        location: location || undefined,
        roleSpecificData: {
          organization: organization || undefined,
          scoutingRegions: regions ? regions.split(',').map(r => r.trim()).filter(r => r) : [],
          athleteLevels: athleteLevels ? athleteLevels.split(',').map(l => l.trim()).filter(l => l) : [],
          lookingFor: lookingFor || undefined,
        },
      });
      if (upd.error) {
        setErrors({ general: upd.error });
        return;
      }
      router.replace('/');
    } catch (error) {
      console.error('Signup scout error:', error);
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
            <Text style={styles.title}>Create Scout Profile</Text>
            <Text style={styles.subtitle}>Find and recruit talent</Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} error={errors.name} icon={<UserIcon size={20} color={theme.colors.textSecondary} />} />
            <Input label="Email" placeholder="name@email.com" value={email} onChangeText={setEmail} type="email" error={errors.email} icon={<Mail size={20} color={theme.colors.textSecondary} />} />
            <Input label="Password" placeholder="Create a password" value={password} onChangeText={setPassword} type="password" error={errors.password} icon={<Lock size={20} color={theme.colors.textSecondary} />} />
            <Input label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} type="password" error={errors.confirmPassword} icon={<Lock size={20} color={theme.colors.textSecondary} />} />

            <Input label="Bio" placeholder="Tell us about your scouting background" value={bio} onChangeText={setBio} error={errors.bio} multiline icon={<UserIcon size={20} color={theme.colors.textSecondary} />} testID="scout-bio" />
            
            <Input label="Sports Focus" placeholder="e.g., Football, Cricket, Basketball" value={sports} onChangeText={setSports} error={errors.sports} icon={<Search size={20} color={theme.colors.textSecondary} />} testID="scout-sports" />
            <Input label="Organization" placeholder="Team/Agency/Club name" value={organization} onChangeText={setOrganization} icon={<Building2 size={20} color={theme.colors.textSecondary} />} testID="scout-org" />
            <Input label="Scouting Regions" placeholder="e.g., South Asia, Europe, North America" value={regions} onChangeText={setRegions} icon={<Globe size={20} color={theme.colors.textSecondary} />} testID="scout-regions" />
            <Input label="Athlete Levels" placeholder="e.g., High School, College, Professional" value={athleteLevels} onChangeText={setAthleteLevels} icon={<Users size={20} color={theme.colors.textSecondary} />} testID="scout-levels" />
            <Input label="What You're Looking For" placeholder="Describe ideal athlete qualities" value={lookingFor} onChangeText={setLookingFor} multiline icon={<Target size={20} color={theme.colors.textSecondary} />} testID="scout-looking" />
            <Input label="City, Country" placeholder="e.g., Dubai, AE" value={location} onChangeText={setLocation} icon={<MapPin size={20} color={theme.colors.textSecondary} />} testID="scout-location" />
          </View>

          <View style={styles.footer}>
            <Button title="Sign Up as Scout" onPress={handleSignup} loading={loading} size="large" />
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