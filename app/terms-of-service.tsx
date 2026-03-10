import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service', headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.updated}>Last updated: March 2026</Text>

          <Text style={styles.heading}>1. Acceptance of Terms</Text>
          <Text style={styles.body}>
            By creating an account or using OnlySports, you agree to these Terms of Service. If you do not agree, do not use the app.
          </Text>

          <Text style={styles.heading}>2. Eligibility</Text>
          <Text style={styles.body}>
            You must be at least 13 years old to use OnlySports. Users between 13-17 must have parental consent. You must provide accurate information during registration.
          </Text>

          <Text style={styles.heading}>3. User Accounts</Text>
          <Text style={styles.body}>
            You are responsible for maintaining the security of your account. You must not share your login credentials. You are responsible for all activity under your account. Notify us immediately of any unauthorized access.
          </Text>

          <Text style={styles.heading}>4. Acceptable Use</Text>
          <Text style={styles.body}>
            You agree not to: post false or misleading information, harass or bully other users, post inappropriate or offensive content, impersonate other athletes or organizations, use the platform for illegal activities, spam or send unsolicited messages, or attempt to manipulate scouting recommendations.
          </Text>

          <Text style={styles.heading}>5. Content Ownership</Text>
          <Text style={styles.body}>
            You retain ownership of content you post (photos, videos, text). By posting, you grant OnlySports a non-exclusive license to display and distribute your content within the platform. You must have rights to all content you upload.
          </Text>

          <Text style={styles.heading}>6. Opportunities & Connections</Text>
          <Text style={styles.body}>
            OnlySports facilitates connections between athletes, scouts, coaches, and teams. We do not guarantee the accuracy of opportunity listings or the outcome of any connections made. Verify all opportunities independently.
          </Text>

          <Text style={styles.heading}>7. Termination</Text>
          <Text style={styles.body}>
            We may suspend or terminate accounts that violate these terms. You may delete your account at any time through the Settings page.
          </Text>

          <Text style={styles.heading}>8. Limitation of Liability</Text>
          <Text style={styles.body}>
            OnlySports is provided "as is" without warranties. We are not liable for decisions made based on platform information, connections that don't result in opportunities, or content posted by other users.
          </Text>

          <Text style={styles.heading}>9. Contact</Text>
          <Text style={styles.body}>
            For questions about these terms, contact us at legal@onlysports.app.
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
  heading: { fontSize: 17, fontWeight: '600', color: theme.colors.text, marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 },
});
