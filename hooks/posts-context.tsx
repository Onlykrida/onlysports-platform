import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Post } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
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
      
      // Transform database posts to our Post interface, filtering out posts from deleted users
      const transformedPosts: Post[] = postsData?.filter((post: any) => {
        // Filter out posts where the profile is null (user was deleted)
        return post.profiles !== null;
      }).map((post: any) => {
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

  // Check if storage bucket is properly configured
  const checkStorageBucket = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    
    try {
      console.log('Posts: Checking storage bucket configuration...');
      
      // Try to list buckets to see if 'posts' bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Posts: Failed to list buckets:', bucketsError);
        return false;
      }
      
      const postsBucket = buckets?.find((bucket: any) => bucket.id === 'posts');
      if (!postsBucket) {
        console.error('Posts: "posts" bucket does not exist. Please create it in your Supabase dashboard.');
        console.error('Posts: Go to Storage > Create bucket > Name: "posts" > Public: ON');
        return false;
      }
      
      console.log('Posts: Storage bucket found:', postsBucket);
      
      if (!postsBucket.public) {
        console.warn('Posts: "posts" bucket is not public. Media may not be visible to other users.');
        console.warn('Posts: Go to Storage > posts bucket settings > Toggle "Public bucket" ON');
      }
      
      return true;
    } catch (error) {
      console.error('Posts: Error checking storage bucket:', error);
      return false;
    }
  }, []);

  // Upload media to Supabase Storage and return a public URL
  const uploadMediaIfNeeded = useCallback(async (uri?: string, mType?: 'image' | 'video'): Promise<string | undefined> => {
    if (!uri || !mType) return undefined;
    if (!isSupabaseConfigured) {
      console.log('Posts: Supabase not configured, using direct URI');
      return uri;
    }

    if (!user?.id) {
      console.error('Posts: No user ID available for upload');
      return uri;
    }

    try {
      console.log('Posts: starting media upload', { uri, mType, platform: Platform.OS, userId: user.id });
      
      // Check storage bucket configuration first
      const bucketConfigured = await checkStorageBucket();
      if (!bucketConfigured) {
        console.warn('Posts: Storage bucket not properly configured, using direct URI');
        return uri;
      }
      
      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = mType === 'image' ? 'jpg' : 'mp4';
      const filename = `${timestamp}-${randomId}.${extension}`;
      const path = `posts/${user.id}/${filename}`;
      
      console.log('Posts: upload path:', path);

      // Fetch the file and create blob
      console.log('Posts: fetching file from URI...');
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Posts: blob created', { 
        size: blob.size, 
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2)
      });

      if (blob.size === 0) {
        throw new Error('Blob is empty');
      }

      // Set content type based on media type
      const contentType = mType === 'image' ? 'image/jpeg' : 'video/mp4';
      console.log('Posts: uploading with content type:', contentType);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, blob, { 
          contentType,
          upsert: false,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Posts: storage upload failed', {
          error: uploadError,
          message: uploadError.message,
          statusCode: uploadError.statusCode
        });
        
        // Check if it's a bucket configuration issue
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('policy')) {
          console.error('Posts: This appears to be a storage bucket configuration issue.');
          console.error('Posts: Please run the storage setup SQL script in your Supabase dashboard.');
        }
        
        return uri; // Fallback to direct URI
      }

      console.log('Posts: upload successful', uploadData);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('posts')
        .getPublicUrl(path);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        console.error('Posts: failed to get public URL');
        return uri;
      }

      console.log('Posts: public URL generated:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('Posts: upload exception', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          console.error('Posts: Failed to fetch the media file. This might be a network issue or the file might not be accessible.');
        } else if (error.message.includes('blob')) {
          console.error('Posts: Failed to create blob from the media file.');
        }
      }
      
      return uri; // Fallback to direct URI
    }
  }, [user, checkStorageBucket]);

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
    if (!user) {
      console.log('User not authenticated, cannot like post');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) {
      console.log('Post not found:', postId);
      return;
    }

    console.log('Toggling like for post:', postId, 'current isLiked:', post.isLiked, 'current likes:', post.likes);

    if (!isSupabaseConfigured) {
      // Optimistically update the UI for mock data
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            const newIsLiked = !p.isLiked;
            const newLikes = newIsLiked ? p.likes + 1 : p.likes - 1;
            console.log('Mock data update - newIsLiked:', newIsLiked, 'newLikes:', newLikes);
            return {
              ...p,
              isLiked: newIsLiked,
              likes: Math.max(0, newLikes), // Ensure likes never go below 0
            };
          }
          return p;
        })
      );
      return;
    }

    // Optimistically update UI first for better UX
    const wasLiked = post.isLiked;
    const newIsLiked = !wasLiked;
    const optimisticLikes = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
    
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: newIsLiked,
            likes: optimisticLikes,
          };
        }
        return p;
      })
    );

    try {
      if (wasLiked) {
        // Unlike post
        console.log('Unliking post:', postId);
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) {
          console.error('Error unliking post:', getErrorMessage(error), error);
          // Revert optimistic update on error
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  isLiked: wasLiked,
                  likes: post.likes,
                };
              }
              return p;
            })
          );
          return;
        }
        console.log('Successfully unliked post');
      } else {
        // Like post
        console.log('Liking post:', postId);
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId,
          });

        if (error) {
          console.error('Error liking post:', getErrorMessage(error), error);
          // Revert optimistic update on error
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  isLiked: wasLiked,
                  likes: post.likes,
                };
              }
              return p;
            })
          );
          return;
        }
        
        console.log('Successfully liked post');
        
        // Notification will be sent automatically by database trigger
      }

      // Don't reload posts immediately - let the optimistic update persist
      // The real-time subscription will eventually sync the correct counts
      
    } catch (error) {
      console.error('Failed to toggle post like:', getErrorMessage(error), error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: wasLiked,
              likes: post.likes,
            };
          }
          return p;
        })
      );
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

    const channel = supabase
      .channel('posts_and_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload: any) => {
        console.log('Posts change detected:', payload);
        // Reload posts for any post changes except optimistic like updates
        loadPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload: any) => {
        console.log('Likes change detected:', payload);
        // When likes change, update the specific post's like count and status
        if (payload.eventType === 'INSERT' && payload.new) {
          const { post_id, user_id } = payload.new;
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === post_id) {
                return {
                  ...p,
                  likes: p.likes + 1,
                  isLiked: user_id === user?.id ? true : p.isLiked,
                };
              }
              return p;
            })
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const { post_id, user_id } = payload.old;
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === post_id) {
                return {
                  ...p,
                  likes: Math.max(0, p.likes - 1),
                  isLiked: user_id === user?.id ? false : p.isLiked,
                };
              }
              return p;
            })
          );
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        console.log('Profile change detected (reload posts to refresh author meta):', payload?.new?.id || payload?.old?.id);
        if (payload.eventType === 'DELETE') {
          // When a user is deleted, remove their posts from the local state immediately
          const deletedUserId = payload.old?.id;
          if (deletedUserId) {
            console.log('User deleted, removing their posts from local state:', deletedUserId);
            setPosts(prevPosts => prevPosts.filter(post => post.userId !== deletedUserId));
          }
        }
        // Always reload to get the latest data
        loadPosts();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
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