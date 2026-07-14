import React, { useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';
import {
  Search,
  Filter,
  MapPin,
  UserPlus,
  UserCheck,
  Bell,
  MessageCircle,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme, formatRoleName } from '@/constants/theme';
import { sports } from '@/mocks/data';
import { SearchResult, User } from '@/types';
import { useSearch } from '@/hooks/search-context';
import { useFollow } from '@/hooks/follow-context';
import { useNotifications } from '@/hooks/notifications-context';
import { useAuth } from '@/hooks/auth-context';
import { useUsers, type ProfileCursor } from '@/hooks/users-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { DiscoverSkeleton } from '@/components/SkeletonScreens';
import VerificationBadge from '@/components/VerificationBadge';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import { getZoneMeta, type ZoneName } from '@/constants/fitness-test-data';

interface DiscoverState {
  searchQuery: string;
  selectedSport: string | null;
  selectedRole: string | null;
  users: User[];
  isLoading: boolean;
  showSearchResults: boolean;
  error: string | null;
  hasInitializedFilters: boolean;
  showFilterModal: boolean;
  tempSport: string | null;
  tempRole: string | null;
  tempLocation: string;
  tempVerified: boolean;
  locationFilter: string;
  verifiedOnly: boolean;
  sportDropdownOpen: boolean;
  roleDropdownOpen: boolean;
  minVerificationTier: string | null;
  minZone: ZoneName | null;
}

type DiscoverAction =
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_SELECTED_SPORT'; sport: string | null }
  | { type: 'SET_SELECTED_ROLE'; role: string | null }
  | { type: 'SET_USERS'; users: User[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SHOW_SEARCH_RESULTS'; show: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_INITIALIZED_FILTERS' }
  | { type: 'OPEN_FILTER_MODAL' }
  | { type: 'CLOSE_FILTER_MODAL' }
  | { type: 'APPLY_FILTERS' }
  | { type: 'RESET_FILTERS' }
  | { type: 'RESET_TEMP_FILTERS' }
  | { type: 'SET_TEMP_SPORT'; sport: string | null }
  | { type: 'SET_TEMP_ROLE'; role: string | null }
  | { type: 'SET_TEMP_LOCATION'; location: string }
  | { type: 'SET_TEMP_VERIFIED'; verified: boolean }
  | { type: 'TOGGLE_SPORT_DROPDOWN' }
  | { type: 'TOGGLE_ROLE_DROPDOWN' }
  | { type: 'CLOSE_SPORT_DROPDOWN' }
  | { type: 'CLOSE_ROLE_DROPDOWN' }
  | { type: 'INIT_FILTERS'; sport: string | null; role: string | null }
  | { type: 'CLEAR_MAIN_FILTERS' }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'LOAD_USERS_START' }
  | { type: 'LOAD_USERS_ERROR'; error: string }
  | { type: 'SET_MIN_VERIFICATION'; payload: string | null }
  | { type: 'SET_MIN_ZONE'; payload: ZoneName | null };

const initialState: DiscoverState = {
  searchQuery: '',
  selectedSport: null,
  selectedRole: null,
  users: [],
  isLoading: true,
  showSearchResults: false,
  error: null,
  hasInitializedFilters: false,
  showFilterModal: false,
  tempSport: null,
  tempRole: null,
  tempLocation: '',
  tempVerified: false,
  locationFilter: '',
  verifiedOnly: false,
  sportDropdownOpen: false,
  roleDropdownOpen: false,
  minVerificationTier: null,
  minZone: null,
};

const ZONE_ORDER: ZoneName[] = ['starter', 'building', 'rising', 'strong', 'elite', 'unstoppable'];
const TIER_ORDER_LIST = ['self_reported', 'app_measured', 'coach_verified', 'center_tested'];

function discoverReducer(state: DiscoverState, action: DiscoverAction): DiscoverState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'SET_SELECTED_SPORT':
      return { ...state, selectedSport: action.sport };
    case 'SET_SELECTED_ROLE':
      return { ...state, selectedRole: action.role };
    case 'SET_USERS':
      return { ...state, users: action.users };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_SHOW_SEARCH_RESULTS':
      return { ...state, showSearchResults: action.show };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_INITIALIZED_FILTERS':
      return { ...state, hasInitializedFilters: true };
    case 'INIT_FILTERS':
      return {
        ...state,
        selectedSport: action.sport,
        selectedRole: action.role,
        hasInitializedFilters: true,
      };
    case 'OPEN_FILTER_MODAL':
      return {
        ...state,
        showFilterModal: true,
        tempSport: state.selectedSport,
        tempRole: state.selectedRole,
        tempLocation: state.locationFilter,
        tempVerified: state.verifiedOnly,
      };
    case 'CLOSE_FILTER_MODAL':
      return { ...state, showFilterModal: false };
    case 'APPLY_FILTERS':
      return {
        ...state,
        selectedSport: state.tempSport,
        selectedRole: state.tempRole,
        locationFilter: state.tempLocation,
        verifiedOnly: state.tempVerified,
        showFilterModal: false,
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        selectedSport: null,
        selectedRole: null,
        locationFilter: '',
        verifiedOnly: false,
        showFilterModal: false,
      };
    case 'RESET_TEMP_FILTERS':
      return {
        ...state,
        tempSport: null,
        tempRole: null,
        tempLocation: '',
        tempVerified: false,
      };
    case 'SET_TEMP_SPORT':
      return { ...state, tempSport: action.sport, sportDropdownOpen: false };
    case 'SET_TEMP_ROLE':
      return { ...state, tempRole: action.role, roleDropdownOpen: false };
    case 'SET_TEMP_LOCATION':
      return { ...state, tempLocation: action.location };
    case 'SET_TEMP_VERIFIED':
      return { ...state, tempVerified: action.verified };
    case 'TOGGLE_SPORT_DROPDOWN':
      return { ...state, sportDropdownOpen: !state.sportDropdownOpen };
    case 'TOGGLE_ROLE_DROPDOWN':
      return { ...state, roleDropdownOpen: !state.roleDropdownOpen };
    case 'CLOSE_SPORT_DROPDOWN':
      return { ...state, sportDropdownOpen: false };
    case 'CLOSE_ROLE_DROPDOWN':
      return { ...state, roleDropdownOpen: false };
    case 'CLEAR_MAIN_FILTERS':
      return { ...state, selectedSport: null, selectedRole: null };
    case 'CLEAR_SEARCH':
      return { ...state, searchQuery: '', showSearchResults: false };
    case 'LOAD_USERS_START':
      return { ...state, error: null, isLoading: true };
    case 'LOAD_USERS_ERROR':
      return { ...state, error: action.error, users: [], isLoading: false };
    case 'SET_MIN_VERIFICATION':
      return { ...state, minVerificationTier: action.payload };
    case 'SET_MIN_ZONE':
      return { ...state, minZone: action.payload };
    default:
      return state;
  }
}

