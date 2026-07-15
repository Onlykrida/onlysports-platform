import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

// Shared upload path for fitness-test verification videos ('test-videos'
// bucket). Previously duplicated in beep-test-results.tsx and
// RequestVerificationModal.tsx, both as fetch(uri) → blob() — which buffers
// the entire video in JS memory and can freeze/OOM low-end Android devices
// on large gallery picks.
//
// Strategy:
// - Reject oversized picks up-front via asset.fileSize (cheap, cross-platform).
// - Native: stream from disk with FileSystem.uploadAsync against the Supabase
//   Storage REST endpoint (no full-file buffering). Falls back to the repo's
//   established base64 → ArrayBuffer pattern (see hooks/posts-context.tsx) if
//   uploadAsync isn't available in the installed expo-file-system API.
// - Web: fetch → blob is fine (desktop memory, and RN's file:// concerns
//   don't apply).
//
// NEEDS DEVICE QA: the native streaming path can't be exercised from a web
// session — verify a real upload on Android before relying on it.

// Native-only module — static import would break the web bundle.
let FileSystemLegacy: any = null;
if (Platform.OS !== 'web') {
  try {
    // SDK 54+: legacy functions (uploadAsync/readAsStringAsync) live under
    // the /legacy entry point; older SDKs export them from the root.
    FileSystemLegacy = require('expo-file-system/legacy');
  } catch {
    try {
      FileSystemLegacy = require('expo-file-system');
    } catch {
      // unavailable — fall through to blob path
    }
  }
}

export const MAX_TEST_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

const BUCKET = 'test-videos';

export interface TestVideoUploadResult {
  url?: string;
  error?: string;
}

export async function uploadTestVideo(
  userId: string,
  asset: { uri: string; fileSize?: number | null },
): Promise<TestVideoUploadResult> {
  if (!isSupabaseConfigured) {
    return { error: 'Video upload needs Supabase to be configured.' };
  }
  if (asset.fileSize && asset.fileSize > MAX_TEST_VIDEO_BYTES) {
    return {
      error:
        'That video is too large (over 200MB). Trim it to the test attempt — about 60 seconds — and try again.',
    };
  }

  const fileName = `${userId}/${Date.now()}.mp4`;

  try {
    if (Platform.OS !== 'web' && typeof FileSystemLegacy?.uploadAsync === 'function') {
      // Stream from disk — no full-file buffering in JS memory.
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (supabaseUrl && anonKey && accessToken) {
        const result = await FileSystemLegacy.uploadAsync(
          `${supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`,
          asset.uri,
          {
            httpMethod: 'POST',
            uploadType: FileSystemLegacy.FileSystemUploadType.BINARY_CONTENT,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: anonKey,
              'Content-Type': 'video/mp4',
            },
          },
        );
        if (result.status >= 200 && result.status < 300) {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
          return { url: urlData.publicUrl };
        }
        return { error: `Upload failed (${result.status}). Check your connection and try again.` };
      }
      // Missing config/session — fall through to the blob path below.
    }

    // Web path (and native fallback): buffer + SDK upload.
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, blob, { contentType: 'video/mp4' });
    if (error) return { error: error.message };
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return { url: urlData.publicUrl };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to upload video' };
  }
}
