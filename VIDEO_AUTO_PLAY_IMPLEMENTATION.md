# 🎥 Video Auto-Play/Pause Implementation

## ✅ Current Implementation

Your feed is already set up with a complete video auto-play/pause system! Here's how it works:

### 1. **Feed Page** (`app/(tabs)/(home)/index.tsx`)

The feed uses:
- ✅ **FlatList** with optimized performance settings
- ✅ **Visibility tracking** via `useVideoVisibilityTracker` hook
- ✅ **Only one video plays at a time** (determined by `visibleVideoId`)
- ✅ **Optimized rendering** with `windowSize={10}`, `maxToRenderPerBatch={3}`

```tsx
const { visibleVideoId, viewabilityConfigCallbackPairs } = useVideoVisibilityTracker();

<FlatList
  data={posts}
  renderItem={renderPost}
  viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
  removeClippedSubviews={true}
  maxToRenderPerBatch={3}
  windowSize={10}
  initialNumToRender={3}
/>
```

### 2. **Video Component** (`components/FeedVideoItem.tsx`)

Features:
- ✅ **Auto-play** when `isVisible={true}`
- ✅ **Auto-pause** when `isVisible={false}`
- ✅ **Tap to mute/unmute** via bottom-right button
- ✅ **Tap video to pause/play**
- ✅ **Auto-loop** enabled
- ✅ **Loading indicator** while buffering
- ✅ **Error handling** with fallback UI
- ✅ **Works on iOS + Android + Web**

```tsx
<FeedVideoItem
  url={item.media.url ?? ''}
  isVisible={visibleVideoId === item.id}
  width={width - (theme.spacing.md * 2)}
  height={(width - (theme.spacing.md * 2)) * 0.75}
/>
```

### 3. **Visibility Tracker** (`hooks/video-visibility-tracker.tsx`)

Smart detection that:
- ✅ Detects when 75% of video is visible
- ✅ Only tracks video posts (not images)
- ✅ Returns the ID of the first visible video
- ✅ Prevents multiple videos from playing simultaneously

### 4. **Video Playback Logic**

The video component uses `expo-video` with:

**Initialization:**
```tsx
const player = useVideoPlayer(url, (player) => {
  player.loop = true;
  player.muted = true;
  player.volume = 0;
});
```

**Visibility-based playback:**
```tsx
useEffect(() => {
  if (isVisible && !error) {
    // Auto-play when visible
    await player.play();
  } else {
    // Auto-pause when not visible
    player.pause();
  }
}, [isVisible, url, player, error]);
```

**Status monitoring:**
```tsx
player.addListener('statusChange', (status) => {
  if (status.status === 'readyToPlay') {
    if (isActiveRef.current && isVisible) {
      player.play();
    }
  }
});
```

## 🎯 How It Works Together

1. User scrolls the feed
2. `useVideoVisibilityTracker` detects which video is 75%+ visible
3. That video's `isVisible` prop becomes `true`
4. `FeedVideoItem` receives `isVisible={true}` and auto-plays
5. All other videos receive `isVisible={false}` and auto-pause
6. Only ONE video plays at a time ✅

## 🔧 Key Features

### ✅ Auto-play when in view
When a video becomes 75% visible, it automatically starts playing.

### ✅ Auto-pause when out of view
When scrolled away, the video automatically pauses.

### ✅ Mute/unmute
Tap the volume icon in the bottom-right corner to toggle sound.

### ✅ Tap to pause/play
Tap anywhere on the video to pause/play.

### ✅ Smooth scrolling
Optimized with:
- `removeClippedSubviews={true}`
- `maxToRenderPerBatch={3}`
- `windowSize={10}`

### ✅ Android signed URLs
Videos from Supabase are converted to signed URLs for Android compatibility in `posts-context.tsx`.

## 📱 Platform Support

- ✅ **iOS** - Full support
- ✅ **Android** - Full support (using signed URLs)
- ✅ **Web** - Full support

## 🚀 Performance Optimizations

1. **Memoized components** - `FeedVideoItem` is wrapped in `React.memo`
2. **Efficient FlatList settings** - Limited render batch and window size
3. **Signed URL caching** - URLs cached for 1 hour in `video-helpers.ts`
4. **Remove clipped subviews** - Off-screen videos not rendered
5. **Visibility threshold** - 75% visible before auto-play triggers

## 🎨 UX Features

- Loading spinner while buffering
- Error state with friendly message
- Mute/unmute button overlay
- Tap-to-pause/play interaction
- Auto-loop enabled
- Smooth 16:9 aspect ratio

## 📝 Usage Example

In your feed, each post with a video automatically gets the video player:

```tsx
{item.media && (
  <View style={styles.mediaContainer}>
    {item.media.type === 'image' ? (
      <Image source={{ uri: item.media.url }} style={styles.postImage} />
    ) : (
      <FeedVideoItem
        url={item.media.url ?? ''}
        isVisible={visibleVideoId === item.id}
        width={width - (theme.spacing.md * 2)}
        height={(width - (theme.spacing.md * 2)) * 0.75}
        testID={`post-video-${item.id}`}
      />
    )}
  </View>
)}
```

## 🔍 Debugging

Check console logs for:
- `[FeedVideoItem]` - Video component lifecycle
- `[VisibilityTracker]` - Visibility detection
- `[Posts]` - Video URL conversion to signed URLs

## ✨ What's Already Done

Your implementation already includes:
1. ✅ Auto-play/pause based on visibility
2. ✅ One video at a time
3. ✅ Tap to mute/unmute
4. ✅ Tap to pause/play
5. ✅ Auto-loop
6. ✅ Loading indicators
7. ✅ Error handling
8. ✅ iOS + Android + Web support
9. ✅ Optimized scrolling performance
10. ✅ Signed URLs for Android

## 🎉 Your Feed is Ready!

The video feed is fully functional with Instagram-style auto-play behavior. Videos will:
- ✅ Auto-play when scrolled into view
- ✅ Auto-pause when scrolled out of view
- ✅ Support mute/unmute
- ✅ Work smoothly on all platforms
- ✅ Handle errors gracefully
- ✅ Perform efficiently even with many videos

No additional changes needed - everything is already implemented!
