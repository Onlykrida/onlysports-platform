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
  
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Camera, 
  Video, 
  FileText, 
  X, 
  ImageIcon,
  Trophy,
  Target,
  Award,
  Zap
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

type PostType = 'highlight' | 'training' | 'achievement' | 'update';

export default function CreateScreen() {
  const [postType, setPostType] = useState<PostType>('highlight');
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  
  const { createPost } = usePosts();
  const { user } = useAuth();

  const getPlaceholderForType = (type: PostType): string => {
    switch (type) {
      case 'highlight':
        return user?.role === 'athlete' 
          ? 'Share your match highlight or game footage...' 
          : 'Share a key moment...';
      case 'training':
        return user?.role === 'athlete' 
          ? 'Describe your training session or drill...' 
          : 'Share training insights...';
      case 'achievement':
        return user?.role === 'athlete' 
          ? 'Announce your latest achievement or milestone...' 
          : 'Share a success story...';
      case 'update':
        return user?.role === 'athlete' 
          ? 'Update your network on your progress...' 
          : 'Share what\'s new...';
      default:
        return 'What\'s on your mind?';
    }
  };

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
            router.push('/');
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
          <Text style={styles.title}>Share Your Progress</Text>
          <Text style={styles.subtitle}>{user?.role === 'athlete' ? 'Build your profile. Get discovered.' : 'Share insights with the community'}</Text>
        </View>

        {/* Post Type Selector */}
        <View style={styles.postTypeSelector}>
          <TouchableOpacity
            style={[styles.postTypeButton, postType === 'highlight' && styles.postTypeButtonActive]}
            onPress={() => setPostType('highlight')}
          >
            <Trophy size={20} color={postType === 'highlight' ? theme.colors.white : theme.colors.primary} />
            <Text style={[styles.postTypeText, postType === 'highlight' && styles.postTypeTextActive]}>Highlight</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.postTypeButton, postType === 'training' && styles.postTypeButtonActive]}
            onPress={() => setPostType('training')}
          >
            <Target size={20} color={postType === 'training' ? theme.colors.white : theme.colors.primary} />
            <Text style={[styles.postTypeText, postType === 'training' && styles.postTypeTextActive]}>Training</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.postTypeButton, postType === 'achievement' && styles.postTypeButtonActive]}
            onPress={() => setPostType('achievement')}
          >
            <Award size={20} color={postType === 'achievement' ? theme.colors.white : theme.colors.primary} />
            <Text style={[styles.postTypeText, postType === 'achievement' && styles.postTypeTextActive]}>Achievement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.postTypeButton, postType === 'update' && styles.postTypeButtonActive]}
            onPress={() => setPostType('update')}
          >
            <Zap size={20} color={postType === 'update' ? theme.colors.white : theme.colors.primary} />
            <Text style={[styles.postTypeText, postType === 'update' && styles.postTypeTextActive]}>Update</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={getPlaceholderForType(postType)}
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

        {user?.role === 'athlete' && (
          <View style={styles.careerTips}>
            <Text style={styles.tipsTitle}>💡 Build Your Profile</Text>
            <Text style={styles.tip}>✓ Post regularly to stay visible to scouts</Text>
            <Text style={styles.tip}>✓ Include metrics and achievements</Text>
            <Text style={styles.tip}>✓ Tag your sport and position</Text>
            <Text style={styles.tip}>✓ Show training dedication and improvement</Text>
          </View>
        )}

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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  contentContainer: {
    backgroundColor: theme.colors.cardBg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textInput: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
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
    color: theme.colors.textSecondary,
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
  postTypeSelector: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  postTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  postTypeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  postTypeTextActive: {
    color: theme.colors.white,
  },
  careerTips: {
    backgroundColor: theme.colors.primary + '10',
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
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