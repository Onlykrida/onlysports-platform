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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Camera, 
  Video, 
  FileText, 
  X, 
  ImageIcon, 
  Plus,
  Trophy,
  Users,
  DollarSign,
  GraduationCap,
  FileSignature,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Target
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

type CreateMode = 'post' | 'opportunity';
type OpportunityCategory = 'tryouts' | 'tournaments' | 'sponsorships' | 'scholarships' | 'contracts';
type OpportunityType = 'paid' | 'unpaid' | 'local' | 'national' | 'short-term' | 'long-term';

interface OpportunityData {
  category: OpportunityCategory | null;
  type: OpportunityType[];
  title: string;
  description: string;
  location: string;
  deadline: string;
  requirements: string;
  compensation?: string;
  duration?: string;
  ageRange?: string;
  skillLevel?: string;
  contactInfo: string;
  additionalInfo: string;
}

export default function CreateScreen() {
  const [mode, setMode] = useState<CreateMode>('post');
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [opportunityData, setOpportunityData] = useState<OpportunityData>({
    category: null,
    type: [],
    title: '',
    description: '',
    location: '',
    deadline: '',
    requirements: '',
    compensation: '',
    duration: '',
    ageRange: '',
    skillLevel: '',
    contactInfo: '',
    additionalInfo: ''
  });
  
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

  const categories = [
    {
      id: 'tryouts' as OpportunityCategory,
      title: 'Tryouts',
      description: 'Team tryouts and player evaluations',
      icon: Trophy,
      color: theme.colors.primary
    },
    {
      id: 'tournaments' as OpportunityCategory,
      title: 'Tournaments',
      description: 'Competitions and tournaments',
      icon: Users,
      color: theme.colors.secondary
    },
    {
      id: 'sponsorships' as OpportunityCategory,
      title: 'Sponsorships',
      description: 'Brand partnerships and sponsorship deals',
      icon: DollarSign,
      color: theme.colors.accent
    },
    {
      id: 'scholarships' as OpportunityCategory,
      title: 'Scholarships',
      description: 'Educational scholarships and grants',
      icon: GraduationCap,
      color: theme.colors.info
    },
    {
      id: 'contracts' as OpportunityCategory,
      title: 'Contracts',
      description: 'Professional contracts and opportunities',
      icon: FileSignature,
      color: theme.colors.orange
    }
  ];

  const handleCategorySelect = (category: OpportunityCategory) => {
    setOpportunityData(prev => ({ ...prev, category }));
    setShowCategoryModal(false);
  };

  const handleTypeToggle = (type: OpportunityType) => {
    setOpportunityData(prev => ({
      ...prev,
      type: prev.type.includes(type) 
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const handlePost = async () => {
    if (mode === 'post') {
      if (!content.trim() && !selectedMedia) {
        Alert.alert('Error', 'Please add some content or media');
        return;
      }
    } else {
      if (!opportunityData.category || !opportunityData.title.trim() || !opportunityData.description.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create content');
      return;
    }

    try {
      setIsPosting(true);
      
      if (mode === 'post') {
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
      } else {
        // Handle opportunity creation
        console.log('Creating opportunity:', opportunityData);
        Alert.alert('Success', 'Your opportunity has been posted!', [
          {
            text: 'View Opportunities',
            onPress: () => {
              resetOpportunityData();
              router.push('/(tabs)/opportunities');
            }
          },
          {
            text: 'Create Another',
            onPress: resetOpportunityData
          }
        ]);
      }
    } catch (error) {
      console.error('Error creating content:', error);
      Alert.alert('Error', 'Failed to create content. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const resetOpportunityData = () => {
    setOpportunityData({
      category: null,
      type: [],
      title: '',
      description: '',
      location: '',
      deadline: '',
      requirements: '',
      compensation: '',
      duration: '',
      ageRange: '',
      skillLevel: '',
      contactInfo: '',
      additionalInfo: ''
    });
  };

  const renderModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'post' && styles.modeButtonActive]}
        onPress={() => setMode('post')}
      >
        <Text style={[styles.modeButtonText, mode === 'post' && styles.modeButtonTextActive]}>Post</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'opportunity' && styles.modeButtonActive]}
        onPress={() => setMode('opportunity')}
      >
        <Text style={[styles.modeButtonText, mode === 'opportunity' && styles.modeButtonTextActive]}>Opportunity</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.categoriesList}>
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <IconComponent size={24} color={category.color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderOpportunityForm = () => {
    if (!opportunityData.category) {
      return (
        <View style={styles.categorySelector}>
          <TouchableOpacity
            style={styles.selectCategoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Plus size={24} color={theme.colors.primary} />
            <Text style={styles.selectCategoryText}>Select Category</Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      );
    }

    const selectedCategory = categories.find(c => c.id === opportunityData.category);
    const IconComponent = selectedCategory?.icon || Trophy;

    return (
      <View style={styles.opportunityForm}>
        {/* Selected Category */}
        <View style={styles.selectedCategory}>
          <View style={[styles.categoryIcon, { backgroundColor: selectedCategory?.color + '20' }]}>
            <IconComponent size={20} color={selectedCategory?.color} />
          </View>
          <Text style={styles.selectedCategoryText}>{selectedCategory?.title}</Text>
          <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Type Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.typeSelector}>
            {['paid', 'unpaid', 'local', 'national', 'short-term', 'long-term'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  opportunityData.type.includes(type as OpportunityType) && styles.typeChipSelected
                ]}
                onPress={() => handleTypeToggle(type as OpportunityType)}
              >
                <Text style={[
                  styles.typeChipText,
                  opportunityData.type.includes(type as OpportunityType) && styles.typeChipTextSelected
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Title *"
            placeholderTextColor={theme.colors.textSecondary}
            value={opportunityData.title}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, title: text }))}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description *"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={opportunityData.description}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, description: text }))}
            textAlignVertical="top"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location *"
            placeholderTextColor={theme.colors.textSecondary}
            value={opportunityData.location}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, location: text }))}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Deadline (e.g., March 15, 2024)"
            placeholderTextColor={theme.colors.textSecondary}
            value={opportunityData.deadline}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, deadline: text }))}
          />
        </View>

        {/* Category-specific fields */}
        {opportunityData.category === 'tryouts' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Tryout Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Age Range (e.g., 16-18)"
              placeholderTextColor={theme.colors.textSecondary}
              value={opportunityData.ageRange}
              onChangeText={(text) => setOpportunityData(prev => ({ ...prev, ageRange: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Skill Level Required"
              placeholderTextColor={theme.colors.textSecondary}
              value={opportunityData.skillLevel}
              onChangeText={(text) => setOpportunityData(prev => ({ ...prev, skillLevel: text }))}
            />
          </View>
        )}

        {opportunityData.category === 'sponsorships' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Sponsorship Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Compensation/Benefits"
              placeholderTextColor={theme.colors.textSecondary}
              value={opportunityData.compensation}
              onChangeText={(text) => setOpportunityData(prev => ({ ...prev, compensation: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration"
              placeholderTextColor={theme.colors.textSecondary}
              value={opportunityData.duration}
              onChangeText={(text) => setOpportunityData(prev => ({ ...prev, duration: text }))}
            />
          </View>
        )}

        {opportunityData.category === 'scholarships' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Scholarship Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Scholarship Amount"
              placeholderTextColor={theme.colors.textSecondary}
              value={opportunityData.compensation}
              onChangeText={(text) => setOpportunityData(prev => ({ ...prev, compensation: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Academic Requirements"
              placeholderTextColor={theme.colors.textSecondary}
              value={opportunityData.skillLevel}
              onChangeText={(text) => setOpportunityData(prev => ({ ...prev, skillLevel: text }))}
            />
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Requirements"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={opportunityData.requirements}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, requirements: text }))}
            textAlignVertical="top"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Contact Information"
            placeholderTextColor={theme.colors.textSecondary}
            value={opportunityData.contactInfo}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, contactInfo: text }))}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional Notes"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={opportunityData.additionalInfo}
            onChangeText={(text) => setOpportunityData(prev => ({ ...prev, additionalInfo: text }))}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create {mode === 'post' ? 'Post' : 'Opportunity'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'post' ? 'Share your journey with the community' : 'Post opportunities for athletes'}
          </Text>
        </View>

        {renderModeSelector()}

        {mode === 'post' ? (
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
        ) : (
          renderOpportunityForm()
        )}

        {mode === 'post' ? (
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for great content:</Text>
            <Text style={styles.tip}>• Share your training routines and progress</Text>
            <Text style={styles.tip}>• Post match highlights and achievements</Text>
            <Text style={styles.tip}>• Engage with your community</Text>
            <Text style={styles.tip}>• Use hashtags to increase visibility</Text>
          </View>
        ) : (
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for posting opportunities:</Text>
            <Text style={styles.tip}>• Be clear and specific about requirements</Text>
            <Text style={styles.tip}>• Include all relevant dates and deadlines</Text>
            <Text style={styles.tip}>• Provide clear contact information</Text>
            <Text style={styles.tip}>• Specify if the opportunity is paid or unpaid</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title={isPosting ? (mode === 'post' ? 'Posting...' : 'Publishing...') : (mode === 'post' ? 'Post' : 'Publish Opportunity')}
            onPress={handlePost}
            size="large"
            disabled={isPosting || (mode === 'post' ? (!content.trim() && !selectedMedia) : (!opportunityData.category || !opportunityData.title.trim() || !opportunityData.description.trim()))}
          />
          {isPosting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                {mode === 'post' ? 'Creating your post...' : 'Publishing opportunity...'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {renderCategoryModal()}
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