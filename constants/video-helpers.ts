import { supabase, isSupabaseConfigured } from './supabase';

const SIGNED_URL_CACHE = new Map<string, { url: string; expiresAt: number }>();
const CACHE_DURATION = 60 * 60 * 1000;

export async function getSignedVideoUrl(publicUrl: string): Promise<string> {
  if (!isSupabaseConfigured || !publicUrl) {
    return publicUrl;
  }

  const cached = SIGNED_URL_CACHE.get(publicUrl);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('[VideoHelpers] Using cached signed URL');
    return cached.url;
  }

  try {
    if (!publicUrl.includes('supabase.co')) {
      return publicUrl;
    }

    const urlObj = new URL(publicUrl);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/posts\/(.+)/);
    
    if (!pathMatch || !pathMatch[1]) {
      console.warn('[VideoHelpers] Could not extract file path from URL');
      return publicUrl;
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    console.log('[VideoHelpers] Generating signed URL for:', filePath);

    const { data, error } = await supabase.storage
      .from('posts')
      .createSignedUrl(filePath, 60 * 60 * 24);

    if (error || !data?.signedUrl) {
      console.error('[VideoHelpers] Failed to create signed URL:', error);
      return publicUrl;
    }

    SIGNED_URL_CACHE.set(publicUrl, {
      url: data.signedUrl,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    console.log('[VideoHelpers] Signed URL cached');
    return data.signedUrl;
  } catch (err) {
    console.error('[VideoHelpers] Error generating signed URL:', err);
    return publicUrl;
  }
}

export async function prefetchSignedUrls(urls: string[]): Promise<void> {
  console.log('[VideoHelpers] Prefetching', urls.length, 'signed URLs');
  
  const uncachedUrls = urls.filter(url => {
    const cached = SIGNED_URL_CACHE.get(url);
    return !cached || cached.expiresAt <= Date.now();
  });

  if (uncachedUrls.length === 0) {
    console.log('[VideoHelpers] All URLs already cached');
    return;
  }

  await Promise.all(
    uncachedUrls.map(url => getSignedVideoUrl(url).catch(err => {
      console.error('[VideoHelpers] Prefetch error for URL:', err);
    }))
  );
}

export function clearSignedUrlCache(): void {
  console.log('[VideoHelpers] Clearing signed URL cache');
  SIGNED_URL_CACHE.clear();
}

export function getCachedSignedUrl(publicUrl: string): string | null {
  const cached = SIGNED_URL_CACHE.get(publicUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }
  return null;
}
