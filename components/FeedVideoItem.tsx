import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  Platform
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Volume2, VolumeX } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedVideoItemProps {
  url: string;
  isVisible: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  width?: number;
  height?: number;
  testID?: string;
}

const FeedVideoItem = memo(({ 
  url, 
  isVisible, 
  onPlay, 
  onPause,
  width = SCREEN_WIDTH - 32,
  height = (SCREEN_WIDTH - 32) * 0.75,
  testID = 'feed-video'
}: FeedVideoItemProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(!isVisible);
  const isActiveRef = useRef(false);

  console.log('[FeedVideoItem] Render:', {
    url: url.substring(0, 50) + '...',
    isVisible,
    isLoading,
    error,
    platform: Platform.OS,
    isSignedUrl: url.includes('token=')
  });

  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.muted = true;
    player.volume = 0;
  });

  useEffect(() => {
    console.log('[FeedVideoItem] Visibility changed:', isVisible, 'URL:', url.substring(0, 50));
    
    if (isVisible && !error) {
      isActiveRef.current = true;
      setIsLoading(true);
      
      const playVideo = async () => {
        try {
          console.log('[FeedVideoItem] Playing video');
          player.play();
          setIsPaused(false);
          onPlay?.();
        } catch (err) {
          console.error('[FeedVideoItem] Play error:', err);
        }
      };
      
      playVideo();
    } else {
      isActiveRef.current = false;
      console.log('[FeedVideoItem] Pausing video');
      player.pause();
      setIsPaused(true);
      onPause?.();
    }
  }, [isVisible, url, player, error]);

  useEffect(() => {
    player.muted = isMuted;
    player.volume = isMuted ? 0 : 1;
  }, [isMuted, player]);

  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[FeedVideoItem] Status:', status.status);
      
      if (status.status === 'readyToPlay') {
        console.log('[FeedVideoItem] Ready to play');
        setIsLoading(false);
        setError(null);
        
        if (isActiveRef.current && isVisible) {
          player.play();
        }
      } else if (status.status === 'error') {
        console.error('[FeedVideoItem] Error:', status.error);
        setError('Unable to load video');
        setIsLoading(false);
      } else if (status.status === 'loading') {
        setIsLoading(true);
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      setIsPaused(!event.isPlaying);
      if (event.isPlaying) {
        onPlay?.();
      } else {
        onPause?.();
      }
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
    };
  }, [player, isVisible]);

  const handleTapToToggleMute = useCallback(() => {
    console.log('[FeedVideoItem] Toggle mute:', !isMuted);
    setIsMuted(prev => !prev);
  }, [isMuted]);

  const handleTapToPause = useCallback(() => {
    console.log('[FeedVideoItem] Toggle pause:', !isPaused);
    if (isPaused) {
      player.play();
      setIsPaused(false);
    } else {
      player.pause();
      setIsPaused(true);
    }
  }, [isPaused, player]);

  if (error) {
    return (
      <View style={[styles.container, { width, height }]} testID={`${testID}-error`}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="small" color="#ff4444" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]} testID={testID}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleTapToPause}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />

        {isLoading && isVisible && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.muteButton}
            onPress={handleTapToToggleMute}
            activeOpacity={0.8}
            testID={`${testID}-mute-button`}
          >
            {isMuted ? (
              <VolumeX size={20} color="#fff" />
            ) : (
              <Volume2 size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
});

FeedVideoItem.displayName = 'FeedVideoItem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

export default FeedVideoItem;
