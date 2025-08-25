import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
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
  updatePost: (
    postId: string,
    updates: { content?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | null }
  ) => Promise<{ error?: string }>;
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

      let postsData: any[] | null = null;
      let lastError: any = null;

      const profileFieldSets = [
        ['id', 'name', 'avatar', 'role'],
        ['id', 'full_name', 'avatar', 'role'],
        ['id', 'username', 'avatar', 'role'],
        ['id', 'email', 'avatar', 'role'],
      ];

      for (const fields of profileFieldSets) {
        try {
          const selectStr = `*, profiles!posts_user_id_fkey (${fields.join(',')})`;
          console.log('Trying select with fields:', fields.join(','));
          const { data, error } = await supabase
            .from('posts')
            .select(selectStr)
            .order('created_at', { ascending: false });

          if (!error) {
            postsData = data as any[];
            lastError = null;
            break;
          }

          lastError = error;
          console.warn('Select attempt failed with fields', fields.join(','), '->', getErrorMessage(error));
        } catch (err) {
          lastError = err;
          console.warn('Select attempt threw with fields', fields.join(','), '->', getErrorMessage(err));
        }
      }

      if (lastError) {
        const msg = getErrorMessage(lastError);
        console.error('Error loading posts from database:', msg, lastError);
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
        const profile = post.profiles ?? {};
        const resolvedName = profile.name ?? profile.full_name ?? profile.username ?? profile.email ?? 'Unknown User';
        console.log('Transforming post:', post.id, 'by user:', resolvedName);
        return {
          id: post.id,
          userId: post.user_id,
          userName: resolvedName,
          userAvatar: profile.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
          userRole: profile.role || 'athlete',
          content: post.description || post.title,
          media: post.image_url || post.video_url ? {
            type: post.video_url ? 'video' : 'image',
            url: post.video_url || post.image_url,
            thumbnail: post.image_url
          } : undefined,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: 0,
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

  // Upload media to Supabase Storage and return a public URL
  const uploadMediaIfNeeded = useCallback(async (uri?: string, mType?: 'image' | 'video'): Promise<string | undefined> => {
    if (!uri || !mType) return undefined;
    if (!isSupabaseConfigured) return uri;

    try {
      console.log('Posts: starting media upload', { uri, mType, platform: Platform.OS });
      const filenameFromUri = uri.split('?')[0]?.split('/').pop() ?? `media-${Date.now()}`;
      const extGuess = filenameFromUri.includes('.') ? filenameFromUri.split('.').pop() as string : (mType === 'image' ? 'jpg' : 'mp4');
      const contentType = mType === 'image' ? `image/${extGuess === 'jpg' ? 'jpeg' : extGuess}` : `video/${extGuess}`;
      const path = `posts/${user?.id}/${Date.now()}-${filenameFromUri}`;

      const resp = await fetch(uri);
      const blob = await resp.blob();
      console.log('Posts: fetched blob for upload', { size: (blob as any).size, type: (blob as any).type || contentType });

      const { error: uploadError } = await supabase.storage.from('posts').upload(path, blob, { contentType, upsert: false });
      if (uploadError) {
        console.error('Posts: storage upload failed, fallback to direct URI', uploadError);
        return uri;
      }

      const { data: pub } = supabase.storage.from('posts').getPublicUrl(path);
      const publicUrl: string | undefined = (pub && (pub as any).publicUrl) || undefined;
      console.log('Posts: uploaded media public URL', publicUrl);
      return publicUrl ?? uri;
    } catch (e) {
      console.error('Posts: upload exception, using direct URI', e);
      return uri;
    }
  }, [user]);

  // Create a new post
  const createPost = useCallback(async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    if (!user) return { error: 'User not authenticated' };
    
    if (!isSupabaseConfigured) {
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
      const profileExists = await ensureUserProfile();
      if (!profileExists) {
        return { error: 'Failed to create user profile. Please try again.' };
      }

      const uploadedUrl = await uploadMediaIfNeeded(mediaUrl, mediaType ?? undefined);

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: content.substring(0, 100),
          description: content,
          image_url: mediaType === 'image' ? uploadedUrl : undefined,
          video_url: mediaType === 'video' ? uploadedUrl : undefined,
          type: 'highlight',
        });

      if (error) {
        const msg = getErrorMessage(error);
        console.error('Error creating post:', msg, error);
        return { error: msg };
      }

      await loadPosts();
      return {};
    } catch (error) {
      console.error('Failed to create post:', getErrorMessage(error), error);
      return { error: 'Failed to create post. Please try again.' };
    }
  }, [user, loadPosts, ensureUserProfile, uploadMediaIfNeeded]);

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

  // Update a post
  const updatePost = useCallback(async (
    postId: string,
    updates: { content?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | null }
  ) => {
    if (!user) return { error: 'User not authenticated' };

    if (!isSupabaseConfigured) {
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                content: updates.content ?? p.content,
                media:
                  updates.mediaType === null
                    ? undefined
                    : updates.mediaUrl && updates.mediaType
                    ? { type: updates.mediaType, url: updates.mediaUrl }
                    : p.media,
              }
            : p,
        ),
      );
      return {};
    }

    try {
      let uploadedUrl: string | undefined = updates.mediaUrl;
      if (updates.mediaUrl && updates.mediaType && updates.mediaType !== null) {
        uploadedUrl = await uploadMediaIfNeeded(updates.mediaUrl, updates.mediaType);
      }

      const payload: Record<string, any> = {};
      if (typeof updates.content === 'string') {
        payload.description = updates.content;
        payload.title = updates.content.substring(0, 100);
      }
      if (updates.mediaType === null) {
        payload.image_url = null;
        payload.video_url = null;
      } else if (updates.mediaType === 'image') {
        payload.image_url = uploadedUrl;
        payload.video_url = null;
      } else if (updates.mediaType === 'video') {
        payload.video_url = uploadedUrl;
        payload.image_url = null;
      }

      const { error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        const msg = getErrorMessage(error);
        console.error('Error updating post:', msg, error);
        return { error: msg };
      }

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                content: typeof updates.content === 'string' ? updates.content : p.content,
                media:
                  updates.mediaType === null
                    ? undefined
                    : updates.mediaUrl && updates.mediaType
                    ? { type: updates.mediaType, url: uploadedUrl ?? updates.mediaUrl }
                    : p.media,
              }
            : p,
        ),
      );
      return {};
    } catch (error) {
      console.error('Failed to update post:', getErrorMessage(error), error);
      return { error: 'Failed to update post. Please try again.' };
    }
  }, [user, uploadMediaIfNeeded]);

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
    updatePost,
  }), [posts, isLoading, refreshPosts, createPost, likePost, deletePost, updatePost]);
});