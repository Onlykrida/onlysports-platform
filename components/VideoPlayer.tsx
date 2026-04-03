import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  Text,
  ActivityIndicator,
  DimensionValue,
} from 'react-native';
import CachedImage from '@/components/CachedImage';

let VideoView: any = null;
let useVideoPlayer: any = null;
if (Platform.OS !== 'web') {
  const expoVideo = require('expo-video');
  VideoView = expoVideo.VideoView;
  useVideoPlayer = expoVideo.useVideoPlayer;
}

interface VideoPlayerProps {
  uri: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  height?: number;
  width?: number | string;
  style?: ViewStyle;
  testID?: string;
}

export default function VideoPlayer({
  uri,
  poster,
  autoPlay = false,
  loop = true,
  muted = false,
  height = 240,
  width = '100%',
  style,
  testID = 'video-player',
}: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const player = useVideoPlayer
    ? useVideoPlayer(uri, (p: any) => {
        p.loop = loop;
        p.muted = muted;
        if (autoPlay) {
          p.play();
        }
      })
    : null;

  // Web fallback: render HTML video element
  if (Platform.OS === 'web') {
    return (
      <View
        style={[styles.container, { height, width: width as DimensionValue }, style]}
        testID={`${testID}-container`}
      >
        <video
          src={uri}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          controls
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 } as any}
        />
      </View>
    );
  }

  useEffect(() => {
    if (__DEV__) console.log('[VideoPlayer] Initializing with URI:', uri);
    if (__DEV__) console.log('[VideoPlayer] Poster:', poster);
    if (__DEV__) console.log('[VideoPlayer] Platform:', Platform.OS);
    setError(null);
    setIsLoading(true);
  }, [uri, poster]);

  // posterSource no longer needed — CachedImage handles the URI directly

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('statusChange', (status: any) => {
      if (__DEV__) console.log('[VideoPlayer] Status:', status);

      if (status.status === 'readyToPlay') {
        if (__DEV__) console.log('[VideoPlayer] Video ready to play');
        setIsLoading(false);
        setError(null);
      } else if (status.status === 'error') {
        console.error('[VideoPlayer] Video error:', JSON.stringify(status.error, null, 2));
        console.error('[VideoPlayer] Full status:', JSON.stringify(status, null, 2));

        let errorMsg = 'Unable to play this video';
        if (status.error) {
          if (typeof status.error === 'string') {
            errorMsg = status.error;
          } else if (status.error.message) {
            errorMsg = status.error.message;
          }
        }

        setError(errorMsg);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  return (
    <View
      style={[styles.container, { height, width: width as DimensionValue }, style]}
      testID={`${testID}-container`}
    >
      {error ? (
        <View style={styles.errorContainer}>
          {poster ? (
            <CachedImage
              source={poster}
              size={height}
              placeholder="post"
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          ) : (
            <View style={styles.fallback} />
          )}
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>⚠️ Video unavailable</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
          </View>
        </View>
      ) : (
        <>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls
          />
          {isLoading && !error && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    borderRadius: 8,
  },
  fallback: {
    flex: 1,
    backgroundColor: '#111',
  },
  errorContainer: {
    flex: 1,
    position: 'relative',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#cccccc',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});
