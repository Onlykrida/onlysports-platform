import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ViewStyle, Image, Platform, Text } from 'react-native';

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
  const ref = useRef<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('[VideoPlayer] Rendering with URI:', uri);
  console.log('[VideoPlayer] Platform:', Platform.OS);
  console.log('[VideoPlayer] Poster:', poster);

  const source = useMemo(() => {
    console.log('[VideoPlayer] Creating source object:', { uri });
    return { uri };
  }, [uri]);
  
  const posterSource = useMemo(() => (poster ? { uri: poster } : undefined), [poster]);

  const onError = useCallback((e: unknown) => {
    console.error('[VideoPlayer] Playback error for URI:', uri);
    console.error('[VideoPlayer] Error details:', e);
    setError('Unable to play this video.');
  }, [uri]);

  const ExpoVideo: any = useMemo(() => {
    try {
      const video = require('expo-video');
      console.log('[VideoPlayer] expo-video loaded successfully');
      return video;
    } catch (e) {
      console.log('[VideoPlayer] expo-video not available:', e);
      return null;
    }
  }, []);

  const HasVideo = !!ExpoVideo?.Video;

  return (
    <View style={[styles.container, { height, width }, style]} testID={`${testID}-container`}>
      {!error && HasVideo && uri ? (
        <ExpoVideo.Video
          ref={ref}
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          useNativeControls
          isLooping={loop}
          isMuted={muted}
          shouldPlay={autoPlay}
          onError={onError}
        />
      ) : error ? (
        <View style={styles.errorContainer} testID={`${testID}-error`}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorDetails}>Video URL: {uri || 'No URL provided'}</Text>
        </View>
      ) : posterSource ? (
        <Image
          source={posterSource}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode={'cover'}
          testID={`${testID}-poster`}
        />
      ) : (
        <View style={styles.fallback} testID={`${testID}-fallback`}>
          <Text style={styles.errorText}>No video available</Text>
          {uri && <Text style={styles.errorDetails}>URI: {uri}</Text>}
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetails: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});