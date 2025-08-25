import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);

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
        setUsers(cachedUsers.filter(u => u.id !== currentUser?.id));
        return;
      }

      await refreshUsers();
      setUsers(cachedUsers.filter(u => u.id !== currentUser?.id));
      console.log('Discover: loaded users from UsersProvider', cachedUsers.length);
    } catch (error) {
      const msg = getErrorMessage(error);
      console.error('Failed to load users:', msg, error);
      setUsersError(msg);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentUser?.id, getErrorMessage, cachedUsers, refreshUsers, isSupabaseConfigured]);

  useEffect(() => {
    console.log('Discover: trigger initial loadUsers');
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => users.filter(user => {
    const q = localSearchQuery.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(q) ||
      (user.sport ? user.sport.toLowerCase().includes(q) : false);
    const matchesSport = !selectedSport || user.sport === selectedSport;
    return matchesSearch && matchesSport;
  }), [users, localSearchQuery, selectedSport]);

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
        <Text style={styles.userRole}>{item.role}{item.sport ? ` • ${item.sport}` : ''}</Text>
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

  return (
    <SafeAreaView style={styles.container} testID="discover-screen">
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Discover Athletes</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color={theme.colors.text} />
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
            placeholder="Search athletes, sports..."
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sportsFilter}
            contentContainerStyle={styles.sportsFilterContent}
          >
            <TouchableOpacity
              style={[styles.sportChip, !selectedSport && styles.sportChipActive]}
              onPress={() => setSelectedSport(null)}
            >
              <Text style={[styles.sportChipText, !selectedSport && styles.sportChipTextActive]}>
                All Sports
              </Text>
            </TouchableOpacity>
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[styles.sportChip, selectedSport === sport && styles.sportChipActive]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text style={[styles.sportChipText, selectedSport === sport && styles.sportChipTextActive]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoadingUsers || usersIsLoading ? (
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
              refreshing={isLoadingUsers}
              onRefresh={loadUsers}
            />
          ) : (
            <View style={styles.noUsersContainer}>
              <Search size={48} color={theme.colors.textSecondary} />
              <Text style={styles.noUsersTitle}>No users found</Text>
              <Text style={styles.noUsersMessage}>
                {selectedSport ? `No users found for ${selectedSport}` : 'No users available at the moment'}
              </Text>
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
    color: theme.colors.text,
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
    color: theme.colors.text,
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
  sportsFilter: {
    backgroundColor: theme.colors.white,
    maxHeight: 60,
  },
  sportsFilterContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sportChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  sportChipActive: {
    backgroundColor: theme.colors.primary,
  },
  sportChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  sportChipTextActive: {
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
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    color: theme.colors.text,
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
});