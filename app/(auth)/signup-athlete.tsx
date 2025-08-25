import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, User as UserIcon, Dumbbell, Ruler, Calendar, MapPin, Medal, Quote } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';

export default function SignupAthleteScreen() {
  const { signup, updateProfile } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [achievements, setAchievements] = useState<string>('');
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
    if (!sport.trim()) newErrors.sport = 'Sport is required';
    if (!position.trim()) newErrors.position = 'Primary position is required';
    if (!bio.trim()) newErrors.bio = 'Bio is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup(email, password, name, 'athlete');
      if (result.error) {
        setErrors({ general: result.error });
        return;
      }
      const achArray = achievements
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a)
        .map((a, idx) => ({ id: `${idx}`, title: a, description: '', date: new Date().toISOString() }));
      const profileUpdates = {
        sport,
        position,
        bio,
        location: location || undefined,
        achievements: achArray,
        stats: { height, weight, dateOfBirth },
      } as const;
      const upd = await updateProfile({ ...profileUpdates });
      if (upd.error) {
        setErrors({ general: upd.error });
        return;
      }
      router.replace('/(tabs)/(home)');
    } catch (e) {
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
            <Text style={styles.title}>Create Athlete Profile</Text>
            <Text style={styles.subtitle}>Tell us about your game</Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} error={errors.name} icon={<UserIcon size={20} color={theme.colors.textSecondary} />} testID="athlete-name" />
            <Input label="Email" placeholder="name@email.com" value={email} onChangeText={setEmail} type="email" error={errors.email} icon={<Mail size={20} color={theme.colors.textSecondary} />} testID="athlete-email" />
            <Input label="Password" placeholder="Create a password" value={password} onChangeText={setPassword} type="password" error={errors.password} icon={<Lock size={20} color={theme.colors.textSecondary} />} testID="athlete-password" />
            <Input label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} type="password" error={errors.confirmPassword} icon={<Lock size={20} color={theme.colors.textSecondary} />} testID="athlete-confirm" />

            <Input label="Primary Sport" placeholder="e.g., Football" value={sport} onChangeText={setSport} error={errors.sport} icon={<Dumbbell size={20} color={theme.colors.textSecondary} />} testID="athlete-sport" />
            <Input label="Primary Position" placeholder="e.g., Striker" value={position} onChangeText={setPosition} error={errors.position} icon={<Medal size={20} color={theme.colors.textSecondary} />} testID="athlete-position" />

            <Input label="Bio" placeholder="Tell us about yourself" value={bio} onChangeText={setBio} error={errors.bio} multiline icon={<Quote size={20} color={theme.colors.textSecondary} />} testID="athlete-bio" />

            <Input label="Height" placeholder="e.g., 180 cm" value={height} onChangeText={setHeight} icon={<Ruler size={20} color={theme.colors.textSecondary} />} testID="athlete-height" />
            <Input label="Weight" placeholder="e.g., 75 kg" value={weight} onChangeText={setWeight} icon={<Ruler size={20} color={theme.colors.textSecondary} />} testID="athlete-weight" />
            <Input label="Date of Birth" placeholder="YYYY-MM-DD" value={dateOfBirth} onChangeText={setDateOfBirth} icon={<Calendar size={20} color={theme.colors.textSecondary} />} testID="athlete-dob" />
            <Input label="City, Country" placeholder="e.g., Mumbai, IN" value={location} onChangeText={setLocation} icon={<MapPin size={20} color={theme.colors.textSecondary} />} testID="athlete-location" />
            <Input label="Achievements" placeholder={'List your achievements (one per line)'} value={achievements} onChangeText={setAchievements} multiline icon={<Medal size={20} color={theme.colors.textSecondary} />} testID="athlete-achievements" />
          </View>

          <View style={styles.footer}>
            <Button title="Sign Up as Athlete" onPress={handleSignup} loading={loading} size="large" />
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
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