import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, User as UserIcon, Dumbbell, MapPin, Award, Quote } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';

export default function SignupTrainerScreen() {
  const { signup, updateProfile } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [specialties, setSpecialties] = useState<string>('');
  const [certifications, setCertifications] = useState<string>('');
  const [location, setLocation] = useState<string>('');
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
    if (!bio.trim()) newErrors.bio = 'Bio is required';
    if (!sport.trim()) newErrors.sport = 'Primary sport/focus is required';
    if (!specialties.trim()) newErrors.specialties = 'Specialties are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup(email, password, name, 'trainer');
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
          specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(s => s) : [],
          certifications: certifications ? certifications.split(',').map(c => c.trim()).filter(c => c) : [],
        },
      });
      if (upd.error) {
        setErrors({ general: upd.error });
        return;
      }
      router.replace('/');
    } catch (error) {
      console.error('Signup trainer error:', error);
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
            <Text style={styles.title}>Create Trainer Profile</Text>
            <Text style={styles.subtitle}>Show your expertise</Text>
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

            <Input label="Bio" placeholder="Tell us about your training background" value={bio} onChangeText={setBio} error={errors.bio} multiline icon={<Quote size={20} color={theme.colors.textSecondary} />} testID="trainer-bio" />
            
            <Input label="Primary Sport/Focus" placeholder="e.g., Strength Training, Conditioning" value={sport} onChangeText={setSport} error={errors.sport} icon={<Dumbbell size={20} color={theme.colors.textSecondary} />} testID="trainer-sport" />
            <Input label="Specialties" placeholder="e.g., Strength Training, Conditioning, Sports Rehab" value={specialties} onChangeText={setSpecialties} error={errors.specialties} icon={<Dumbbell size={20} color={theme.colors.textSecondary} />} testID="trainer-specialties" />
            <Input label="Certifications" placeholder="e.g., ACE, NSCA, ACSM (comma separated)" value={certifications} onChangeText={setCertifications} icon={<Award size={20} color={theme.colors.textSecondary} />} testID="trainer-certs" />
            <Input label="City, Country" placeholder="e.g., Bengaluru, IN" value={location} onChangeText={setLocation} icon={<MapPin size={20} color={theme.colors.textSecondary} />} testID="trainer-location" />
          </View>

          <View style={styles.footer}>
            <Button title="Sign Up as Trainer" onPress={handleSignup} loading={loading} size="large" />
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