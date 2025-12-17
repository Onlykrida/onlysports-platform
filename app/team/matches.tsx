import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement } from '@/hooks/team-management-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { Plus, Trophy, Calendar, MapPin } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function MatchRecords() {
  const { user } = useAuth();
  const { matchRecords, loadMatches, addMatch, updateMatch, isLoading } = useTeamManagement();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    opponentName: '',
    matchDate: new Date(),
    location: '',
    matchType: 'friendly' as 'friendly' | 'league' | 'cup' | 'tournament',
    teamScore: '',
    opponentScore: '',
  });

  useEffect(() => {
    if (user?.role === 'team') {
      loadMatches(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    if (!user?.role || user.role !== 'team') return;
    setRefreshing(true);
    await loadMatches(user.id);
    setRefreshing(false);
  };

  const handleAddMatch = async () => {
    if (!user) return;
    if (!formData.opponentName.trim()) {
      Alert.alert('Error', 'Please enter opponent name');
      return;
    }

    const result = await addMatch({
      teamId: user.id,
      opponentName: formData.opponentName,
      matchDate: formData.matchDate,
      location: formData.location,
      matchType: formData.matchType,
      result: 'pending',
      teamScore: formData.teamScore ? parseInt(formData.teamScore) : undefined,
      opponentScore: formData.opponentScore ? parseInt(formData.opponentScore) : undefined,
    });

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setShowAddForm(false);
      setFormData({
        opponentName: '',
        matchDate: new Date(),
        location: '',
        matchType: 'friendly',
        teamScore: '',
        opponentScore: '',
      });
    }
  };

  const upcomingMatches = matchRecords.filter(m => new Date(m.matchDate) >= new Date() || m.result === 'pending');
  const pastMatches = matchRecords.filter(m => new Date(m.matchDate) < new Date() && m.result !== 'pending');

  if (!user || user.role !== 'team') {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorText}>Access denied</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (isLoading && matchRecords.length === 0) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {!showAddForm ? (
            <View style={styles.addButtonContainer}>
              <Button
                title="Schedule Match"
                onPress={() => setShowAddForm(true)}
                icon={<Plus size={18} color={theme.colors.black} />}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Schedule New Match</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Opponent Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.opponentName}
                onChangeText={(text) => setFormData({ ...formData, opponentName: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Location"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />

              <View style={styles.scoreInputs}>
                <TextInput
                  style={[styles.input, styles.scoreInput]}
                  placeholder="Team Score"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  value={formData.teamScore}
                  onChangeText={(text) => setFormData({ ...formData, teamScore: text })}
                />
                <Text style={styles.scoreSeparator}>-</Text>
                <TextInput
                  style={[styles.input, styles.scoreInput]}
                  placeholder="Opponent"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  value={formData.opponentScore}
                  onChangeText={(text) => setFormData({ ...formData, opponentScore: text })}
                />
              </View>

              <View style={styles.formButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setShowAddForm(false)}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Add Match"
                  onPress={handleAddMatch}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {upcomingMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Matches</Text>
              {upcomingMatches.map((match) => (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Trophy size={20} color={theme.colors.primary} />
                    <Text style={styles.matchType}>{match.matchType.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.matchOpponent}>vs {match.opponentName}</Text>
                  <View style={styles.matchDetails}>
                    <View style={styles.matchDetail}>
                      <Calendar size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.matchDetailText}>
                        {new Date(match.matchDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {match.location && (
                      <View style={styles.matchDetail}>
                        <MapPin size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.matchDetailText}>{match.location}</Text>
                      </View>
                    )}
                  </View>
                  {match.teamScore !== undefined && match.opponentScore !== undefined && (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.score}>
                        {match.teamScore} - {match.opponentScore}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {pastMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Matches</Text>
              {pastMatches.map((match) => (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Trophy size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.matchType}>{match.matchType.toUpperCase()}</Text>
                    {match.result && (
                      <View style={[
                        styles.resultBadge,
                        match.result === 'win' && styles.winBadge,
                        match.result === 'loss' && styles.lossBadge,
                        match.result === 'draw' && styles.drawBadge,
                      ]}>
                        <Text style={styles.resultText}>{match.result.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.matchOpponent}>vs {match.opponentName}</Text>
                  {match.teamScore !== undefined && match.opponentScore !== undefined && (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.score}>
                        {match.teamScore} - {match.opponentScore}
                      </Text>
                    </View>
                  )}
                  <View style={styles.matchDetails}>
                    <View style={styles.matchDetail}>
                      <Calendar size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.matchDetailText}>
                        {new Date(match.matchDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {match.location && (
                      <View style={styles.matchDetail}>
                        <MapPin size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.matchDetailText}>{match.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {matchRecords.length === 0 && (
            <View style={styles.emptyState}>
              <Trophy size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No matches recorded</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  addButtonContainer: {
    padding: theme.spacing.md,
  },
  formContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  scoreInput: {
    flex: 1,
    marginBottom: 0,
  },
  scoreSeparator: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  formButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  matchType: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    flex: 1,
  },
  matchOpponent: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  matchDetails: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  matchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  matchDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  score: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  resultBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  winBadge: {
    backgroundColor: theme.colors.success,
  },
  lossBadge: {
    backgroundColor: theme.colors.danger,
  },
  drawBadge: {
    backgroundColor: theme.colors.warning,
  },
  resultText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});
