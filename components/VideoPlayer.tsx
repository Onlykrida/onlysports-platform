import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Image, Platform, Text, ActivityIndicator } from 'react-native';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    console.log('[VideoPlayer] Initializing with URI:', uri);
    console.log('[VideoPlayer] Poster:', poster);
    console.log('[VideoPlayer] Platform:', Platform.OS);
    setError(null);
    setIsLoading(true);
    setIsReady(false);
  }, [uri, poster]);

  const source = useMemo(() => ({ uri }), [uri]);
  const posterSource = useMemo(() => (poster ? { uri: poster } : undefined), [poster]);

  const onError = useCallback((e: unknown) => {
    console.error('[VideoPlayer] Playback error:', e);
    const errorMsg = e && typeof e === 'object' && 'message' in e 
      ? String(e.message) 
      : 'Unable to play this video';
    console.error('[VideoPlayer] Error message:', errorMsg);
    setError(errorMsg);
    setIsLoading(false);
  }, []);

  const onLoad = useCallback(() => {
    console.log('[VideoPlayer] Video loaded successfully');
    setIsLoading(false);
    setIsReady(true);
  }, []);

  const onLoadStart = useCallback(() => {
    console.log('[VideoPlayer] Video load started');
    setIsLoading(true);
  }, []);

  const ExpoVideo: any = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require('expo-video');
      console.log('[VideoPlayer] expo-video loaded successfully');
      return module;
    } catch (e) {
      console.error('[VideoPlayer] expo-video not available:', e);
      return null;
    }
  }, []);

  const HasVideo = !!ExpoVideo?.Video;
  
  useEffect(() => {
    console.log('[VideoPlayer] HasVideo:', HasVideo);
    console.log('[VideoPlayer] ExpoVideo:', ExpoVideo ? 'loaded' : 'not loaded');
  }, [HasVideo, ExpoVideo]);

  return (
    <View style={[styles.container, { height, width }, style]} testID={`${testID}-container`}>
      {error ? (
        <View style={styles.errorContainer}>
          {posterSource ? (
            <Image
              source={posterSource}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              resizeMode={'cover'}
              testID={`${testID}-poster`}
            />
          ) : (
            <View style={styles.fallback} />
          )}
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>⚠️ Video unavailable</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
          </View>
        </View>
      ) : !HasVideo ? (
        <View style={styles.errorContainer}>
          {posterSource ? (
            <Image
              source={posterSource}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              resizeMode={'cover'}
              testID={`${testID}-poster`}
            />
          ) : (
            <View style={styles.fallback} />
          )}
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>📹 Video player unavailable</Text>
            <Text style={styles.errorSubtext}>expo-video module not loaded</Text>
          </View>
        </View>
      ) : (
        <>
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
            onLoad={onLoad}
            onLoadStart={onLoadStart}
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