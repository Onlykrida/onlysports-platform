import { supabase } from '@/constants/supabase';

/**
 * Signed-URL resolution for private media buckets.
 *
 * WHY THIS EXISTS
 * ---------------
 * `avatars`, `posts` and `videos` were created with `public = true`, so every
 * uploaded file is readable by anyone with the URL — no login, no token, no
 * expiry. Verified 2026-09-10: a minor's avatar, post image and post video all
 * returned HTTP 200 to an unauthenticated request.
 *
 * `test-videos` (created eight months later) is private, with the migration
 * comment "PRIVATE by design: these are frequently minors' videos". The same
 * reasoning applies to a face and a highlight clip, so the older buckets must
 * become private too.
 *
 * The blocker is that `getPublicUrl()` does not contact the server: it
 * string-builds `/object/public/<bucket>/<path>` and always "succeeds". Against
 * a private bucket that URL 400s at render time. So the read path must move to
 * signed URLs BEFORE any bucket is flipped, or media breaks instantly.
 *
 * BACKWARD COMPATIBILITY
 * ----------------------
 * Rows already store absolute public URLs. `toStoragePath()` parses those back
 * into (bucket, path) so existing records keep working after the flip without a
 * data migration.
 */

/** Buckets whose contents may depict a minor and must not be world-readable. */
export const PRIVATE_MEDIA_BUCKETS = ['avatars', 'posts', 'videos', 'test-videos'] as const;
export type MediaBucket = (typeof PRIVATE_MEDIA_BUCKETS)[number];

/** Signed URL lifetime. Long enough for a feed scroll, short enough that a
 *  leaked link dies quickly. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Refresh this long before expiry so an in-flight render never 400s. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes

export type StorageRef = { bucket: MediaBucket; path: string };

/**
 * Normalise anything we might hold for a media item into (bucket, path).
 *
 * Accepts:
 *   - a full public URL   .../storage/v1/object/public/posts/images/u/f.jpg
 *   - a full signed URL   .../storage/v1/object/sign/posts/images/u/f.jpg?token=..
 *   - a bare path         posts/images/u/f.jpg
 *
 * Returns null for anything else (data: URIs, file:// URIs, remote CDN images,
 * empty strings) — those must be rendered as-is, not signed.
 */
export function toStorageRef(input: string | null | undefined): StorageRef | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;

  // Never attempt to sign a local or inline URI.
  if (value.startsWith('data:') || value.startsWith('file:') || value.startsWith('content:')) {
    return null;
  }

  const marker = /\/storage\/v1\/object\/(?:public|sign|authenticated)\//;
  const match = value.match(marker);

  let remainder: string;
  if (match && match.index !== undefined) {
    remainder = value.slice(match.index + match[0].length);
  } else if (/^https?:\/\//i.test(value)) {
    // An absolute URL that is not Supabase storage — e.g. a seeded Unsplash
    // image. Leave it alone.
    return null;
  } else {
    remainder = value;
  }

  // Drop any query string (signed URLs carry ?token=...).
  remainder = remainder.split('?')[0];
  remainder = remainder.replace(/^\/+/, '');

  const slash = remainder.indexOf('/');
  if (slash <= 0) return null;

  const bucket = remainder.slice(0, slash);
  const path = remainder.slice(slash + 1);
  if (!path) return null;

  if (!(PRIVATE_MEDIA_BUCKETS as readonly string[]).includes(bucket)) return null;

  return { bucket: bucket as MediaBucket, path: decodeURIComponent(path) };
}

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

const cacheKey = (ref: StorageRef) => `${ref.bucket}/${ref.path}`;

/** Drop a cached signature — call after replacing a file at the same path. */
export function invalidateSignedUrl(input: string | StorageRef): void {
  const ref = typeof input === 'string' ? toStorageRef(input) : input;
  if (ref) cache.delete(cacheKey(ref));
}

export function clearSignedUrlCache(): void {
  cache.clear();
}

/**
 * Resolve a stored media reference to a URL that will actually load.
 *
 * Returns the input unchanged when it is not Supabase storage (remote images,
 * data URIs), so callers can use this unconditionally.
 */
export async function resolveMediaUrl(
  input: string | null | undefined,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!input) return null;

  const ref = toStorageRef(input);
  if (!ref) return input; // not ours to sign

  const key = cacheKey(ref);
  const hit = cache.get(key);
  if (hit && hit.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return hit.url;
  }

  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, ttlSeconds);

  if (error || !data?.signedUrl) {
    // Surface nothing renderable rather than a URL that will 400. Callers show
    // their placeholder.
    if (__DEV__) console.warn('resolveMediaUrl: failed to sign', key, error?.message);
    return null;
  }

  cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data.signedUrl;
}

/** Batch variant — one signing round trip per bucket instead of per file. */
export async function resolveMediaUrls(
  inputs: (string | null | undefined)[],
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(inputs.length).fill(null);
  const byBucket = new Map<MediaBucket, { index: number; path: string }[]>();

  inputs.forEach((input, index) => {
    if (!input) return;
    const ref = toStorageRef(input);
    if (!ref) {
      results[index] = input; // pass through
      return;
    }
    const key = cacheKey(ref);
    const hit = cache.get(key);
    if (hit && hit.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
      results[index] = hit.url;
      return;
    }
    const list = byBucket.get(ref.bucket) ?? [];
    list.push({ index, path: ref.path });
    byBucket.set(ref.bucket, list);
  });

  await Promise.all(
    [...byBucket.entries()].map(async ([bucket, items]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(items.map((i) => i.path), ttlSeconds);

      if (error || !data) {
        if (__DEV__) console.warn('resolveMediaUrls: batch sign failed', bucket, error?.message);
        return;
      }

      data.forEach((entry: { signedUrl?: string | null; path?: string | null }, i: number) => {
        const item = items[i];
        if (!item) return;
        const signed = entry?.signedUrl;
        if (!signed) return;
        results[item.index] = signed;
        cache.set(`${bucket}/${item.path}`, {
          url: signed,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      });
    }),
  );

  return results;
}

/**
 * Build the value to PERSIST for a newly uploaded file.
 *
 * Store `bucket/path`, never an absolute public URL — a stored public URL keeps
 * working after the bucket is flipped private only by accident of parsing, and
 * it leaks the unauthenticated shape into every row.
 */
export function toStoredMediaValue(bucket: MediaBucket, path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean.startsWith(`${bucket}/`) ? clean : `${bucket}/${clean}`;
}
