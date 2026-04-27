import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.updated}>Last updated: March 2026</Text>

          <Text style={styles.heading}>1. Information We Collect</Text>
          <Text style={styles.body}>
            We collect information you provide directly: name, email, profile photo, sport,
            position, bio, location, and performance statistics. We also collect usage data
            including app interactions, device information, and analytics events.
          </Text>

          <Text style={styles.heading}>2. How We Use Your Information</Text>
          <Text style={styles.body}>
            We use your information to: provide and improve our services, connect athletes with
            scouts and coaches, personalize your experience, send notifications about relevant
            opportunities, and analyze app usage to improve features.
          </Text>

          <Text style={styles.heading}>3. Information Sharing</Text>
          <Text style={styles.body}>
            Your public profile (name, sport, position, achievements) is visible to other users.
            Private messages are only visible to participants. We do not sell your personal data to
            third parties. We may share anonymized analytics data.
          </Text>

          <Text style={styles.heading}>4. Data Storage & Security</Text>
          <Text style={styles.body}>
            Your data is stored securely using Supabase with row-level security policies. We use
            encryption in transit (TLS) and implement access controls to protect your information.
            Media files are stored in secure cloud storage.
          </Text>

          <Text style={styles.heading}>5. Your Rights</Text>
          <Text style={styles.body}>
            You can: access and update your profile information at any time, delete your account and
            associated data, export your data, opt out of non-essential notifications, and request
            information about data we hold about you.
          </Text>

          <Text style={styles.heading}>6. Data Retention</Text>
          <Text style={styles.body}>
            We retain your data while your account is active. When you delete your account, we
            remove your personal information. Some anonymized data may be retained for analytics
            purposes.
          </Text>

          <Text style={styles.heading}>7. Children's Privacy</Text>
          <Text style={styles.body}>
            OnlySports is intended for users aged 13 and older. We do not knowingly collect
            information from children under 13. If we learn we have collected such data, we will
            delete it promptly.
          </Text>

          <Text style={styles.heading}>8. Contact Us</Text>
          <Text style={styles.body}>
            If you have questions about this privacy policy, please contact us at
            privacy@onlykrida.app.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  updated: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 24 },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  body: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 },
});
