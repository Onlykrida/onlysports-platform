import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ViewStyle, Image, Platform } from 'react-native';

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

  const source = useMemo(() => ({ uri }), [uri]);
  const posterSource = useMemo(() => (poster ? { uri: poster } : undefined), [poster]);

  const onError = useCallback((e: unknown) => {
    console.error('[VideoPlayer] Playback error', e);
    setError('Unable to play this video.');
  }, []);

  const ExpoVideo: any = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('expo-video');
    } catch (e) {
      console.log('[VideoPlayer] expo-video not available');
      return null;
    }
  }, []);

  const HasVideo = !!ExpoVideo?.Video;

  return (
    <View style={[styles.container, { height, width }, style]} testID={`${testID}-container`}>
      {!error && HasVideo ? (
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
      ) : posterSource ? (
        <Image
          source={posterSource}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode={'cover'}
          testID={`${testID}-poster`}
        />
      ) : (
        <View style={styles.fallback} testID={`${testID}-error`} />
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
});