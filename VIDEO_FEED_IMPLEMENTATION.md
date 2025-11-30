# OnlySports Video Feed Implementation

## Overview
Instagram-style video feed with auto-play/pause based on scroll visibility. Optimized for performance on iOS, Android, and Web with Supabase Storage integration.

---

## ✅ What's Implemented

### 1. **FeedVideoItem Component** (`components/FeedVideoItem.tsx`)
Smart video player that responds to visibility changes:

**Features:**
- ✅ Auto-plays when scrolled into view (75% threshold)
- ✅ Auto-pauses when scrolled out of view
- ✅ Tap to pause/play
- ✅ Tap mute button to toggle sound
- ✅ Loading indicator during buffering
- ✅ Error handling with graceful fallback
- ✅ Memory-efficient with proper cleanup
- ✅ Works with Supabase signed URLs

**Props:**
```typescript
interface FeedVideoItemProps {
  url: string;          // Video URL (signed or public)
  isVisible: boolean;   // Is this video currently visible?
  onPlay?: () => void;  // Optional callback when video plays
  onPause?: () => void; // Optional callback when video pauses
  width?: number;       // Custom width (default: screen width - 32)
  height?: number;      // Custom height (default: width * 0.75)
  testID?: string;      // For testing
}
```

**Usage:**
```tsx
<FeedVideoItem
  url={post.media.url}
  isVisible={visibleVideoId === post.id}
  width={width - 32}
  height={(width - 32) * 0.75}
/>
```

---

### 2. **Video Visibility Tracker** (`hooks/video-visibility-tracker.tsx`)
Custom hook that tracks which video is currently visible in the FlatList.

**Features:**
- ✅ Uses FlatList's `onViewableItemsChanged` API
- ✅ 75% visibility threshold (Instagram-like)
- ✅ Minimum view time: 100ms (prevents rapid switching)
- ✅ Only one video plays at a time
- ✅ Automatically handles scroll events

**How It Works:**
```typescript
const { visibleVideoId, viewabilityConfigCallbackPairs } = useVideoVisibilityTracker();

// visibleVideoId = ID of the currently visible video post
// viewabilityConfigCallbackPairs = Config for FlatList
```

---

### 3. **Feed Screen Updates** (`app/(tabs)/(home)/index.tsx`)
Updated home feed to use the new video system.

**Key Changes:**
- ✅ Replaced `VideoPlayer` with `FeedVideoItem`
- ✅ Added visibility tracking hook
- ✅ Configured FlatList for optimal performance:
  - `removeClippedSubviews={true}` - Unmount off-screen items
  - `maxToRenderPerBatch={3}` - Render 3 items at a time
  - `windowSize={10}` - Keep 10 items in memory
  - `initialNumToRender={3}` - Start with 3 items
  - `updateCellsBatchingPeriod={50}` - Faster updates

**Before:**
```tsx
<VideoPlayer
  uri={item.media.url}
  autoPlay={false}
  loop={true}
  muted={true}
/>
```

**After:**
```tsx
<FeedVideoItem
  url={item.media.url}
  isVisible={visibleVideoId === item.id}
  width={width - 32}
  height={(width - 32) * 0.75}
/>
```

---

### 4. **Supabase Video Helpers** (`constants/video-helpers.ts`)
Utility functions for handling Supabase Storage URLs.

**Features:**
- ✅ Generate signed URLs for Android compatibility
- ✅ Cache signed URLs (1 hour duration)
- ✅ Prefetch upcoming videos
- ✅ Automatic URL expiry handling

**Functions:**
```typescript
// Generate a signed URL for a video
const signedUrl = await getSignedVideoUrl(publicUrl);

// Prefetch signed URLs for multiple videos
await prefetchSignedUrls([url1, url2, url3]);

// Check if URL is cached
const cached = getCachedSignedUrl(publicUrl);

// Clear cache (useful on logout)
clearSignedUrlCache();
```

**Why Signed URLs?**
- Android requires proper CORS headers
- Signed URLs include authentication tokens
- Better security for private content
- Already implemented in `posts-context.tsx`

---

## 🎯 How It All Connects

```
┌─────────────────────────────────────────────────────────────┐
│ HomeScreen (app/(tabs)/(home)/index.tsx)                     │
│                                                               │
│  1. useVideoVisibilityTracker()                              │
│     └─> Tracks which video is visible                        │
│                                                               │
│  2. FlatList with optimizations                              │
│     ├─> viewabilityConfigCallbackPairs                       │
│     ├─> removeClippedSubviews={true}                         │
│     ├─> maxToRenderPerBatch={3}                              │
│     └─> windowSize={10}                                      │
│                                                               │
│  3. renderPost renders each post                             │
│     └─> FeedVideoItem for videos                             │
│         ├─> url={video.url}                                  │
│         ├─> isVisible={visibleVideoId === post.id}           │
│         └─> Auto-plays if isVisible=true                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Performance Optimizations

### FlatList Configuration
```tsx
<FlatList
  viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
  removeClippedSubviews={true}      // Unmount off-screen views
  maxToRenderPerBatch={3}           // Render 3 items per batch
  windowSize={10}                   // Keep 10 items in memory
  initialNumToRender={3}            // Render 3 items initially
  updateCellsBatchingPeriod={50}    // Update every 50ms
