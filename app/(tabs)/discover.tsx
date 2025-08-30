import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, MapPin, UserPlus, UserCheck, Bell, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { sports } from '@/mocks/data';
import { SearchResult, User } from '@/types';
import { useSearch } from '@/hooks/search-context';
import { useFollow } from '@/hooks/follow-context';
import { useNotifications } from '@/hooks/notifications-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';

export default function DiscoverScreen() {
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [hasInitializedFilters, setHasInitializedFilters] = useState<boolean>(false);

  const { 
    searchResults, 
    isSearching, 
    searchUsers, 
    clearSearch,
    addRecentSearch,
    recentSearches 
  } = useSearch();
  
  const { followUser, unfollowUser, isFollowing } = useFollow();
  const { unreadCount } = useNotifications();
  const { user: currentUser } = useAuth();

  // Initialize filters based on current user's profile
  useEffect(() => {
    if (currentUser && !hasInitializedFilters) {
      console.log('Discover: Initializing filters based on user profile', {
        userRole: currentUser.role,
        userSport: currentUser.sport
      });
      
      // Set sport filter based on user's sport
      if (currentUser.sport) {
        setSelectedSport(currentUser.sport);
      }
      
      // Set role filter based on user's role and what they might be looking for
      if (currentUser.role === 'scout') {
        // Scouts typically look for athletes
        setSelectedRole('athlete');
      } else if (currentUser.role === 'athlete') {
        // Athletes might look for scouts, coaches, or trainers
        setSelectedRole('scout');
      } else if (currentUser.role === 'coach') {
        // Coaches might look for athletes or other coaches
        setSelectedRole('athlete');
      } else if (currentUser.role === 'trainer') {
        // Trainers might look for athletes
        setSelectedRole('athlete');
      }
      // For other roles, keep it as null (show all)
      
      setHasInitializedFilters(true);
    }
  }, [currentUser, hasInitializedFilters]);

  const getErrorMessage = useCallback((error: unknown): string => {
    try {
      if (!error) return 'Unknown error';
      if (typeof error === 'string') return error;
      if (error instanceof Error) return error.message;
      const maybe = (error as { message?: string; error_description?: string; details?: string }).message
        ?? (error as any).error_description
        ?? (error as any).details;
      return typeof maybe === 'string' && maybe.length > 0 ? maybe : JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }, []);

  const { users: cachedUsers, isLoading: usersIsLoading, refreshUsers } = useUsers();

  const loadUsers = useCallback(async () => {
    console.log('Discover: loadUsers start', { isSupabaseConfigured, currentUserId: currentUser?.id });
    setUsersError(null);

    try {
      setIsLoadingUsers(true);
      if (!isSupabaseConfigured) {
        console.log('Discover: using cached users only');
        setUsers(cachedUsers);
        return;
      }

      await refreshUsers();
      console.log('Discover: refreshUsers requested');
    } catch (error) {
      const msg = getErrorMessage(error);
      console.error('Failed to load users:', msg, error);
      setUsersError(msg);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentUser?.id, getErrorMessage, cachedUsers, refreshUsers]);

  const didLoadRef = useRef<boolean>(false);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    console.log('Discover: trigger initial loadUsers');
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    console.log('Discover: sync local users with cachedUsers', { cachedCount: cachedUsers.length });
    setUsers(cachedUsers);
  }, [cachedUsers]);

  const filteredUsers = useMemo(() => {
    // First deduplicate users by ID and exclude current user
    const uniqueUsers = users.reduce((acc, user) => {
      if (!acc.has(user.id) && user.id !== currentUser?.id) {
        acc.set(user.id, user);
      }
      return acc;
    }, new Map<string, User>());
    
    const deduplicatedUsers = Array.from(uniqueUsers.values());
    
    return deduplicatedUsers.filter(user => {
      const q = localSearchQuery.toLowerCase();
      const matchesSearch = user.name.toLowerCase().includes(q) ||
        (user.sport ? user.sport.toLowerCase().includes(q) : false) ||
        (user.bio ? user.bio.toLowerCase().includes(q) : false) ||
        user.role.toLowerCase().includes(q);
      const matchesSport = !selectedSport || user.sport === selectedSport;
      const matchesRole = !selectedRole || user.role === selectedRole;
      
      // Additional smart filtering based on current user's role
      let isRelevantMatch = true;
      if (currentUser) {
        // If current user is a scout, prioritize athletes in their sport
        if (currentUser.role === 'scout' && user.role === 'athlete') {
          const scoutData = currentUser.roleSpecificData;
          if (scoutData?.scoutingRegions && user.location) {
            // Check if user's location matches scout's regions
            const matchesRegion = scoutData.scoutingRegions.some(region => 
              user.location?.toLowerCase().includes(region.toLowerCase())
            );
            if (!matchesRegion && scoutData.scoutingRegions.length > 0) {
              isRelevantMatch = false;
            }
          }
        }
      }
      
      return matchesSearch && matchesSport && matchesRole && isRelevantMatch;
    });
  }, [users, localSearchQuery, selectedSport, selectedRole, currentUser]);

  const isInitialLoading = useMemo(() => {
    return (isLoadingUsers || usersIsLoading) && users.length === 0 && !usersError;
  }, [isLoadingUsers, usersIsLoading, users.length, usersError]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchQuery.trim()) {
        searchUsers(localSearchQuery);
        setShowSearchResults(true);
      } else {
        setShowSearchResults(false);
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchUsers, clearSearch]);

  const handleSearchSubmit = () => {
    if (localSearchQuery.trim()) {
      addRecentSearch(localSearchQuery);
    }
  };

  const handleFollowToggle = useCallback(async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  }, [isFollowing, unfollowUser, followUser]);

  const renderUser = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userCard}
      testID={`discover-user-${item.id}`}
      onPress={() => router.push({
        pathname: '/user/[id]' as any,
        params: { id: item.id }
      })}
    >
      <Image 
        source={{ uri: item.avatar || 'https://via.placeholder.com/80' }} 
        style={styles.userImage} 
      />
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.verified && <Text style={styles.verified}>✓</Text>}
        </View>
        <Text style={styles.userRole}>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}{item.sport ? ` • ${item.sport}` : ''}</Text>
        {item.position && (
          <Text style={styles.userPosition}>{item.position}</Text>
        )}
        {item.location && (
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <MapPin size={12} color={theme.colors.textSecondary} />
              <Text style={styles.statText}>{item.location}</Text>
            </View>
          </View>
        )}
        {item.bio && (
          <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
        )}
        {renderRoleSpecificInfo(item)}
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.messageButtonSmall}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: '/chat/[id]' as any,
                params: { 
                  id: item.id,
                  name: item.name,
                  avatar: item.avatar || '',
                  role: item.role,
                }
              });
            }}
          >
            <MessageCircle size={16} color={theme.colors.primary} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followButtonSmall, isFollowing(item.id) && styles.followingButtonSmall]}
            onPress={(e) => {
              e.stopPropagation();
              handleFollowToggle(item.id);
            }}
          >
            {isFollowing(item.id) ? (
              <UserCheck size={16} color={theme.colors.white} />
            ) : (
              <UserPlus size={16} color={theme.colors.primary} />
            )}
            <Text style={[styles.followButtonText, isFollowing(item.id) && styles.followingButtonText]}>
              {isFollowing(item.id) ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [isFollowing, handleFollowToggle]);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => router.push({
        pathname: '/user/[id]' as any,
        params: { id: item.id }
      })}
    >
      <Image 
        source={{ uri: item.avatar || 'https://via.placeholder.com/40' }} 
        style={styles.searchResultAvatar} 
      />
      <View style={styles.searchResultInfo}>
        <View style={styles.searchResultHeader}>
          <Text style={styles.searchResultName}>{item.name}</Text>
          {item.verified && <Text style={styles.verified}>✓</Text>}
        </View>
        {item.subtitle && (
          <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <View style={styles.searchResultActions}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: '/chat/[id]' as any,
              params: { 
                id: item.id,
                name: item.name,
                avatar: item.avatar || '',
                role: item.subtitle || 'User',
              }
            });
          }}
        >
          <MessageCircle size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.followButton}
          onPress={(e) => {
            e.stopPropagation();
            handleFollowToggle(item.id);
          }}
        >
          {isFollowing(item.id) ? (
            <UserCheck size={20} color={theme.colors.primary} />
          ) : (
            <UserPlus size={20} color={theme.colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [isFollowing, handleFollowToggle]);

  const renderRecentSearch = useCallback((query: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentSearchItem}
      onPress={() => {
        setLocalSearchQuery(query);
        searchUsers(query);
        setShowSearchResults(true);
      }}
    >
      <Search size={16} color={theme.colors.textSecondary} />
      <Text style={styles.recentSearchText}>{query}</Text>
    </TouchableOpacity>
  ), [searchUsers]);

  const renderRoleSpecificInfo = (user: User) => {
    if (!user.roleSpecificData) return null;

    switch (user.role) {
      case 'athlete':
        const athleteData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {athleteData.currentTeam && (
              <Text style={styles.roleSpecificText}>🏆 {athleteData.currentTeam}</Text>
            )}
            {(athleteData.height || athleteData.weight) && (
              <Text style={styles.roleSpecificText}>
                📏 {[athleteData.height, athleteData.weight].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
        );
      case 'scout':
        const scoutData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {scoutData.organization && (
              <Text style={styles.roleSpecificText}>🏢 {scoutData.organization}</Text>
            )}
            {scoutData.scoutingRegions && scoutData.scoutingRegions.length > 0 && (
              <Text style={styles.roleSpecificText}>🌍 {scoutData.scoutingRegions.slice(0, 2).join(', ')}</Text>
            )}
          </View>
        );
      case 'coach':
        const coachData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {coachData.experience && (
              <Text style={styles.roleSpecificText}>⏱️ {coachData.experience} experience</Text>
            )}
            {coachData.teamHistory && coachData.teamHistory.length > 0 && (
              <Text style={styles.roleSpecificText}>🏆 {coachData.teamHistory[0]}</Text>
            )}
          </View>
        );
      case 'trainer':
        const trainerData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {trainerData.specialties && trainerData.specialties.length > 0 && (
              <Text style={styles.roleSpecificText}>💪 {trainerData.specialties.slice(0, 2).join(', ')}</Text>
            )}
            {trainerData.certifications && trainerData.certifications.length > 0 && (
              <Text style={styles.roleSpecificText}>🎓 {trainerData.certifications.slice(0, 2).join(', ')}</Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="discover-screen">
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Discover People</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color={theme.colors.textOnLight} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, sports..."
            value={localSearchQuery}
            onChangeText={setLocalSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            placeholderTextColor={theme.colors.textSecondary}
            testID="discover-search-input"
          />
          {localSearchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setLocalSearchQuery('');
                setShowSearchResults(false);
                clearSearch();
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {showSearchResults ? (
        <View style={styles.searchResultsContainer}>
          {isSearching ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.searchLoadingText}>Searching...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResultsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : localSearchQuery.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Search size={48} color={theme.colors.textSecondary} />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsMessage}>
                Try searching for different keywords
              </Text>
            </View>
          ) : (
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
              {recentSearches.map(renderRecentSearch)}
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Role Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.roleFilter}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, !selectedRole && styles.filterChipActive]}
              onPress={() => setSelectedRole(null)}
            >
              <Text style={[styles.filterChipText, !selectedRole && styles.filterChipTextActive]}>
                All Roles
              </Text>
            </TouchableOpacity>
            {['athlete', 'scout', 'coach', 'trainer'].map((role) => {
              // Show recommended badge for roles that match user's likely interests
              const isRecommended = currentUser && (
                (currentUser.role === 'scout' && role === 'athlete') ||
                (currentUser.role === 'athlete' && (role === 'scout' || role === 'coach' || role === 'trainer')) ||
                (currentUser.role === 'coach' && role === 'athlete') ||
                (currentUser.role === 'trainer' && role === 'athlete')
              );
              
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.filterChip, selectedRole === role && styles.filterChipActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[styles.filterChipText, selectedRole === role && styles.filterChipTextActive]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                    {isRecommended && selectedRole !== role && (
                      <Text style={styles.recommendedBadge}> ⭐</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sports Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sportsFilter}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, !selectedSport && styles.filterChipActive]}
              onPress={() => setSelectedSport(null)}
            >
              <Text style={[styles.filterChipText, !selectedSport && styles.filterChipTextActive]}>
                All Sports
              </Text>
            </TouchableOpacity>
            {sports.map((sport) => {
              // Show recommended badge for user's sport
              const isUserSport = currentUser?.sport === sport;
              
              return (
                <TouchableOpacity
                  key={sport}
                  style={[styles.filterChip, selectedSport === sport && styles.filterChipActive]}
                  onPress={() => setSelectedSport(sport)}
                >
                  <Text style={[styles.filterChipText, selectedSport === sport && styles.filterChipTextActive]}>
                    {sport}
                    {isUserSport && selectedSport !== sport && (
                      <Text style={styles.recommendedBadge}> 🏆</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isInitialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : usersError ? (
            <View style={styles.noUsersContainer} testID="discover-users-error">
              <Search size={48} color={theme.colors.textSecondary} />
              <Text style={styles.noUsersTitle}>Unable to load users</Text>
              <Text style={styles.noUsersMessage}>{usersError}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={loadUsers} testID="discover-refresh-button">
                <Text style={styles.refreshButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredUsers.length > 0 ? (
            <FlatList
              data={filteredUsers}
              renderItem={renderUser}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              refreshing={filteredUsers.length > 0 ? (isLoadingUsers || usersIsLoading) : false}
              onRefresh={loadUsers}
            />
          ) : (
            <View style={styles.noUsersContainer}>
              <Search size={48} color={theme.colors.textSecondary} />
              <Text style={styles.noUsersTitle}>No users found</Text>
              <Text style={styles.noUsersMessage}>
                {selectedSport && selectedRole 
                  ? `No ${selectedRole}s found for ${selectedSport}` 
                  : selectedSport 
                    ? `No users found for ${selectedSport}` 
                    : selectedRole 
                      ? `No ${selectedRole}s found` 
                      : 'No users available at the moment'}
              </Text>
              {(selectedSport || selectedRole) && (
                <TouchableOpacity 
                  style={styles.clearFiltersButton} 
                  onPress={() => {
                    setSelectedSport(null);
                    setSelectedRole(null);
                  }}
                >
                  <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.refreshButton} onPress={loadUsers} testID="discover-refresh-button">
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnLight,
  },
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textOnDark,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  filterButton: {
    padding: theme.spacing.xs,
  },
  roleFilter: {
    backgroundColor: theme.colors.white,
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sportsFilter: {
    backgroundColor: theme.colors.white,
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textOnLight,
    fontWeight: theme.fontWeight.medium,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  noUsersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  noUsersTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnDark,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noUsersMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  refreshButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  userCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  userImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnLight,
  },
  verified: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
  },
  userRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  userBio: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
  separator: {
    height: theme.spacing.sm,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  searchLoadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  searchResultsList: {
    padding: theme.spacing.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  searchResultName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnLight,
  },
  searchResultSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    padding: theme.spacing.sm,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  noResultsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noResultsMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  recentSearchesContainer: {
    padding: theme.spacing.md,
  },
  recentSearchesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnLight,
    marginBottom: theme.spacing.md,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  recentSearchText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  messageButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  messageButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  followButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  followingButtonSmall: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  followButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  followingButtonText: {
    color: theme.colors.white,
  },
  searchResultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  messageButton: {
    padding: theme.spacing.sm,
  },
  userPosition: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  roleSpecificInfo: {
    marginTop: theme.spacing.xs,
    gap: 2,
  },
  roleSpecificText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  recommendedBadge: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.secondary,
  },
  clearFiltersButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearFiltersButtonText: {
    color: theme.colors.textOnDark,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});