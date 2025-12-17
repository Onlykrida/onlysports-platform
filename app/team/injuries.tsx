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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement } from '@/hooks/team-management-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { Plus, AlertCircle, Calendar } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function InjuryManagement() {
  const { user } = useAuth();
  const { members, injuryRecords, loadTeamMembers, loadInjuries, addInjury, updateInjury, isLoading } = useTeamManagement();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    injuryType: '',
    severity: 'moderate' as 'minor' | 'moderate' | 'severe',
    description: '',
    expectedRecoveryDays: '',
  });

  useEffect(() => {
    if (user?.role === 'team') {
      loadTeamMembers(user.id);
      loadInjuries(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    if (!user?.role || user.role !== 'team') return;
    setRefreshing(true);
    await Promise.all([
      loadTeamMembers(user.id),
      loadInjuries(user.id),
    ]);
    setRefreshing(false);
  };

  const handleAddInjury = async () => {
    if (!user) return;
    if (!formData.playerId || !formData.injuryType.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const expectedRecoveryDate = formData.expectedRecoveryDays
      ? new Date(Date.now() + parseInt(formData.expectedRecoveryDays) * 24 * 60 * 60 * 1000)
      : undefined;

    const result = await addInjury({
      teamId: user.id,
      playerId: formData.playerId,
      injuryType: formData.injuryType,
      injuryDate: new Date(),
      severity: formData.severity,
      status: 'active',
      description: formData.description,
      expectedRecoveryDate,
    });

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setShowAddForm(false);
      setFormData({
        playerId: '',
        injuryType: '',
        severity: 'moderate',
        description: '',
        expectedRecoveryDays: '',
      });
    }
  };

  const handleUpdateStatus = (injuryId: string, newStatus: 'active' | 'recovering' | 'recovered') => {
    updateInjury(injuryId, { 
      status: newStatus,
      actualRecoveryDate: newStatus === 'recovered' ? new Date() : undefined,
    });
  };

  const activeInjuries = injuryRecords.filter(i => i.status === 'active');
  const recoveringInjuries = injuryRecords.filter(i => i.status === 'recovering');
  const recoveredInjuries = injuryRecords.filter(i => i.status === 'recovered');
  const activeMembers = members.filter(m => m.status === 'active');

  if (!user || user.role !== 'team') {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorText}>Access denied</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (isLoading && injuryRecords.length === 0) {
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
                title="Report Injury"
                onPress={() => setShowAddForm(true)}
                icon={<Plus size={18} color={theme.colors.black} />}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Report New Injury</Text>
              
              <Text style={styles.label}>Select Player</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerSelector}>
                {activeMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.playerOption,
                      formData.playerId === member.playerId && styles.selectedPlayer,
                    ]}
                    onPress={() => setFormData({ ...formData, playerId: member.playerId })}
                  >
                    <Image
                      source={{ uri: member.playerAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                      style={styles.playerAvatar}
                    />
                    <Text style={styles.playerName}>{member.playerName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Injury Type (e.g., Ankle Sprain)"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.injuryType}
                onChangeText={(text) => setFormData({ ...formData, injuryType: text })}
              />

              <Text style={styles.label}>Severity</Text>
              <View style={styles.severityButtons}>
                {(['minor', 'moderate', 'severe'] as const).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.severityButton,
                      formData.severity === severity && styles.selectedSeverity,
                      severity === 'minor' && formData.severity === severity && styles.minorSeverity,
                      severity === 'moderate' && formData.severity === severity && styles.moderateSeverity,
                      severity === 'severe' && formData.severity === severity && styles.severeSeverity,
                    ]}
                    onPress={() => setFormData({ ...formData, severity })}
                  >
                    <Text style={[
                      styles.severityText,
                      formData.severity === severity && styles.selectedSeverityText,
                    ]}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Expected Recovery (days)"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="number-pad"
                value={formData.expectedRecoveryDays}
                onChangeText={(text) => setFormData({ ...formData, expectedRecoveryDays: text })}
              />

              <View style={styles.formButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setShowAddForm(false)}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Report"
                  onPress={handleAddInjury}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {activeInjuries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Injuries</Text>
              {activeInjuries.map((injury) => (
                <View key={injury.id} style={[styles.injuryCard, styles.activeCard]}>
                  <View style={styles.injuryHeader}>
                    <View style={styles.injuryPlayerInfo}>
                      <Image
                        source={{ uri: injury.playerAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                        style={styles.injuryAvatar}
                      />
                      <View>
                        <Text style={styles.injuryPlayerName}>{injury.playerName}</Text>
                        <Text style={styles.injuryType}>{injury.injuryType}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.severityBadge,
                      injury.severity === 'minor' && styles.minorBadge,
                      injury.severity === 'moderate' && styles.moderateBadge,
                      injury.severity === 'severe' && styles.severeBadge,
                    ]}>
                      <Text style={styles.severityBadgeText}>
                        {injury.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {injury.description && (
                    <Text style={styles.injuryDescription}>{injury.description}</Text>
                  )}

                  <View style={styles.injuryDates}>
                    <View style={styles.injuryDate}>
                      <Calendar size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.injuryDateText}>
                        Injury: {new Date(injury.injuryDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {injury.expectedRecoveryDate && (
                      <View style={styles.injuryDate}>
                        <Calendar size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.injuryDateText}>
                          Expected: {new Date(injury.expectedRecoveryDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.statusButtons}>
                    <Button
                      title="Mark Recovering"
                      onPress={() => handleUpdateStatus(injury.id, 'recovering')}
                      variant="outline"
                      style={{ flex: 1 }}
                      textStyle={{ fontSize: theme.fontSize.sm }}
                    />
                    <Button
                      title="Mark Recovered"
                      onPress={() => handleUpdateStatus(injury.id, 'recovered')}
                      style={{ flex: 1 }}
                      textStyle={{ fontSize: theme.fontSize.sm }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {recoveringInjuries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recovering</Text>
              {recoveringInjuries.map((injury) => (
                <View key={injury.id} style={[styles.injuryCard, styles.recoveringCard]}>
                  <View style={styles.injuryHeader}>
                    <View style={styles.injuryPlayerInfo}>
                      <Image
                        source={{ uri: injury.playerAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                        style={styles.injuryAvatar}
                      />
                      <View>
                        <Text style={styles.injuryPlayerName}>{injury.playerName}</Text>
                        <Text style={styles.injuryType}>{injury.injuryType}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statusButtons}>
                    <Button
                      title="Mark Recovered"
                      onPress={() => handleUpdateStatus(injury.id, 'recovered')}
                      style={{ flex: 1 }}
                      textStyle={{ fontSize: theme.fontSize.sm }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {recoveredInjuries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recovered</Text>
              {recoveredInjuries.slice(0, 5).map((injury) => (
                <View key={injury.id} style={[styles.injuryCard, styles.recoveredCard]}>
                  <View style={styles.injuryPlayerInfo}>
                    <Image
                      source={{ uri: injury.playerAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                      style={styles.injuryAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.injuryPlayerName}>{injury.playerName}</Text>
                      <Text style={styles.injuryType}>{injury.injuryType}</Text>
                      {injury.actualRecoveryDate && (
                        <Text style={styles.recoveredDate}>
                          Recovered: {new Date(injury.actualRecoveryDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {injuryRecords.length === 0 && (
            <View style={styles.emptyState}>
              <AlertCircle size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No injuries recorded</Text>
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
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  playerSelector: {
    marginBottom: theme.spacing.md,
  },
  playerOption: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectedPlayer: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: theme.spacing.xs,
  },
  playerName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  severityButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  selectedSeverity: {
    borderWidth: 2,
  },
  minorSeverity: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  moderateSeverity: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  severeSeverity: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  severityText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  selectedSeverityText: {
    color: theme.colors.white,
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
  injuryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  recoveringCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  recoveredCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    opacity: 0.7,
  },
  injuryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  injuryPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  injuryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  injuryPlayerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  injuryType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  minorBadge: {
    backgroundColor: theme.colors.success,
  },
  moderateBadge: {
    backgroundColor: theme.colors.warning,
  },
  severeBadge: {
    backgroundColor: theme.colors.danger,
  },
  severityBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  injuryDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  injuryDates: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  injuryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  injuryDateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  recoveredDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    marginTop: 2,
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
