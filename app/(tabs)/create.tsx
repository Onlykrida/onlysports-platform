import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { Camera, Video, FileText, X, ImageIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import CachedImage from '@/components/CachedImage';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';

const MAX_CHARS = 500;

export default function CreateScreen() {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const { createPost } = usePosts();
  const { user } = useAuth();
  const { track } = useAnalytics();

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
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Camera capture is not available on web. Please use the Gallery option instead.',
      );
      return;
    }
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

      track(EVENTS.POST_CREATED);

      Alert.alert('Success', 'Your post has been created and will appear in the feed!', [
        {
          text: 'View Feed',
          onPress: () => {
            setContent('');
            setSelectedMedia(null);
            setMediaType(null);
            router.push('/');
          },
        },
        {
          text: 'Create Another',
          onPress: () => {
            setContent('');
            setSelectedMedia(null);
            setMediaType(null);
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.cancelTouchable} onPress={() => router.back()}>
              <Text style={styles.cancelButton} numberOfLines={1}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              CREATE
            </Text>
            <TouchableOpacity
              style={[
                styles.postButton,
                (isPosting || (!content.trim() && !selectedMedia)) && styles.postButtonDisabled,
              ]}
              onPress={handlePost}
              disabled={isPosting || (!content.trim() && !selectedMedia)}
            >
              <Text style={styles.postButtonText} numberOfLines={1}>
                {isPosting ? 'POSTING...' : 'POST'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What did you crush today?"
              placeholderTextColor="#666"
              multiline
              value={content}
              onChangeText={(text) => setContent(text.slice(0, MAX_CHARS))}
              textAlignVertical="top"
            />
            <Text style={styles.charCount} numberOfLines={1}>
              {content.length}/{MAX_CHARS}
            </Text>

            {selectedMedia && (
              <View style={styles.mediaPreview}>
                {mediaType === 'image' ? (
                  <CachedImage
                    source={selectedMedia}
                    size={200}
                    placeholder="post"
                    borderRadius={12}
                    style={{ width: '100%', height: 200 }}
                  />
                ) : (
                  <View style={styles.videoPreview}>
                    <Video size={48} color={theme.colors.white} />
                    <Text style={styles.videoText} numberOfLines={1}>
                      Video Selected
                    </Text>
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
              <TouchableOpacity style={styles.mediaButton} onPress={handleCameraCapture}>
                <Camera size={24} color="#30D158" style={styles.mediaIcon} />
                <Text style={styles.mediaButtonText} numberOfLines={1}>
                  Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => handleMediaSelect('Photo')}
              >
                <ImageIcon size={24} color="#30D158" style={styles.mediaIcon} />
                <Text style={styles.mediaButtonText} numberOfLines={1}>
                  Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => handleMediaSelect('Video')}
              >
                <Video size={24} color="#FF9F0A" style={styles.mediaIcon} />
                <Text style={styles.mediaButtonText} numberOfLines={1}>
                  Video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => handleMediaSelect('Article')}
              >
                <FileText size={24} color="#888" style={styles.mediaIcon} />
                <Text style={styles.mediaButtonText} numberOfLines={1}>
                  Article
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle} numberOfLines={1}>
              TIPS FOR GREAT CONTENT
            </Text>
            <Text style={styles.tip} numberOfLines={2}>
              • Share your training routines and progress
            </Text>
            <Text style={styles.tip} numberOfLines={2}>
              • Post match highlights and achievements
            </Text>
            <Text style={styles.tip} numberOfLines={2}>
              • Engage with your community
            </Text>
            <Text style={styles.tip} numberOfLines={2}>
              • Use hashtags to increase visibility
            </Text>
          </View>

          {isPosting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#30D158" />
              <Text style={styles.loadingText} numberOfLines={1}>
                Creating your post...
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f0f0f0',
    letterSpacing: 3,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  cancelTouchable: {
    flexShrink: 0,
  },
  cancelButton: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  postButton: {
    flexShrink: 0,
    backgroundColor: '#30D158',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#30D158',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  contentContainer: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    overflow: 'hidden',
  },
  textInput: {
    fontSize: 15,
    color: '#f0f0f0',
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'right',
    marginBottom: 12,
  },
  mediaPreview: {
    position: 'relative' as const,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeMedia: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: '#FF453A',
    borderRadius: 12,
    padding: 6,
  },
  mediaOptions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  mediaButton: {
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    flex: 1,
    marginHorizontal: 3,
  },
  mediaIcon: {
    flexShrink: 0,
  },
  mediaButtonText: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  tips: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FF9F0A',
    marginBottom: 10,
    letterSpacing: 1,
  },
  tip: {
    fontSize: 11,
    color: '#888',
    lineHeight: 18,
    marginBottom: 4,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoText: {
    fontSize: 14,
    color: '#f0f0f0',
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#888',
    flexShrink: 1,
  },
  footer: {
    padding: 16,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  modeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  modeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  modeButtonTextActive: {
    color: theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBg,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  categoriesList: {
    padding: theme.spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  categorySelector: {
    margin: theme.spacing.md,
  },
  selectCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  selectCategoryText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  opportunityForm: {
    margin: theme.spacing.md,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  changeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  typeChipTextSelected: {
    color: theme.colors.white,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
