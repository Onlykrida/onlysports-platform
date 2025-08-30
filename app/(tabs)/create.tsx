import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Video, FileText, X, ImageIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

export default function CreateScreen() {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const { createPost } = usePosts();
  const { user } = useAuth();

  const handleMediaSelect = async (type: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload media.');
        return;
      }

      let result;
      if (type === 'Photo') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      } else if (type === 'Video') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        Alert.alert('Coming Soon', 'Article creation will be available soon!');
        return;
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri);
        setMediaType(type === 'Photo' ? 'image' : 'video');
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri);
        setMediaType('image');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedMedia) {
      Alert.alert('Error', 'Please add some content or media');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    try {
      setIsPosting(true);
      const result = await createPost(content, selectedMedia || undefined, mediaType || undefined);
      
      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      Alert.alert('Success', 'Your post has been created and will appear in the feed!', [
        { 
          text: 'View Feed', 
          onPress: () => {
            setContent('');
            setSelectedMedia(null);
            setMediaType(null);
            router.push('/(tabs)/(home)');
          }
        },
        { 
          text: 'Create Another', 
          onPress: () => {
            setContent('');
            setSelectedMedia(null);
            setMediaType(null);
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Post</Text>
          <Text style={styles.subtitle}>Share your journey with the community</Text>
        </View>

        <View style={styles.contentContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />

          {selectedMedia && (
            <View style={styles.mediaPreview}>
              {mediaType === 'image' ? (
                <Image source={{ uri: selectedMedia }} style={styles.previewImage} />
              ) : (
                <View style={styles.videoPreview}>
                  <Video size={48} color={theme.colors.white} />
                  <Text style={styles.videoText}>Video Selected</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeMedia}
                onPress={() => {
                  setSelectedMedia(null);
                  setMediaType(null);
                }}
              >
                <X size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mediaOptions}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleCameraCapture}
            >
              <Camera size={24} color={theme.colors.primary} />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => handleMediaSelect('Photo')}
            >
              <ImageIcon size={24} color={theme.colors.primary} />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => handleMediaSelect('Video')}
            >
              <Video size={24} color={theme.colors.primary} />
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => handleMediaSelect('Article')}
            >
              <FileText size={24} color={theme.colors.primary} />
              <Text style={styles.mediaButtonText}>Article</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips for great content:</Text>
          <Text style={styles.tip}>• Share your training routines and progress</Text>
          <Text style={styles.tip}>• Post match highlights and achievements</Text>
          <Text style={styles.tip}>• Engage with your community</Text>
          <Text style={styles.tip}>• Use hashtags to increase visibility</Text>
        </View>

        <View style={styles.footer}>
          <Button
            title={isPosting ? 'Posting...' : 'Post'}
            onPress={handlePost}
            size="large"
            disabled={isPosting || (!content.trim() && !selectedMedia)}
          />
          {isPosting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Creating your post...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnLight,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  contentContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  textInput: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textOnLight,
    minHeight: 120,
    marginBottom: theme.spacing.md,
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  removeMedia: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mediaButton: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  mediaButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textOnLight,
  },
  tips: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  tipsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tip: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.md,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  videoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});