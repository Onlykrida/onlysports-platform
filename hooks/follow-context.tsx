import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';

interface FollowState {
  followers: User[];
  following: User[];
  isLoading: boolean;
  followUser: (userId: string) => Promise<{ error?: string }>;
  unfollowUser: (userId: string) => Promise<{ error?: string }>;
  isFollowing: (userId: string) => boolean;
  getFollowersCount: (userId: string) => Promise<number>;
  getFollowingCount: (userId: string) => Promise<number>;
  refreshFollows: () => Promise<void>;
}

export const [FollowProvider, useFollow] = createContextHook<FollowState>(() => {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const notificationsContext = useNotifications();
  const createNotification = notificationsContext?.createNotification;

  const loadFollows = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    setIsLoading(true);
    try {
      // Load following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id, name, avatar, role, sport, verified
          )
        `)
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Error loading following:', followingError);
      } else {
        const followingUsers = (followingData || [])
          .map((item: any) => item.profiles)
          .filter(Boolean)
          .map((profile: any) => ({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
            sport: profile.sport,
            verified: profile.verified,
          }));
        setFollowing(followingUsers);
      }

      // Load followers
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id, name, avatar, role, sport, verified
          )
        `)
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Error loading followers:', followersError);
      } else {
        const followerUsers = (followersData || [])
          .map((item: any) => item.profiles)
          .filter(Boolean)
          .map((profile: any) => ({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
            sport: profile.sport,
            verified: profile.verified,
          }));
        setFollowers(followerUsers);
      }
    } catch (error) {
      console.error('Failed to load follows:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const isFollowing = useCallback((userId: string) => {
    return following.some(user => user.id === userId);
  }, [following]);

  const followUser = useCallback(async (userId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    // Prevent users from following themselves
    if (user.id === userId) {
      console.log('Attempted self-follow blocked for user:', user.id);
      return { error: 'You cannot follow yourself' };
    }

    // Check if already following
    if (isFollowing(userId)) {
      return { error: 'You are already following this user' };
    }

    try {
      console.log('Attempting to follow user:', userId, 'by user:', user.id);
      
      // First check if the target user exists
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !targetUser) {
        console.error('Target user not found:', userError);
        return { error: 'User not found' };
      }
      
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) {
        console.error('Follow error:', error);
        // Handle specific constraint violations
        if (error.code === '23514' && error.message.includes('follows_no_self_follow')) {
          return { error: 'You cannot follow yourself' };
        }
        if (error.code === '23505') {
          return { error: 'You are already following this user' };
        }
        if (error.code === '23503') {
          return { error: 'User not found' };
        }
        return { error: 'Failed to follow user. Please try again.' };
      }

      console.log('Successfully followed user:', userId);
      
      // Send follow notification (this will be handled by the database trigger)
      // But we can also send it manually if needed
      if (createNotification) {
        try {
          await createNotification(
            userId,
            'follow',
            'New Follower!',
            `${user.name || 'Someone'} started following you`,
            {
              followerId: user.id,
              followerName: user.name,
            }
          );
          console.log('Follow notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send follow notification:', notificationError);
          // Don't fail the follow if notification fails
        }
      } else {
        console.log('Notification system not available, skipping follow notification');
      }
      
      // Refresh follows
      await loadFollows();
      return {};
    } catch (error) {
      console.error('Follow failed:', error);
      return { error: 'Failed to follow user' };
    }
  }, [user, loadFollows, isFollowing, createNotification]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    // Prevent users from unfollowing themselves (shouldn't happen, but safety check)
    if (user.id === userId) {
      return { error: 'You cannot unfollow yourself' };
    }

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) {
        console.error('Unfollow error:', error);
        return { error: error.message };
      }

      // Refresh follows
      await loadFollows();
      return {};
    } catch (error) {
      console.error('Unfollow failed:', error);
      return { error: 'Failed to unfollow user' };
    }
  }, [user, loadFollows]);

  const getFollowersCount = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return 0;

    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        console.error('Error getting followers count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get followers count:', error);
      return 0;
    }
  }, []);

  const getFollowingCount = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return 0;

    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) {
        console.error('Error getting following count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get following count:', error);
      return 0;
    }
  }, []);

  const refreshFollows = useCallback(async () => {
    await loadFollows();
  }, [loadFollows]);

  return useMemo(() => ({
    followers,
    following,
    isLoading,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowersCount,
    getFollowingCount,
    refreshFollows,
  }), [followers, following, isLoading, followUser, unfollowUser, isFollowing, getFollowersCount, getFollowingCount, refreshFollows]);
});