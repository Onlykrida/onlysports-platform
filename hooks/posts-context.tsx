import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Post, User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
import { useOpportunities } from './opportunities-context';
import { mockPosts } from '@/mocks/data';

function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  try {
    // Supabase errors are often plain objects
    const maybeMsg =
      (error as { message?: string; error_description?: string }).message ??
      (error as any).error_description;
    if (typeof maybeMsg === 'string' && maybeMsg.length > 0) return maybeMsg;
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

const PAGE_SIZE = 20;

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  refreshPosts: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (
    content: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
  ) => Promise<{ error?: string }>;
  likePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<{ error?: string }>;
  updatePost: (
    postId: string,
    updates: { content?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | null },
  ) => Promise<{ error?: string }>;
  getLikedAthletes: (userId: string) => Promise<User[]>;
}

export const [PostsProvider, usePosts] = createContextHook<PostsState>(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { user } = useAuth();
  const { opportunities } = useOpportunities();

  // Stable ref so the real-time subscription never needs to be re-created when
  // loadPosts is rebuilt (e.g. when user or opportunities change).
  const loadPostsRef = useRef<() => Promise<void>>(async () => {});

  // Load posts from database or use mock data
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      if (__DEV__) console.log('Loading posts... isSupabaseConfigured:', isSupabaseConfigured);

      if (!isSupabaseConfigured) {
        // Use mock data when database is not configured
        const sortedMockPosts = mockPosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        if (__DEV__) console.log('Using mock posts:', sortedMockPosts.length, 'posts');
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

      // Helper: race a Supabase query against a timeout
      const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timed out')), ms),
          ),
        ]);

      for (const fields of profileFieldSets) {
        try {
          const selectStr = `*, profiles!posts_user_id_fkey (${fields.join(',')})`;
          if (__DEV__) console.log('Trying select with fields:', fields.join(','));
          const query = supabase
            .from('posts')
            .select(selectStr)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE);
          const { data, error } = (await withTimeout(
            query.then((r: any) => r),
            8000,
          )) as { data: any[] | null; error: any };

          if (!error) {
            postsData = data as any[];
            lastError = null;
            break;
          }

          lastError = error;
          console.warn(
            'Select attempt failed with fields',
            fields.join(','),
            '->',
            getErrorMessage(error),
          );
        } catch (err) {
          lastError = err;
          console.warn(
            'Select attempt threw with fields',
            fields.join(','),
            '->',
            getErrorMessage(err),
          );
        }
      }

      if (lastError) {
        const msg = getErrorMessage(lastError);
        console.error('Error loading posts from database:', msg, lastError);
        const sortedMockPosts = mockPosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        if (__DEV__) console.log('Falling back to mock posts:', sortedMockPosts.length, 'posts');
        setPosts(sortedMockPosts);
        return;
      }

      if (__DEV__) console.log('Raw posts data from database:', postsData?.length || 0, 'posts');

      // Check which posts the current user has liked
      let userLikes: string[] = [];
      if (user && postsData?.length) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in(
            'post_id',
            postsData.map((p: any) => p.id),
          );

        userLikes = likesData?.map((like: any) => like.post_id) || [];
      }

      // Transform database posts to our Post interface, filtering out posts from deleted users
      const transformedPosts: Post[] =
        postsData
          ?.filter((post: any) => {
            // Filter out posts where the profile is null (user was deleted)
            return post.profiles !== null;
          })
          .map((post: any) => {
            const profile = post.profiles ?? {};
            const resolvedName =
              profile.name ??
              profile.full_name ??
              profile.username ??
              profile.email ??
              'Unknown User';
            if (__DEV__) console.log('Transforming post:', post.id, 'by user:', resolvedName);

            // Log media information
            const hasVideo = !!post.video_url;
            const hasImage = !!post.image_url;
            if (hasVideo) {
              if (__DEV__) console.log('[Posts] Post has video:', post.id, 'URL:', post.video_url);
            }
            if (hasImage) {
              if (__DEV__) console.log('[Posts] Post has image:', post.id, 'URL:', post.image_url);
            }

            return {
              id: post.id,
              userId: post.user_id,
              userName: resolvedName,
              userAvatar:
                profile.avatar ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
              userRole: profile.role || 'athlete',
              content: post.description || post.title,
              media:
                post.image_url || post.video_url
                  ? {
                      type: post.video_url ? 'video' : 'image',
                      url: post.video_url || post.image_url,
                      thumbnail: post.image_url,
                    }
                  : undefined,
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              shares: 0,
              isLiked: userLikes.includes(post.id),
              createdAt: new Date(post.created_at),
            };
          }) || [];

      if (__DEV__) console.log('Transformed posts:', transformedPosts.length, 'posts');

      // Determine if there are more posts to load
      setHasMore((postsData?.length ?? 0) >= PAGE_SIZE);

      // Add recent opportunities (created within last 5 days) to the feed
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const categoryMapping: Record<
        string,
        'tryout' | 'tournament' | 'sponsorship' | 'scholarship' | 'job' | 'camp'
      > = {
        tryouts: 'tryout',
        tournaments: 'tournament',
        sponsorships: 'sponsorship',
        scholarships: 'scholarship',
        contracts: 'job',
      };

      const recentOpportunities = opportunities
        .filter((opp) => new Date(opp.createdAt) >= fiveDaysAgo)
        .map(
          (opp): Post => ({
            id: `opp-${opp.id}`,
            userId: opp.teamId,
            userName: opp.teamName || 'Team',
            userAvatar:
              opp.teamAvatar ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
            userRole: 'team' as const,
            content: opp.description,
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false,
            createdAt: new Date(opp.createdAt),
            isOpportunity: true,
            opportunityData: {
              type: categoryMapping[opp.type] || 'tryout',
              sport: opp.sport || '',
              location: opp.location,
              deadline: opp.deadline,
              paid: opp.paid,
              applicationsCount: opp.applicationsCount,
              hasApplied: opp.hasApplied,
            },
          }),
        );

      if (__DEV__) console.log('Recent opportunities for feed:', recentOpportunities.length);

      // Combine posts and opportunities, sort by date
      const allPosts = [...transformedPosts, ...recentOpportunities].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setPosts(allPosts);
    } catch (error) {
      console.error('Failed to load posts:', getErrorMessage(error), error);
      setPosts(
        mockPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, opportunities]);

  // Keep the ref in sync so the subscription always calls the latest version
  // without needing to be re-subscribed.
  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  // Load more posts (cursor-based pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isSupabaseConfigured) return;

    const dbPosts = posts.filter((p) => !p.id.startsWith('opp-'));
    if (dbPosts.length === 0) return;

    const lastPost = dbPosts[dbPosts.length - 1];
    const cursor = new Date(lastPost.createdAt).toISOString();

    setIsLoadingMore(true);
    try {
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
          const { data, error } = await supabase
            .from('posts')
            .select(selectStr)
            .order('created_at', { ascending: false })
            .lt('created_at', cursor)
            .limit(PAGE_SIZE);

          if (!error) {
            postsData = data as any[];
            lastError = null;
            break;
          }
          lastError = error;
        } catch (err) {
          lastError = err;
        }
      }

      if (lastError || !postsData?.length) {
        if (!postsData?.length) setHasMore(false);
        return;
      }

      // Check which posts the current user has liked
      let userLikes: string[] = [];
      if (user && postsData.length) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in(
            'post_id',
            postsData.map((p: any) => p.id),
          );
        userLikes = likesData?.map((like: any) => like.post_id) || [];
      }

      const newPosts: Post[] = postsData
        .filter((post: any) => post.profiles !== null)
        .map((post: any) => {
          const profile = post.profiles ?? {};
          const resolvedName =
            profile.name ??
            profile.full_name ??
            profile.username ??
            profile.email ??
            'Unknown User';
          return {
            id: post.id,
            userId: post.user_id,
            userName: resolvedName,
            userAvatar:
              profile.avatar ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
            userRole: profile.role || 'athlete',
            content: post.description || post.title,
            media:
              post.image_url || post.video_url
                ? {
                    type: post.video_url ? ('video' as const) : ('image' as const),
                    url: post.video_url || post.image_url,
                    thumbnail: post.image_url,
                  }
                : undefined,
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            shares: 0,
            isLiked: userLikes.includes(post.id),
            createdAt: new Date(post.created_at),
          };
        });

      if (postsData.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newPosts.filter((p) => !existingIds.has(p.id));
        const combined = [...prev, ...uniqueNew];
        return combined.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
    } catch (error) {
      console.error('Failed to load more posts:', getErrorMessage(error), error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, posts, user]);

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
        if (__DEV__) console.log('Profile not found, creating profile for user:', user.id);
        const { error: createError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
        });

        if (createError) {
          console.error('Error creating profile:', getErrorMessage(createError), createError);
          return false;
        }

        if (__DEV__) console.log('Profile created successfully');
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
      if (__DEV__) console.log('Posts: Checking "posts" bucket configuration...');

      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

      if (bucketsError) {
        console.error('Posts: Failed to list buckets:', bucketsError);
        return false;
      }

      if (__DEV__)
        console.log(
          'Posts: Available buckets:',
          buckets?.map((b: any) => `${b.id || b.name} (public: ${b.public})`).join(', '),
        );

      const postsBucket = buckets?.find((b: any) => b.id === 'posts' || b.name === 'posts');

      if (!postsBucket) {
        console.error('Posts: "posts" bucket not found.');
        console.error(
          'Posts: Available buckets:',
          buckets?.map((b: any) => b.id || b.name).join(', ') || 'none',
        );
        console.error('\nSTORAGE SETUP REQUIRED');
        console.error('Please create a storage bucket named "posts" in Supabase Dashboard');
        return false;
      }

      if (__DEV__) console.log('Posts: "posts" bucket found:', postsBucket);

      if (!postsBucket.public) {
        console.warn('Posts: "posts" bucket is not public. Media may not be visible.');
        console.warn('Posts: Go to Storage > posts > Settings > Toggle "Public bucket" ON');
      } else {
        if (__DEV__) console.log('Posts: "posts" bucket is public and ready');
      }

      return true;
    } catch (error) {
      console.error('Posts: Error checking storage bucket:', error);
      return false;
    }
  }, []);

  // Upload media to Supabase Storage and return a public URL
  const uploadMediaIfNeeded = useCallback(
    async (uri?: string, mType?: 'image' | 'video'): Promise<string | undefined> => {
      if (!uri || !mType) return undefined;
      if (!isSupabaseConfigured) {
        if (__DEV__) console.log('Posts: Supabase not configured, using direct URI');
        return uri;
      }

      if (!user?.id) {
        console.error('Posts: No user ID available for upload');
        return uri;
      }

      try {
        if (__DEV__)
          console.log('Posts: Starting media upload', {
            uri,
            mType,
            platform: Platform.OS,
            userId: user.id,
          });

        // Check if posts bucket exists
        const bucketExists = await checkStorageBucket();

        if (!bucketExists) {
          console.error('Posts: "posts" bucket not configured. Using fallback URI.');
          return uri;
        }

        // Generate a unique filename with proper folder structure
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = mType === 'image' ? 'jpg' : 'mp4';
        const filename = `${timestamp}-${randomId}.${extension}`;
        const mediaFolder = mType === 'image' ? 'images' : 'videos';
        const path = `${mediaFolder}/${user.id}/${filename}`;

        if (__DEV__) console.log('Posts: Upload path:', path, '| Bucket: posts');

        // Fetch the file and create blob
        if (__DEV__) console.log('Posts: fetching file from URI...');
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        if (__DEV__)
          console.log('Posts: blob created', {
            size: blob.size,
            type: blob.type,
            sizeInMB: (blob.size / (1024 * 1024)).toFixed(2),
          });

        if (blob.size === 0) {
          throw new Error('Blob is empty');
        }

        // Set content type based on media type
        const contentType = mType === 'image' ? 'image/jpeg' : 'video/mp4';
        if (__DEV__) console.log('Posts: uploading with content type:', contentType);

        // Upload to Supabase Storage - posts bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, blob, {
            contentType,
            upsert: false,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Posts: Storage upload failed', {
            bucket: 'posts',
            path,
            error: uploadError,
            message: uploadError.message,
          });

          if (
            uploadError.message?.includes('policy') ||
            uploadError.message?.includes('permission')
          ) {
            console.error('STORAGE PERMISSIONS ERROR');
            console.error('The "posts" bucket has permission issues.');
            console.error('Check: Supabase Dashboard > Storage > posts > Policies');
          }

          return uri;
        }

        if (__DEV__) console.log('Posts: Upload successful', { path, size: blob.size });

        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage.from('posts').getPublicUrl(path);

        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) {
          console.error('Posts: Failed to get public URL');
          return uri;
        }

        if (__DEV__) console.log(`Posts: Public URL generated for ${mType}:`, publicUrl);
        return publicUrl;
      } catch (error) {
        console.error('Posts: upload exception', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Provide more specific error information
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            console.error(
              'Posts: Failed to fetch the media file. This might be a network issue or the file might not be accessible.',
            );
          } else if (error.message.includes('blob')) {
            console.error('Posts: Failed to create blob from the media file.');
          }
        }

        return uri; // Fallback to direct URI
      }
    },
    [user, checkStorageBucket],
  );

  // Create a new post
  const createPost = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
      if (!user) return { error: 'User not authenticated' };

      if (!isSupabaseConfigured) {
        const newPost: Post = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          userAvatar:
            user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
          userRole: user.role,
          content,
          media: mediaUrl
            ? {
                type: mediaType || 'image',
                url: mediaUrl,
              }
            : undefined,
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
          createdAt: new Date(),
        };
        setPosts((prevPosts) => [newPost, ...prevPosts]);
        return {};
      }

      try {
        const profileExists = await ensureUserProfile();
        if (!profileExists) {
          return { error: 'Failed to create user profile. Please try again.' };
        }

        const uploadedUrl = await uploadMediaIfNeeded(mediaUrl, mediaType ?? undefined);

        const { error } = await supabase.from('posts').insert({
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
    },
    [user, loadPosts, ensureUserProfile, uploadMediaIfNeeded],
  );

  // Like/unlike a post
  const likePost = useCallback(
    async (postId: string) => {
      if (!user) {
        if (__DEV__) console.log('User not authenticated, cannot like post');
        return;
      }

      const post = posts.find((p) => p.id === postId);
      if (!post) {
        if (__DEV__) console.log('Post not found:', postId);
        return;
      }

      if (__DEV__)
        console.log(
          'Toggling like for post:',
          postId,
          'current isLiked:',
          post.isLiked,
          'current likes:',
          post.likes,
        );

      if (!isSupabaseConfigured) {
        // Optimistically update the UI for mock data
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              const newIsLiked = !p.isLiked;
              const newLikes = newIsLiked ? p.likes + 1 : p.likes - 1;
              if (__DEV__)
                console.log('Mock data update - newIsLiked:', newIsLiked, 'newLikes:', newLikes);
              return {
                ...p,
                isLiked: newIsLiked,
                likes: Math.max(0, newLikes), // Ensure likes never go below 0
              };
            }
            return p;
          }),
        );
        return;
      }

      // Optimistically update UI first for better UX
      const wasLiked = post.isLiked;
      const newIsLiked = !wasLiked;
      const optimisticLikes = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: newIsLiked,
              likes: optimisticLikes,
            };
          }
          return p;
        }),
      );

      try {
        if (wasLiked) {
          // Unlike post
          if (__DEV__) console.log('Unliking post:', postId);
          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);

          if (error) {
            console.error('Error unliking post:', getErrorMessage(error), error);
            // Revert optimistic update on error
            setPosts((prevPosts) =>
              prevPosts.map((p) => {
                if (p.id === postId) {
                  return {
                    ...p,
                    isLiked: wasLiked,
                    likes: post.likes,
                  };
                }
                return p;
              }),
            );
            return;
          }
          if (__DEV__) console.log('Successfully unliked post');
        } else {
          // Like post
          if (__DEV__) console.log('Liking post:', postId);
          const { error } = await supabase.from('likes').insert({
            user_id: user.id,
            post_id: postId,
          });

          if (error) {
            console.error('Error liking post:', getErrorMessage(error), error);
            // Revert optimistic update on error
            setPosts((prevPosts) =>
              prevPosts.map((p) => {
                if (p.id === postId) {
                  return {
                    ...p,
                    isLiked: wasLiked,
                    likes: post.likes,
                  };
                }
                return p;
              }),
            );
            return;
          }

          if (__DEV__) console.log('Successfully liked post');

          // Notification will be sent automatically by database trigger
        }

        // Don't reload posts immediately - let the optimistic update persist
        // The real-time subscription will eventually sync the correct counts
      } catch (error) {
        console.error('Failed to toggle post like:', getErrorMessage(error), error);
        // Revert optimistic update on error
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: wasLiked,
                likes: post.likes,
              };
            }
            return p;
          }),
        );
      }
    },
    [user, posts],
  );

  // Update a post
  const updatePost = useCallback(
    async (
      postId: string,
      updates: { content?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | null },
    ) => {
      if (!user) return { error: 'User not authenticated' };

      if (!isSupabaseConfigured) {
        setPosts((prev) =>
          prev.map((p) =>
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

        setPosts((prev) =>
          prev.map((p) =>
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
    },
    [user, uploadMediaIfNeeded],
  );

  // Delete a post
  const deletePost = useCallback(
    async (postId: string) => {
      if (!user) return { error: 'User not authenticated' };

      if (!isSupabaseConfigured) {
        // Remove from mock data
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
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
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        return {};
      } catch (error) {
        console.error('Failed to delete post:', getErrorMessage(error), error);
        return { error: 'Failed to delete post. Please try again.' };
      }
    },
    [user],
  );

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    setHasMore(true);
    await loadPosts();
  }, [loadPosts]);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Set up real-time subscriptions when database is configured.
  // Uses loadPostsRef so this effect never needs to be torn down and
  // re-created when loadPosts rebuilds due to user/opportunities changes.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('posts_and_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload: any) => {
        if (__DEV__) console.log('Posts change detected:', payload);

        if (payload.eventType === 'INSERT' && payload.new) {
          // A new post was created by another user — fetch just that row and
          // prepend it rather than reloading the entire feed.
          loadPostsRef.current();
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updated = payload.new;
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if (p.id !== updated.id) return p;
              return {
                ...p,
                content: updated.description || updated.title || p.content,
                likes: updated.likes_count ?? p.likes,
                comments: updated.comments_count ?? p.comments,
                media:
                  updated.image_url || updated.video_url
                    ? {
                        type: updated.video_url ? ('video' as const) : ('image' as const),
                        url: updated.video_url || updated.image_url,
                        thumbnail: updated.image_url,
                      }
                    : p.media,
              };
            }),
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = payload.old.id;
          if (deletedId) {
            setPosts((prevPosts) => prevPosts.filter((p) => p.id !== deletedId));
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload: any) => {
        if (__DEV__) console.log('Likes change detected:', payload);
        // Skip realtime updates for current user's own likes (already handled optimistically)
        if (payload.eventType === 'INSERT' && payload.new) {
          const { post_id, user_id } = payload.new;
          if (user_id === user?.id) return; // Already updated optimistically
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if (p.id === post_id) {
                return { ...p, likes: p.likes + 1 };
              }
              return p;
            }),
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const { post_id, user_id } = payload.old;
          if (user_id === user?.id) return; // Already updated optimistically
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if (p.id === post_id) {
                return { ...p, likes: Math.max(0, p.likes - 1) };
              }
              return p;
            }),
          );
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          if (__DEV__)
            console.log('Profile change detected:', payload?.new?.id || payload?.old?.id);
          if (payload.eventType === 'DELETE') {
            // When a user is deleted, remove their posts from local state immediately.
            const deletedUserId = payload.old?.id;
            if (deletedUserId) {
              if (__DEV__)
                console.log('User deleted, removing their posts from local state:', deletedUserId);
              setPosts((prevPosts) => prevPosts.filter((post) => post.userId !== deletedUserId));
            }
            // No need to reload — we've already cleaned up above.
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Patch author meta (name/avatar/role) in every post that belongs to
            // this profile without reloading the whole feed.
            const profile = payload.new;
            const resolvedName =
              profile.name ??
              profile.full_name ??
              profile.username ??
              profile.email ??
              'Unknown User';
            setPosts((prevPosts) =>
              prevPosts.map((p) => {
                if (p.userId !== profile.id) return p;
                return {
                  ...p,
                  userName: resolvedName || p.userName,
                  userAvatar: profile.avatar || p.userAvatar,
                  userRole: profile.role || p.userRole,
                };
              }),
            );
          }
          // INSERT of a new profile doesn't affect existing posts — nothing to do.
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // Empty deps — the channel is created once; handlers reach current state via
    // the ref (loadPosts) or closures that only read state via setPosts updater form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLikedAthletes = useCallback(async (userId: string): Promise<User[]> => {
    if (!isSupabaseConfigured || !userId) return [];

    try {
      if (__DEV__) console.log('getLikedAthletes: Fetching liked athletes for user', userId);

      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .limit(100);

      if (likesError || !likesData?.length) {
        if (__DEV__) console.log('getLikedAthletes: No likes found or error', likesError);
        return [];
      }

      const postIds = likesData.map((l: any) => l.post_id);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('user_id')
        .in('id', postIds)
        .limit(100);

      if (postsError || !postsData?.length) {
        if (__DEV__) console.log('getLikedAthletes: No posts found or error', postsError);
        return [];
      }

      const authorIds = [...new Set(postsData.map((p: any) => p.user_id as string))].filter(
        (id) => id !== userId,
      );

      if (authorIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(
          'id, name, avatar, role, sport, position, verified, email, created_at, role_specific_data',
        )
        .in('id', authorIds)
        .eq('role', 'athlete')
        .limit(100);

      if (profilesError || !profilesData?.length) {
        if (__DEV__)
          console.log('getLikedAthletes: No athlete profiles found or error', profilesError);
        return [];
      }

      const athletes: User[] = profilesData.map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        sport: profile.sport,
        position: profile.position,
        verified: profile.verified,
        email: profile.email,
        createdAt: new Date(profile.created_at),
        roleSpecificData: profile.role_specific_data || {},
      }));

      if (__DEV__) console.log('getLikedAthletes: Found', athletes.length, 'liked athletes');
      return athletes;
    } catch (error) {
      console.error('getLikedAthletes: Error', error);
      return [];
    }
  }, []);

  return useMemo(
    () => ({
      posts,
      isLoading,
      hasMore,
      isLoadingMore,
      refreshPosts,
      loadMore,
      createPost,
      likePost,
      deletePost,
      updatePost,
      getLikedAthletes,
    }),
    [
      posts,
      isLoading,
      hasMore,
      isLoadingMore,
      refreshPosts,
      loadMore,
      createPost,
      likePost,
      deletePost,
      updatePost,
      getLikedAthletes,
    ],
  );
});
