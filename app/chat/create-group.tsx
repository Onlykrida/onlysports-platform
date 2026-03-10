import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Check, Users, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useGroups } from '@/hooks/group-messages-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

interface SelectableUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  selected: boolean;
}

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const { createGroup } = useGroups();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SelectableUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const selectedCount = users.filter(u => u.selected).length;

  // Load users the current user follows
  const loadFollowedUsers = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      setIsLoadingUsers(true);

      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        console.error('Error loading follows:', followError);
        return;
      }

      if (!followData || followData.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const followingIds = followData.map((f: any) => f.following_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar, role')
        .in('id', followingIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      const selectableUsers: SelectableUser[] = (profilesData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        role: p.role,
        selected: false,
      }));

      setUsers(selectableUsers);
      setFilteredUsers(selectableUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user]);

  useEffect(() => {
    loadFollowedUsers();
  }, [loadFollowedUsers]);

  // Filter users based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, users]);

  const toggleUser = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, selected: !u.selected } : u))
    );
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const selectedIds = users.filter(u => u.selected).map(u => u.id);
    if (selectedIds.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createGroup(name, null, selectedIds);
      if (result.error) {
        Alert.alert('Error', result.error);
      } else if (result.groupId) {
        router.replace({
          pathname: '/chat/group/[id]' as any,
          params: { id: result.groupId, name },
        });
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const renderUser = ({ item }: { item: SelectableUser }) => (
    <TouchableOpacity
      style={[styles.userItem, item.selected && styles.userItemSelected]}
      onPress={() => toggleUser(item.id)}
    >
      <Image
        source={{
          uri: item.avatar || 'https://via.placeholder.com/40x40/E5E7EB/9CA3AF?text=U',
        }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.role && (
          <Text style={styles.userRole}>{item.role}</Text>
        )}
      </View>
      {item.selected && (
        <View style={styles.checkCircle}>
          <Check size={16} color={theme.colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );

  // Selected members chips
  const selectedUsers = users.filter(u => u.selected);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <TouchableOpacity
          style={[styles.createButton, (!groupName.trim() || selectedCount === 0 || isCreating) && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedCount === 0 || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Group name input */}
      <View style={styles.nameSection}>
        <View style={styles.groupIconContainer}>
          <Users size={28} color={theme.colors.primary} />
        </View>
        <TextInput
          style={styles.nameInput}
          placeholder="Group name"
          value={groupName}
          onChangeText={setGroupName}
          placeholderTextColor={theme.colors.textSecondary}
          maxLength={50}
        />
      </View>

      {/* Selected members chips */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedSection}>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.chip} onPress={() => toggleUser(item.id)}>
                <Image
                  source={{ uri: item.avatar || 'https://via.placeholder.com/24x24/E5E7EB/9CA3AF?text=U' }}
                  style={styles.chipAvatar}
                />
                <Text style={styles.chipName} numberOfLines={1}>{item.name}</Text>
                <X size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people you follow..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      </View>

      {/* User list */}
      {isLoadingUsers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No users found' : 'No one to add'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different search' : 'Follow people to add them to a group'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    minWidth: 70,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  selectedSection: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  selectedList: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chipName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    maxWidth: 80,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userItemSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  userRole: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
