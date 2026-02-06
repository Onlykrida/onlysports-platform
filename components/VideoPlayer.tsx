import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Image, Platform, Text, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

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
  
  const player = useVideoPlayer(uri, (player) => {
    player.loop = loop;
    player.muted = muted;
    if (autoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    console.log('[VideoPlayer] Initializing with URI:', uri);
    console.log('[VideoPlayer] Poster:', poster);
    console.log('[VideoPlayer] Platform:', Platform.OS);
    setError(null);
    setIsLoading(true);
  }, [uri, poster]);

  const posterSource = useMemo(() => (poster ? { uri: poster } : undefined), [poster]);

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('statusChange', (status) => {
      console.log('[VideoPlayer] Status:', status);
      
      if (status.status === 'readyToPlay') {
        console.log('[VideoPlayer] Video ready to play');
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