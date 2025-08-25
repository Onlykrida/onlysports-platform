import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Post } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';
import { mockPosts } from '@/mocks/data';

function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  try {
    // Supabase errors are often plain objects
    const maybeMsg = (error as { message?: string; error_description?: string }).message ?? (error as any).error_description;
    if (typeof maybeMsg === 'string' && maybeMsg.length > 0) return maybeMsg;
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  refreshPosts: () => Promise<void>;
  createPost: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => Promise<{ error?: string }>;
  likePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<{ error?: string }>;
}

export const [PostsProvider, usePosts] = createContextHook<PostsState>(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  // Load posts from database or use mock data
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading posts... isSupabaseConfigured:', isSupabaseConfigured);
      
      if (!isSupabaseConfigured) {
        // Use mock data when database is not configured
        const sortedMockPosts = mockPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('Using mock posts:', sortedMockPosts.length, 'posts');
        setPosts(sortedMockPosts);
        return;
      }

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            avatar,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        const msg = getErrorMessage(error);
        console.error('Error loading posts from database:', msg, error);
        const sortedMockPosts = mockPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('Falling back to mock posts:', sortedMockPosts.length, 'posts');
        setPosts(sortedMockPosts);
        return;
      }

      console.log('Raw posts data from database:', postsData?.length || 0, 'posts');
      
      // Check which posts the current user has liked
      let userLikes: string[] = [];
      if (user && postsData?.length) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map((p: any) => p.id));
        
        userLikes = likesData?.map((like: any) => like.post_id) || [];
      }
      
      // Transform database posts to our Post interface
      const transformedPosts: Post[] = postsData?.map((post: any) => {
        console.log('Transforming post:', post.id, 'by user:', post.profiles?.name);
        return {
          id: post.id,
          userId: post.user_id,
          userName: post.profiles?.name || 'Unknown User',
          userAvatar: post.profiles?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
          userRole: post.profiles?.role || 'athlete',
          content: post.description || post.title,
          media: post.image_url || post.video_url ? {
            type: post.video_url ? 'video' : 'image',
            url: post.video_url || post.image_url,
            thumbnail: post.image_url
          } : undefined,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: 0, // Not implemented in database yet
          isLiked: userLikes.includes(post.id),
          createdAt: new Date(post.created_at),
        };
      }) || [];

      console.log('Transformed posts:', transformedPosts.length, 'posts');
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Failed to load posts:', getErrorMessage(error), error);
      setPosts(mockPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Ensure user profile exists in database
  const ensureUserProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return true;
    
    try {
      // Check if profile exists
      const { error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating profile for user:', user.id);
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            verified: user.verified || false,
            sport: user.sport,
            position: user.position,
            achievements: user.achievements || [],
            stats: user.stats || {},
          });
        
        if (createError) {
          console.error('Error creating profile:', getErrorMessage(createError), createError);
          return false;
        }
        
        console.log('Profile created successfully');
        return true;
      } else if (checkError) {
        console.error('Error checking profile:', getErrorMessage(checkError), checkError);
        return false;
      }
      
      // Profile exists
      return true;
    } catch (error) {
      console.error('Error ensuring profile exists:', getErrorMessage(error), error);
      return false;
    }
  }, [user]);

  // Create a new post
  const createPost = useCallback(async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    if (!user) return { error: 'User not authenticated' };
    
    if (!isSupabaseConfigured) {
      // Add to mock data when database is not configured
      const newPost: Post = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        userRole: user.role,
        content,
        media: mediaUrl ? {
          type: mediaType || 'image',
          url: mediaUrl,
        } : undefined,
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        createdAt: new Date(),
      };
      
      setPosts(prevPosts => [newPost, ...prevPosts]);
      return {};
    }

    try {
      // Ensure user profile exists before creating post
      const profileExists = await ensureUserProfile();
      if (!profileExists) {
        return { error: 'Failed to create user profile. Please try again.' };
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: content.substring(0, 100), // Use first 100 chars as title
          description: content,
          image_url: mediaType === 'image' ? mediaUrl : undefined,
          video_url: mediaType === 'video' ? mediaUrl : undefined,
          type: 'highlight', // Default type
        });

      if (error) {
        const msg = getErrorMessage(error);
        console.error('Error creating post:', msg, error);
        return { error: msg };
      }

      // Refresh posts to show the new one
      await loadPosts();
      return {};
    } catch (error) {
      console.error('Failed to create post:', getErrorMessage(error), error);
      return { error: 'Failed to create post. Please try again.' };
    }
  }, [user, loadPosts, ensureUserProfile]);

  // Like/unlike a post
  const likePost = useCallback(async (postId: string) => {
    if (!user || !isSupabaseConfigured) {
      // Optimistically update the UI for mock data
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            };
          }
          return post;
        })
      );
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        // Unlike post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) {
          console.error('Error unliking post:', getErrorMessage(error), error);
          return;
        }
      } else {
        // Like post
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId,
          });

        if (error) {
          console.error('Error liking post:', getErrorMessage(error), error);
          return;
        }
      }

      // Update local state optimistically
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Failed to toggle post like:', getErrorMessage(error), error);
    }
  }, [user, posts]);

  // Delete a post
  const deletePost = useCallback(async (postId: string) => {
    if (!user) return { error: 'User not authenticated' };
    
    if (!isSupabaseConfigured) {
      // Remove from mock data
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      return {};
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Ensure user can only delete their own posts

      if (error) {
        const msg = getErrorMessage(error);
        console.error('Error deleting post:', msg, error);
        return { error: msg };
      }

      // Remove from local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      return {};
    } catch (error) {
      console.error('Failed to delete post:', getErrorMessage(error), error);
      return { error: 'Failed to delete post. Please try again.' };
    }
  }, [user]);

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    await loadPosts();
  }, [loadPosts]);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Set up real-time subscriptions when database is configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const subscription = supabase
      .channel('posts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        (payload: any) => {
          console.log('Posts change detected:', payload);
          // Refresh posts when changes occur
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPosts]);

  return useMemo(() => ({
    posts,
    isLoading,
    refreshPosts,
    createPost,
    likePost,
    deletePost,
  }), [posts, isLoading, refreshPosts, createPost, likePost, deletePost]);
});