/>
```

### Video Player Optimization
- Uses `expo-video` with native controls disabled
- Automatic cleanup on unmount
- Memory-efficient ref tracking
- Lazy loading with visibility detection

### Signed URL Caching
- 1-hour cache per URL
- Prevents repeated Supabase API calls
- Automatic expiry handling
- Reduces network requests

---

## 📱 Platform Compatibility

### iOS ✅
- Native video playback
- Smooth scrolling
- Auto-play/pause works perfectly
- Signed URLs supported

### Android ✅
- Works with signed URLs (already implemented)
- Proper CORS headers
- Hardware acceleration
- Optimized rendering

### Web ✅
- Uses React Native Web polyfills
- Works with `expo-video` web implementation
- Smooth scrolling with CSS optimizations
- Supports all features

---

## 🔧 Configuration

### Adjust Visibility Threshold
In `hooks/video-visibility-tracker.tsx`:
```typescript
const viewabilityConfig = useRef({
  itemVisiblePercentThreshold: 75,  // Change to 50 for earlier play
  minimumViewTime: 100,              // Increase to prevent rapid switching
});
```

### Adjust Cache Duration
In `constants/video-helpers.ts`:
```typescript
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (change as needed)
```

### Adjust Video Quality
In Supabase upload (already in `posts-context.tsx`):
```typescript
// Videos are uploaded as MP4
// Keep videos ≤720p for best performance
```

---

## 📊 Debug Logging

All components log extensively to help you debug:

```typescript
// FeedVideoItem logs:
[FeedVideoItem] Render: { url, isVisible, isLoading, platform }
[FeedVideoItem] Visibility changed: true
[FeedVideoItem] Playing video
[FeedVideoItem] Status: readyToPlay
[FeedVideoItem] Toggle mute: true

// HomeScreen logs:
[HomeScreen] Visible video ID: post-123

// Visibility Tracker logs:
[VisibilityTracker] Viewable items changed: 2
[VisibilityTracker] Setting visible video: post-123
```

---

## ✨ User Experience

### What Users See:
1. **Scroll feed** - Videos load as they come into view
2. **Auto-play** - Video starts when 75% visible
3. **Auto-pause** - Video pauses when scrolled away
4. **Tap video** - Pause/play manually
5. **Tap mute button** - Toggle sound
6. **Loading spinner** - Shown while buffering
7. **Error fallback** - Small error indicator if video fails

### Instagram-like Behavior:
✅ Only one video plays at a time  
✅ Smooth transitions  
✅ No manual play button required  
✅ Videos loop infinitely  
✅ Muted by default  
✅ Tap to unmute  

---

## 🎬 Example Flow

```typescript
// 1. User scrolls feed
User scrolls ↓

// 2. Video enters viewport (75% visible)
VisibilityTracker detects video → setVisibleVideoId('post-123')

// 3. FeedVideoItem receives isVisible=true
FeedVideoItem → player.play() → Video plays

// 4. User scrolls past video
VisibilityTracker detects video gone → setVisibleVideoId(null)

// 5. FeedVideoItem receives isVisible=false
FeedVideoItem → player.pause() → Video pauses

// 6. Next video enters viewport
Repeat from step 2
```

---

## 🐛 Troubleshooting

### Videos not playing?
1. Check console logs for `[FeedVideoItem]` messages
2. Verify `isVisible` prop is changing
3. Check if video URL is valid (look for signed URL with `token=`)
4. Ensure Supabase Storage is configured correctly

### Videos playing simultaneously?
- Check that `visibleVideoId` is being set correctly
- Verify `viewabilityConfigCallbackPairs` is passed to FlatList
- Ensure only one video has `isVisible={true}`

### Performance issues?
- Reduce `windowSize` to 5-7
- Increase `itemVisiblePercentThreshold` to 90
- Ensure videos are ≤720p
- Check if `removeClippedSubviews` is enabled

### Android-specific issues?
- Verify signed URLs are being used (check logs)
- Ensure CORS is enabled in Supabase Storage
- Check that storage bucket is public

---

## 📦 Dependencies

All dependencies are already installed:
- `expo-video` - Video playback
- `lucide-react-native` - Icons (VolumeX, Volume2)
- `@supabase/supabase-js` - Supabase client
- `react-native` - Core framework
- `expo-router` - Navigation

---

## 🎉 Summary

You now have a **production-ready Instagram-style video feed** with:

✅ Auto-play/pause based on scroll  
✅ Only one video plays at a time  
✅ Tap to mute/unmute  
✅ Optimized performance  
✅ Works on iOS, Android, and Web  
✅ Supabase Storage integration  
✅ Signed URL caching  
✅ Error handling  
✅ Loading states  

**Files Created/Modified:**
- ✅ `components/FeedVideoItem.tsx` - Smart video player
- ✅ `hooks/video-visibility-tracker.tsx` - Visibility detection
- ✅ `constants/video-helpers.ts` - Supabase URL helpers
- ✅ `app/(tabs)/(home)/index.tsx` - Updated feed screen

**No additional setup required!** Everything is integrated and ready to use.