export default function DiscoverScreen() {
  const [state, dispatch] = useReducer(discoverReducer, initialState);
  const {
    searchQuery: localSearchQuery,
    selectedSport,
    selectedRole,
    users,
    isLoading: isLoadingUsers,
    showSearchResults,
    error: usersError,
    hasInitializedFilters,
    showFilterModal,
    tempSport,
    tempRole,
    tempLocation,
    tempVerified,
    locationFilter,
    verifiedOnly,
    sportDropdownOpen,
    roleDropdownOpen,
  } = state;

  const { searchResults, isSearching, searchUsers, clearSearch, addRecentSearch, recentSearches } =
    useSearch();

  const { followUser, unfollowUser, isFollowing } = useFollow();
  const { unreadCount } = useNotifications();
  const { user: currentUser } = useAuth();
  const { track } = useAnalytics();
  const { fetchLatestBatch } = useFitnessTest();
  const [athleteZones, setAthleteZones] = useState<Record<string, string>>({});
  const [athleteTiers, setAthleteTiers] = useState<Record<string, string>>({});

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'discover' });
  }, []);

  // Initialize filters based on current user's profile
  useEffect(() => {
    if (currentUser && !hasInitializedFilters) {
      if (__DEV__)
        if (__DEV__) {
          console.log('Discover: Initializing filters based on user profile', {
            userRole: currentUser.role,
            userSport: currentUser.sport,
          });
        }

      // Determine sport and role filters based on user profile
      const sport = currentUser.sport || null;
      let role: string | null = null;
      if (currentUser.role === 'scout') {
        // Scouts typically look for athletes
        role = 'athlete';
      } else if (currentUser.role === 'athlete') {
        // Athletes might look for scouts, coaches, or trainers
        role = 'scout';
      } else if (currentUser.role === 'coach') {
        // Coaches might look for athletes or other coaches
        role = 'athlete';
      } else if (currentUser.role === 'trainer') {
        // Trainers might look for athletes
        role = 'athlete';
      }
      // For other roles, keep it as null (show all)

      dispatch({ type: 'INIT_FILTERS', sport, role });
    }
  }, [currentUser, hasInitializedFilters]);

  const getErrorMessage = useCallback((error: unknown): string => {
    try {
      if (!error) return 'Unknown error';
      if (typeof error === 'string') return error;
      if (error instanceof Error) return error.message;
      const maybe =
        (error as { message?: string; error_description?: string; details?: string }).message ??
        (error as any).error_description ??
        (error as any).details;
      return typeof maybe === 'string' && maybe.length > 0 ? maybe : JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }, []);

  const { isLoading: usersIsLoading, searchProfiles } = useUsers();

  // ── Server-side, keyset-paginated discovery ────────────────────────────────
  // Previously Discover filtered client-side over an unordered LIMIT 200 cache,
  // so at scale a scout only ever saw 0.02% of athletes (the kid from Hyderabad
  // was never in the 200 rows). Now role/sport/location/verified are pushed into
  // the SQL query and results are paged with a keyset cursor. Zone/tier stay as
  // a client refinement (they need per-athlete fitness data) applied in the
  // `filteredUsers` memo on top of the returned page.
  const serverAccumRef = useRef<User[]>([]);
  const serverCursorRef = useRef<ProfileCursor | null>(null);
  const serverHasMoreRef = useRef<boolean>(true);
  const serverLoadingRef = useRef<boolean>(false);
  const [isPaging, setIsPaging] = useState<boolean>(false);

  const currentFilters = useMemo(
    () => ({
      role: selectedRole,
      sport: selectedSport,
      location: locationFilter,
      verifiedOnly,
    }),
    [selectedRole, selectedSport, locationFilter, verifiedOnly],
  );

  const loadServer = useCallback(
    async (reset: boolean) => {
      if (serverLoadingRef.current) return;
      if (!reset && !serverHasMoreRef.current) return;
      serverLoadingRef.current = true;
      if (reset) {
        dispatch({ type: 'LOAD_USERS_START' });
        serverCursorRef.current = null;
        serverHasMoreRef.current = true;
      } else {
        setIsPaging(true);
      }
      try {
        const {
          users: page,
          nextCursor,
          error,
        } = await searchProfiles(currentFilters, reset ? null : serverCursorRef.current, 20);
        if (error) {
          dispatch({ type: 'LOAD_USERS_ERROR', error });
          return;
        }
        const merged = reset ? page : [...serverAccumRef.current, ...page];
        // Dedupe by id (keyset ties / realtime overlap can repeat a row).
        const seen = new Set<string>();
        const deduped = merged.filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)));
        serverAccumRef.current = deduped;
        serverCursorRef.current = nextCursor;
        serverHasMoreRef.current = !!nextCursor;
        dispatch({ type: 'SET_USERS', users: deduped });
      } catch (error) {
        dispatch({ type: 'LOAD_USERS_ERROR', error: getErrorMessage(error) });
      } finally {
        serverLoadingRef.current = false;
        setIsPaging(false);
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [currentFilters, searchProfiles, getErrorMessage],
  );

  // Retry/refresh buttons and pull-to-refresh reset to page 1.
  const loadUsers = useCallback(() => {
    void loadServer(true);
  }, [loadServer]);

  // Reload page 1 whenever the server-pushable filters change (and once filters
  // are initialized from the user's profile). currentFilters is memoized, so
  // this fires only on an actual filter change, not every render.
  useEffect(() => {
    if (!hasInitializedFilters) return;
    void loadServer(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitializedFilters, currentFilters]);

  const filteredUsers = useMemo(() => {
    // First deduplicate users by ID and exclude current user
    const uniqueUsers = users.reduce((acc, user) => {
      if (!acc.has(user.id) && user.id !== currentUser?.id) {
        acc.set(user.id, user);
      }
      return acc;
    }, new Map<string, User>());

    const deduplicatedUsers = Array.from(uniqueUsers.values());

    return deduplicatedUsers.filter((user) => {
      const q = localSearchQuery.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(q) ||
        (user.sport ? user.sport.toLowerCase().includes(q) : false) ||
        (user.bio ? user.bio.toLowerCase().includes(q) : false) ||
        user.role.toLowerCase().includes(q);
      const matchesSport = !selectedSport || user.sport === selectedSport;
      const matchesRole = !selectedRole || user.role === selectedRole;
      const matchesLocation =
        !locationFilter ||
        (user.location && user.location.toLowerCase().includes(locationFilter.toLowerCase()));
      const matchesVerified = !verifiedOnly || user.verified;

      // Additional smart filtering based on current user's role
      let isRelevantMatch = true;
      if (currentUser) {
        // If current user is a scout, prioritize athletes in their sport
        if (currentUser.role === 'scout' && user.role === 'athlete') {
          const scoutData = currentUser.roleSpecificData;
          if (scoutData?.scoutingRegions && user.location) {
            // Check if user's location matches scout's regions
            const matchesRegion = scoutData.scoutingRegions.some((region) =>
              user.location?.toLowerCase().includes(region.toLowerCase()),
            );
            if (!matchesRegion && scoutData.scoutingRegions.length > 0) {
              isRelevantMatch = false;
            }
          }
        }
      }

      // Fitness-zone filter — only applies to athletes. If a min zone is set,
      // exclude athletes whose latest Yo-Yo zone is below the threshold OR
      // who have no recorded zone at all (filter is opt-in, so missing-data
      // exclusion is the correct semantic — scout asked specifically for zone≥X).
      let matchesZone = true;
      if (state.minZone && user.role === 'athlete') {
        const userZone = athleteZones[user.id];
        if (!userZone) {
          matchesZone = false;
        } else {
          const userIdx = ZONE_ORDER.indexOf(userZone as ZoneName);
          const minIdx = ZONE_ORDER.indexOf(state.minZone);
          matchesZone = userIdx >= 0 && userIdx >= minIdx;
        }
      }

      // Verification-tier filter — same opt-in semantic.
      let matchesTier = true;
      if (state.minVerificationTier && user.role === 'athlete') {
        const userTier = athleteTiers[user.id];
        if (!userTier) {
          matchesTier = false;
        } else {
          const userIdx = TIER_ORDER_LIST.indexOf(userTier);
          const minIdx = TIER_ORDER_LIST.indexOf(state.minVerificationTier);
          matchesTier = userIdx >= 0 && userIdx >= minIdx;
        }
      }

      return (
        matchesSearch &&
        matchesSport &&
        matchesRole &&
        matchesLocation &&
        matchesVerified &&
        matchesZone &&
        matchesTier &&
        isRelevantMatch
      );
    });
  }, [
    users,
    localSearchQuery,
    selectedSport,
    selectedRole,
    locationFilter,
    verifiedOnly,
    currentUser,
    state.minZone,
    state.minVerificationTier,
    athleteZones,
    athleteTiers,
  ]);

  // Stable key of athlete IDs derived from `users` (NOT `filteredUsers`).
  // Deriving from filteredUsers created an infinite loop: the effect below
  // sets athleteZones/athleteTiers, filteredUsers' memo depends on those, so
  // a new array identity re-fired the effect on every fetch completion. Keying
  // on the raw athlete-id list breaks that cycle — zone/tier state no longer
  // feeds back into what the effect depends on.
  const athleteIdsKey = useMemo(
    () =>
      users
        .filter((u) => u.role === 'athlete' && u.id !== currentUser?.id)
        .map((u) => u.id)
        .slice(0, 50)
        .join(','),
    [users, currentUser?.id],
  );

  useEffect(() => {
    const athleteIds = athleteIdsKey ? athleteIdsKey.split(',') : [];
    if (athleteIds.length === 0) return;
    let cancelled = false;
    fetchLatestBatch(athleteIds, 'yoyo')
      .then((batchMap) => {
        if (cancelled) return;
        const zones: Record<string, string> = {};
        const tiers: Record<string, string> = {};
        batchMap.forEach((result, id) => {
          if (result?.zone) zones[id] = result.zone;
          if (result?.verification_tier) tiers[id] = result.verification_tier;
        });
        setAthleteZones(zones);
        setAthleteTiers(tiers);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [athleteIdsKey, fetchLatestBatch]);

  const isInitialLoading = useMemo(() => {
    return (isLoadingUsers || usersIsLoading) && users.length === 0 && !usersError;
  }, [isLoadingUsers, usersIsLoading, users.length, usersError]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchQuery.trim()) {
        searchUsers(localSearchQuery);
        dispatch({ type: 'SET_SHOW_SEARCH_RESULTS', show: true });
      } else {
        dispatch({ type: 'SET_SHOW_SEARCH_RESULTS', show: false });
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchUsers, clearSearch]);

  const handleSearchSubmit = () => {
    if (localSearchQuery.trim()) {
      track(EVENTS.SEARCH, { query: localSearchQuery.trim() });
      addRecentSearch(localSearchQuery);
    }
  };

  const handleFollowToggle = useCallback(
    async (userId: string) => {
      if (isFollowing(userId)) {
        track(EVENTS.UNFOLLOW, { targetUserId: userId });
        await unfollowUser(userId);
      } else {
        track(EVENTS.FOLLOW, { targetUserId: userId });
        await followUser(userId);
      }
    },
    [isFollowing, unfollowUser, followUser, track],
  );

  const renderUser = useCallback(
    ({ item }: { item: User }) => (
      <TouchableOpacity
        style={styles.userCard}
        testID={`discover-user-${item.id}`}
        onPress={() =>
          router.push({
            pathname: '/user/[id]' as any,
            params: { id: item.id },
          })
        }
      >
        <CachedImage source={item.avatar} size={80} placeholder="avatar" />
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            {item.verified && <Text style={styles.verified}>✓</Text>}
          </View>
          <Text style={styles.userRole} numberOfLines={1} ellipsizeMode="tail">
            {formatRoleName(item.role)}
            {item.sport ? ` • ${item.sport}` : ''}
          </Text>
          {item.position && (
            <Text style={styles.userPosition} numberOfLines={1} ellipsizeMode="tail">
              {item.position}
            </Text>
          )}
          {item.location && (
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <MapPin size={12} color={theme.colors.textSecondary} />
                <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            </View>
          )}
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2} ellipsizeMode="tail">
              {item.bio}
            </Text>
          )}
          {item.role === 'athlete' &&
            athleteZones[item.id] &&
            (() => {
              const zoneMeta = getZoneMeta(athleteZones[item.id] as ZoneName);
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Text
                    style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}
                  >
                    FITNESS
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: zoneMeta.color + '20',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: zoneMeta.color,
                        textTransform: 'uppercase',
                      }}
                    >
                      {athleteZones[item.id]}
                    </Text>
                  </View>
                </View>
              );
            })()}
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
                  },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Message ${item.name}`}
            >
              <MessageCircle size={16} color={theme.colors.primary} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.followButtonSmall,
                isFollowing(item.id) && styles.followingButtonSmall,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleFollowToggle(item.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isFollowing(item.id) ? `Unfollow ${item.name}` : `Follow ${item.name}`
              }
            >
              {isFollowing(item.id) ? (
                <UserCheck size={16} color={theme.colors.white} />
              ) : (
                <UserPlus size={16} color={theme.colors.primary} />
              )}
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing(item.id) && styles.followingButtonText,
                ]}
              >
                {isFollowing(item.id) ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [isFollowing, handleFollowToggle],
  );

  const renderSearchResult = useCallback(
    ({ item }: { item: SearchResult }) => (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() =>
          router.push({
            pathname: '/user/[id]' as any,
            params: { id: item.id },
          })
        }
      >
        <CachedImage source={item.avatar} size={40} placeholder="avatar" />
        <View style={styles.searchResultInfo}>
          <View style={styles.searchResultHeader}>
            <Text style={styles.searchResultName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            {item.verified && <Text style={styles.verified}>✓</Text>}
          </View>
          {item.subtitle && (
            <Text style={styles.searchResultSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {item.subtitle}
            </Text>
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
                },
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Message ${item.name}`}
          >
            <MessageCircle size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.followButton}
            onPress={(e) => {
              e.stopPropagation();
              handleFollowToggle(item.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isFollowing(item.id) ? `Unfollow ${item.name}` : `Follow ${item.name}`
            }
          >
            {isFollowing(item.id) ? (
              <UserCheck size={20} color={theme.colors.primary} />
            ) : (
              <UserPlus size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [isFollowing, handleFollowToggle],
  );

  const renderRecentSearch = useCallback(
    (query: string, index: number) => (
      <TouchableOpacity
        key={index}
        style={styles.recentSearchItem}
        onPress={() => {
          dispatch({ type: 'SET_SEARCH', query });
          searchUsers(query);
          dispatch({ type: 'SET_SHOW_SEARCH_RESULTS', show: true });
        }}
      >
        <Search size={16} color={theme.colors.textSecondary} />
        <Text style={styles.recentSearchText} numberOfLines={1} ellipsizeMode="tail">
          {query}
        </Text>
      </TouchableOpacity>
    ),
    [searchUsers],
  );

  const renderRoleFilterItem = useCallback(
    ({ item: role }: { item: string | null }) => {
      const isActive = role === null ? !selectedRole : selectedRole === role;
      return (
        <TouchableOpacity
          style={[styles.filterChip, isActive && styles.filterChipActive]}
          onPress={() => dispatch({ type: 'SET_SELECTED_ROLE', role })}
        >
          <Text
            style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
            numberOfLines={1}
          >
            {role === null ? 'All' : formatRoleName(role, true)}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedRole],
  );

  const renderSportFilterItem = useCallback(
    ({ item: sport }: { item: string | null }) => {
      const isActive = sport === null ? !selectedSport : selectedSport === sport;
      return (
        <TouchableOpacity
          style={[styles.filterChip, isActive && styles.filterChipActive]}
          onPress={() => dispatch({ type: 'SET_SELECTED_SPORT', sport })}
        >
          <Text
            style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
            numberOfLines={1}
          >
            {sport === null ? 'All' : sport}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedSport],
  );

  const renderRoleSpecificInfo = (user: User) => {
    if (!user.roleSpecificData) return null;

    switch (user.role) {
      case 'athlete':
        const athleteData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {athleteData.currentTeam && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                🏆 {athleteData.currentTeam}
              </Text>
            )}
            {(athleteData.height || athleteData.weight) && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
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
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                🏢 {scoutData.organization}
              </Text>
            )}
            {scoutData.scoutingRegions && scoutData.scoutingRegions.length > 0 && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                🌍 {scoutData.scoutingRegions.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>
        );
      case 'coach':
        const coachData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {coachData.experience && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                ⏱️ {coachData.experience} experience
              </Text>
            )}
            {coachData.teamHistory && coachData.teamHistory.length > 0 && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                🏆 {coachData.teamHistory[0]}
              </Text>
            )}
          </View>
        );
      case 'trainer':
        const trainerData = user.roleSpecificData;
        return (
          <View style={styles.roleSpecificInfo}>
            {trainerData.specialties && trainerData.specialties.length > 0 && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                💪 {trainerData.specialties.slice(0, 2).join(', ')}
              </Text>
            )}
            {trainerData.certifications && trainerData.certifications.length > 0 && (
              <Text style={styles.roleSpecificText} numberOfLines={1} ellipsizeMode="tail">
                🎓 {trainerData.certifications.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <BackgroundGradient style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} testID="discover-screen">
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              Discover People
            </Text>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/(tabs)/notifications' as any)}
              accessibilityRole="button"
              accessibilityLabel={
                unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
              }
            >
              <Bell size={24} color={theme.colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText} numberOfLines={1}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer} accessible={true} accessibilityRole="search">
            <Search size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people, sports..."
              value={localSearchQuery}
              onChangeText={(text) => dispatch({ type: 'SET_SEARCH', query: text })}
              onSubmitEditing={handleSearchSubmit}
              placeholderTextColor={theme.colors.textSecondary}
              testID="discover-search-input"
              accessibilityLabel="Search people and sports"
            />
            {localSearchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  dispatch({ type: 'CLEAR_SEARCH' });
                  clearSearch();
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => dispatch({ type: 'OPEN_FILTER_MODAL' })}
              testID="filter-button"
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              accessibilityHint="Opens advanced filter options"
            >
              <Filter size={20} color={theme.colors.primary} />
              {(selectedSport || selectedRole || locationFilter || verifiedOnly) && (
                <View style={styles.filterActiveBadge} />
              )}
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
                ItemSeparatorComponent={ItemSeparator}
                {...FLATLIST_PERF_PROPS}
              />
            ) : localSearchQuery.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Search size={48} color={theme.colors.textSecondary} />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsMessage}>Try searching for different keywords</Text>
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
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.roleFilter}
              contentContainerStyle={styles.filterContent}
              data={
                [null, 'athlete', 'scout', 'coach', 'trainer', 'team', 'brand', 'fan'] as (
                  | string
                  | null
                )[]
              }
              keyExtractor={(item) => item || 'all'}
              renderItem={renderRoleFilterItem}
              {...FLATLIST_PERF_PROPS}
            />

            {/* Sports Filter */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sportsFilter}
              contentContainerStyle={styles.filterContent}
              data={[null, ...sports] as (string | null)[]}
              keyExtractor={(item) => item || 'all'}
              renderItem={renderSportFilterItem}
              {...FLATLIST_PERF_PROPS}
            />

            {/* Verification Tier Filter — visible to scouts, coaches, teams, academies */}
            {currentUser?.role &&
              ['scout', 'coach', 'team', 'academy'].includes(currentUser.role) && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Min. Verification</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    {[
                      { key: null, label: 'Any' },
                      { key: 'app_measured', label: 'App-Tested' },
                      { key: 'coach_verified', label: 'Coach-Verified' },
                      { key: 'center_tested', label: 'Official' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key ?? 'any'}
                        style={[
                          styles.filterChip,
                          { marginRight: 8 },
                          state.minVerificationTier === opt.key && styles.filterChipActive,
                        ]}
                        onPress={() => dispatch({ type: 'SET_MIN_VERIFICATION', payload: opt.key })}
                      >
                        {opt.key && <VerificationBadge tier={opt.key as any} size="sm" />}
                        <Text
                          style={[
                            styles.filterChipText,
                            state.minVerificationTier === opt.key && styles.filterChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

            {/* Fitness Zone Filter — visible to scouts/coaches/teams/academies. The
                Yo-Yo IR1 zone is the primary athletic-performance scan tool;
                tier above is trustworthiness, this is performance level. Both can
                stack (e.g. "Strong+ AND Coach-Verified+"). */}
            {currentUser?.role &&
              ['scout', 'coach', 'team', 'academy'].includes(currentUser.role) && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Min. Fitness Zone</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    {[
                      { key: null as ZoneName | null, label: 'Any' },
                      { key: 'building' as ZoneName | null, label: 'Building+' },
                      { key: 'rising' as ZoneName | null, label: 'Rising+' },
                      { key: 'strong' as ZoneName | null, label: 'Strong+' },
                      { key: 'elite' as ZoneName | null, label: 'Elite+' },
                      { key: 'unstoppable' as ZoneName | null, label: 'Unstoppable' },
                    ].map((opt) => {
                      const isActive = state.minZone === opt.key;
                      const zoneColor = opt.key ? getZoneMeta(opt.key).color : theme.colors.text;
                      return (
                        <TouchableOpacity
                          key={opt.key ?? 'any'}
                          style={[
                            styles.filterChip,
                            { marginRight: 8 },
                            isActive && {
                              backgroundColor: zoneColor + '20',
                              borderColor: zoneColor,
                            },
                          ]}
                          onPress={() => dispatch({ type: 'SET_MIN_ZONE', payload: opt.key })}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isActive && { color: zoneColor, fontWeight: '700' },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

            {isInitialLoading ? (
              <DiscoverSkeleton />
            ) : usersError ? (
              <View style={styles.noUsersContainer} testID="discover-users-error">
                <Search size={48} color={theme.colors.textSecondary} />
                <Text style={styles.noUsersTitle}>Unable to load users</Text>
                <Text style={styles.noUsersMessage}>{usersError}</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadUsers}
                  testID="discover-refresh-button"
                >
                  <Text style={styles.refreshButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredUsers.length > 0 ? (
              <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={ItemSeparator}
                refreshing={filteredUsers.length > 0 ? isLoadingUsers || usersIsLoading : false}
                onRefresh={loadUsers}
                onEndReached={() => loadServer(false)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isPaging ? (
                    <ActivityIndicator style={styles.pagingSpinner} color={theme.colors.primary} />
                  ) : null
                }
                {...FLATLIST_PERF_PROPS}
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
                    onPress={() => dispatch({ type: 'CLEAR_MAIN_FILTERS' })}
                  >
                    <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadUsers}
                  testID="discover-refresh-button"
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Advanced Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent
          onRequestClose={() => dispatch({ type: 'CLOSE_FILTER_MODAL' })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Advanced Filters</Text>
                <TouchableOpacity
                  onPress={() => dispatch({ type: 'CLOSE_FILTER_MODAL' })}
                  accessibilityRole="button"
                  accessibilityLabel="Close filters"
                >
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Sport Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sport</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => dispatch({ type: 'TOGGLE_SPORT_DROPDOWN' })}
                    >
                      <Text style={styles.dropdownButtonText}>{tempSport || 'All Sports'}</Text>
                      <Text style={styles.dropdownArrow}>{sportDropdownOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {sportDropdownOpen && (
                      <View style={styles.dropdownList}>
                        <ScrollView style={styles.dropdownScroll}>
                          <TouchableOpacity
                            style={[styles.dropdownItem, !tempSport && styles.dropdownItemSelected]}
                            onPress={() => dispatch({ type: 'SET_TEMP_SPORT', sport: null })}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                !tempSport && styles.dropdownItemTextSelected,
                              ]}
                            >
                              All Sports
                            </Text>
                          </TouchableOpacity>
                          {sports.map((sport) => (
                            <TouchableOpacity
                              key={sport}
                              style={[
                                styles.dropdownItem,
                                tempSport === sport && styles.dropdownItemSelected,
                              ]}
                              onPress={() => dispatch({ type: 'SET_TEMP_SPORT', sport })}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemText,
                                  tempSport === sport && styles.dropdownItemTextSelected,
                                ]}
                              >
                                {sport}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Role Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Role</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => dispatch({ type: 'TOGGLE_ROLE_DROPDOWN' })}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {tempRole ? formatRoleName(tempRole, true) : 'All Roles'}
                      </Text>
                      <Text style={styles.dropdownArrow}>{roleDropdownOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {roleDropdownOpen && (
                      <View style={styles.dropdownList}>
                        <TouchableOpacity
                          style={[styles.dropdownItem, !tempRole && styles.dropdownItemSelected]}
                          onPress={() => dispatch({ type: 'SET_TEMP_ROLE', role: null })}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              !tempRole && styles.dropdownItemTextSelected,
                            ]}
                          >
                            All Roles
                          </Text>
                        </TouchableOpacity>
                        {['athlete', 'scout', 'coach', 'trainer'].map((role) => (
                          <TouchableOpacity
                            key={role}
                            style={[
                              styles.dropdownItem,
                              tempRole === role && styles.dropdownItemSelected,
                            ]}
                            onPress={() => dispatch({ type: 'SET_TEMP_ROLE', role })}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                tempRole === role && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {formatRoleName(role, true)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Location Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Location</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Filter by location..."
                    value={tempLocation}
                    onChangeText={(text) => dispatch({ type: 'SET_TEMP_LOCATION', location: text })}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                {/* Verified Only */}
                <View style={styles.filterSection}>
                  <View style={styles.filterSwitchRow}>
                    <Text style={styles.filterSectionTitle}>Verified Only</Text>
                    <Switch
                      value={tempVerified}
                      onValueChange={(value) =>
                        dispatch({ type: 'SET_TEMP_VERIFIED', verified: value })
                      }
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
                      thumbColor={tempVerified ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.clearFiltersModalButton}
                  onPress={() => dispatch({ type: 'RESET_TEMP_FILTERS' })}
                >
                  <Text style={styles.clearFiltersModalButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyFiltersButton}
                  onPress={() => dispatch({ type: 'APPLY_FILTERS' })}
                >
                  <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#0a0a0a',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '900' as const,
    color: theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
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
    backgroundColor: '#111',
    borderRadius: 0,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  roleFilter: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    maxHeight: 52,
  },
  sportsFilter: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    maxHeight: 52,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderStyle: 'solid' as const,
  },
  filterChipText: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: '900' as const,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  pagingSpinner: {
    paddingVertical: theme.spacing.lg,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  userImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#30D158',
    flexShrink: 0,
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
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#f0f0f0',
    letterSpacing: 0.5,
    flex: 1,
    flexShrink: 1,
  },
  verified: {
    fontSize: 10,
    color: '#30D158',
    flexShrink: 0,
  },
  userRole: {
    fontSize: 10,
    color: '#FF9F0A',
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
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
    flex: 1,
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    flex: 1,
    flexShrink: 1,
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
    backgroundColor: 'transparent',
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
    flexShrink: 0,
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
    flex: 1,
    flexShrink: 1,
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
    fontWeight: '900' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
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
    flex: 1,
    flexShrink: 1,
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
    flexShrink: 0,
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
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  filterActiveBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  modalBody: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  filterSection: {
    marginBottom: theme.spacing.xl,
  },
  filterSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dropdownContainer: {
    gap: theme.spacing.xs,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  dropdownArrow: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  dropdownList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },

  filterInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  clearFiltersModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearFiltersModalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
});

const ItemSeparator = () => <View style={styles.separator} />;
