import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement, TeamMember } from '@/hooks/team-management-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { Search, User, Edit, Trash2, Shield, Star } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function RosterManagement() {
  const { user } = useAuth();
  const { members, loadTeamMembers, removePlayer, updateMember, isLoading } = useTeamManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (user?.role === 'team') {
      loadTeamMembers(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    if (!user?.role || user.role !== 'team') return;
    setRefreshing(true);
    await loadTeamMembers(user.id);
    setRefreshing(false);
  };

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.playerName?.toLowerCase().includes(query) ||
      member.position?.toLowerCase().includes(query) ||
      member.jerseyNumber?.toString().includes(query)
    );
  });

  const handleRemovePlayer = (member: TeamMember) => {
    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove ${member.playerName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removePlayer(member.id);
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleUpdateRole = (member: TeamMember, newRole: 'player' | 'captain' | 'vice_captain') => {
    updateMember(member.id, { role: newRole });
  };

  if (!user || user.role !== 'team') {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorText}>Access denied</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (isLoading && members.length === 0) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const activeMembers = filteredMembers.filter(m => m.status === 'active');
  const inactiveMembers = filteredMembers.filter(m => m.status !== 'active');

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Players ({activeMembers.length})</Text>
            {activeMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Image
                    source={{
                      uri: member.playerAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
                    }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.playerName}</Text>
                      {member.role === 'captain' && (
                        <Star size={16} color={theme.colors.warning} fill={theme.colors.warning} />
                      )}
                      {member.role === 'vice_captain' && (
                        <Shield size={16} color={theme.colors.secondary} />
                      )}
                    </View>
                    <Text style={styles.memberPosition}>
                      {member.position || 'No position'} • #{member.jerseyNumber || '-'}
                    </Text>
                    <Text style={styles.memberDate}>
                      Joined {new Date(member.joinedDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      const roles: Array<'player' | 'captain' | 'vice_captain'> = ['player', 'captain', 'vice_captain'];
                      const roleLabels = ['Player', 'Captain', 'Vice Captain'];
                      Alert.alert(
                        'Change Role',
                        `Select role for ${member.playerName}`,
                        roles.map((role, idx) => ({
                          text: roleLabels[idx],
                          onPress: () => handleUpdateRole(member, role),
                        }))
                      );
                    }}
                  >
                    <Edit size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRemovePlayer(member)}
                  >
                    <Trash2 size={18} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeMembers.length === 0 && (
              <View style={styles.emptyState}>
                <User size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyText}>No active players</Text>
              </View>
            )}
          </View>

          {inactiveMembers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inactive Players ({inactiveMembers.length})</Text>
              {inactiveMembers.map((member) => (
                <View key={member.id} style={[styles.memberCard, styles.inactiveMemberCard]}>
                  <View style={styles.memberInfo}>
                    <Image
                      source={{
                        uri: member.playerAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
                      }}
                      style={[styles.memberAvatar, styles.inactiveAvatar]}
                    />
                    <View style={styles.memberDetails}>
                      <Text style={[styles.memberName, styles.inactiveText]}>
                        {member.playerName}
                      </Text>
                      <Text style={styles.memberPosition}>
                        {member.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inactiveMemberCard: {
    opacity: 0.6,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  inactiveAvatar: {
    opacity: 0.5,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  memberName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  inactiveText: {
    color: theme.colors.textSecondary,
  },
  memberPosition: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  memberDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});
