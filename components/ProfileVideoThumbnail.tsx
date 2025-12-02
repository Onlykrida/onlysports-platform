import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Play } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { VideoView, useVideoPlayer } from 'expo-video';

interface ProfileVideoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  testID?: string;
}

export function ProfileVideoThumbnail({
  videoUrl,
  thumbnailUrl,
  width = 300,
  height = 300,
  testID = 'profile-video-thumbnail',
}: ProfileVideoThumbnailProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.muted = false;
  });

  const handleOpenVideo = () => {
    setIsModalVisible(true);
    player.play();
  };

  const handleCloseVideo = () => {
    setIsModalVisible(false);
    player.pause();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.thumbnailContainer, { width, height }]}
        onPress={handleOpenVideo}
        testID={testID}
        activeOpacity={0.9}
      >
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultThumbnail} />
        )}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Play size={32} color={theme.colors.white} fill={theme.colors.white} />
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseVideo}
      >
        <View style={styles.modalBackground}>
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseVideo}
              testID={`${testID}-close`}
            >
              <X size={28} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.videoContainer}>
              <VideoView
                style={styles.video}
                player={player}
                contentFit="contain"
                nativeControls={true}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  defaultThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
