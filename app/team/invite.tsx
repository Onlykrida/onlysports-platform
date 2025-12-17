import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement } from '@/hooks/team-management-context';
import { useUsers } from '@/hooks/users-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { Search, UserPlus, Send } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function InvitePlayers() {
  const { user } = useAuth();
  const { invitePlayer } = useTeamManagement();
  const { searchUsers } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingPlayerId, setInvitingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery, 'athlete');
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (playerId: string, playerName: string) => {
    if (!user) return;
    
    Alert.alert(
      'Invite Player',
      `Send invitation to ${playerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Invite',
          onPress: async () => {
            setInvitingPlayerId(playerId);
            const result = await invitePlayer(user.id, playerId, `${user.name} invited you to join the team!`);
            setInvitingPlayerId(null);
            
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Success', `Invitation sent to ${playerName}!`);
              setSearchResults(prev => prev.filter(p => p.id !== playerId));
            }
          },
        },
      ]
    );
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

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Players</Text>
          <Text style={styles.subtitle}>Search for athletes to add to your team</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes by name..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {searchQuery.trim().length < 2 ? (
            <View style={styles.emptyState}>
              <UserPlus size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>Enter at least 2 characters to search</Text>
            </View>
          ) : searchResults.length === 0 && !isSearching ? (
            <View style={styles.emptyState}>
              <UserPlus size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No athletes found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {searchResults.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <TouchableOpacity
                    style={styles.playerInfo}
                    onPress={() => router.push(`/user/${player.id}` as any)}
                  >
                    <Image
                      source={{
                        uri: player.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
                      }}
                      style={styles.playerAvatar}
                    />
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerRole}>
                        {player.sport || 'Athlete'} {player.position && `• ${player.position}`}
                      </Text>
                      {player.location && (
                        <Text style={styles.playerLocation}>📍 {player.location}</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.inviteButton,
                      invitingPlayerId === player.id && styles.invitingButton,
                    ]}
                    onPress={() => handleInvite(player.id, player.name)}
                    disabled={invitingPlayerId === player.id}
                  >
                    {invitingPlayerId === player.id ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <Send size={18} color={theme.colors.white} />
                    )}
                  </TouchableOpacity>
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
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  resultsContainer: {
    padding: theme.spacing.md,
  },
  playerCard: {
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
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  playerRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  playerLocation: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.glow,
  },
  invitingButton: {
    backgroundColor: theme.colors.textSecondary,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
