import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react-native';
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
  muted = true,
  height = 240,
  width = '100%',
  style,
  testID = 'video-player',
}: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  console.log('[VideoPlayer] Rendering with URI:', uri);

  const player = useVideoPlayer(uri, player => {
    player.loop = loop;
    player.muted = isMuted;
    if (autoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [player, isMuted]);

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showControls, isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
    setShowControls(true);
  }, [isPlaying, player]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    setShowControls(true);
  }, []);

  const handlePress = useCallback(() => {
    if (showControls) {
      togglePlayPause();
    } else {
      setShowControls(true);
    }
  }, [showControls, togglePlayPause]);

  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      console.log('[VideoPlayer] Status change:', status);
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
      }
      if (status.status === 'error') {
        console.error('[VideoPlayer] Player error:', status.error);
        setError('Unable to play video');
        setIsLoading(false);
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      console.log('[VideoPlayer] Playing state changed:', event.isPlaying);
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription.remove();
      playingSubscription.remove();
    };
  }, [player]);

  if (!uri) {
    return (
      <View style={[styles.container, { height, width }, style]} testID={`${testID}-container`}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video URL</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { height, width }, style]} testID={`${testID}-container`}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, width }, style]} testID={`${testID}-container`}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1}
        onPress={handlePress}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {showControls && !isLoading && (
          <View style={styles.controlsOverlay}>
            <View style={styles.centerControls}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={togglePlayPause}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={40} color="#fff" fill="#fff" />
                ) : (
                  <Play size={40} color="#fff" fill="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity 
                style={styles.muteButton}
                onPress={toggleMute}
                activeOpacity={0.8}
              >
                {isMuted ? (
                  <VolumeX size={24} color="#fff" />
                ) : (
                  <Volume2 size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative' as const,
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
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bottomControls: {
    position: 'absolute' as const,
    bottom: 16,
    right: 16,
    flexDirection: 'row' as const,
    gap: 12,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
