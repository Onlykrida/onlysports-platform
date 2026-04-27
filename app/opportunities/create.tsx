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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trophy,
  Users,
  DollarSign,
  FileSignature,
  GraduationCap,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useOpportunities } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

type OpportunityCategory =
  | 'tryouts'
  | 'tournaments'
  | 'sponsorships'
  | 'scholarships'
  | 'contracts';
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

export default function CreateOpportunityScreen() {
  const { user } = useAuth();
  const { refreshOpportunities } = useOpportunities();
  const [showCategoryModal, setShowCategoryModal] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
    additionalInfo: '',
  });

  const categories = [
    {
      id: 'tryouts' as OpportunityCategory,
      title: 'Tryouts',
      description: 'Team tryouts and player evaluations',
      icon: Trophy,
      color: theme.colors.primary,
    },
    {
      id: 'tournaments' as OpportunityCategory,
      title: 'Tournaments',
      description: 'Competitions and tournaments',
      icon: Users,
      color: theme.colors.secondary,
    },
    {
      id: 'sponsorships' as OpportunityCategory,
      title: 'Sponsorships',
      description: 'Brand partnerships and sponsorship deals',
      icon: DollarSign,
      color: theme.colors.accent,
    },
    {
      id: 'scholarships' as OpportunityCategory,
      title: 'Scholarships',
      description: 'Educational scholarships and grants',
      icon: GraduationCap,
      color: theme.colors.info,
    },
    {
      id: 'contracts' as OpportunityCategory,
      title: 'Contracts',
      description: 'Professional contracts and opportunities',
      icon: FileSignature,
      color: theme.colors.orange,
    },
  ];

  const handleCategorySelect = (category: OpportunityCategory) => {
    setOpportunityData((prev) => ({ ...prev, category }));
    setShowCategoryModal(false);
    setShowCreateModal(true);
  };

  const handleTypeToggle = (type: OpportunityType) => {
    setOpportunityData((prev) => ({
      ...prev,
      type: prev.type.includes(type) ? prev.type.filter((t) => t !== type) : [...prev.type, type],
    }));
  };

  const handleCreateOpportunity = async () => {
    if (
      !opportunityData.category ||
      !opportunityData.title.trim() ||
      !opportunityData.description.trim()
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create opportunities');
      return;
    }

    try {
      setIsCreating(true);
      if (__DEV__) console.log('Creating opportunity:', opportunityData);
      Alert.alert('Success', 'Your opportunity has been posted!', [
        {
          text: 'OK',
          onPress: () => {
            resetOpportunityData();
            refreshOpportunities();
            router.back();
          },
        },
      ]);
    } catch (error) {
      if (__DEV__) console.error('Error creating opportunity:', error);
      Alert.alert('Error', 'Failed to create opportunity. Please try again.');
    } finally {
      setIsCreating(false);
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
      additionalInfo: '',
    });
  };

  // Check if user has permission to create opportunities
  if (user?.role !== 'coach' && user?.role !== 'scout' && user?.role !== 'team') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Text style={styles.noPermissionTitle}>Permission Required</Text>
          <Text style={styles.noPermissionText}>
            Only coaches, scouts, and teams can create opportunities.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => router.back()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => router.back()}>
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

      {/* Create Opportunity Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowCategoryModal(true);
          resetOpportunityData();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Opportunity</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setShowCategoryModal(true);
                  resetOpportunityData();
                }}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {opportunityData.category && (
                <View style={styles.selectedCategory}>
                  {(() => {
                    const selectedCategory = categories.find(
                      (c) => c.id === opportunityData.category,
                    );
                    const IconComponent = selectedCategory?.icon || Trophy;
                    return (
                      <>
                        <View
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: selectedCategory?.color + '20' },
                          ]}
                        >
                          <IconComponent size={20} color={selectedCategory?.color} />
                        </View>
                        <Text style={styles.selectedCategoryText}>{selectedCategory?.title}</Text>
                      </>
                    );
                  })()}
                </View>
              )}

              {/* Type Selection */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Type</Text>
                <View style={styles.typeSelector}>
                  {['paid', 'unpaid', 'local', 'national', 'short-term', 'long-term'].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeChip,
                          opportunityData.type.includes(type as OpportunityType) &&
                            styles.typeChipSelected,
                        ]}
                        onPress={() => handleTypeToggle(type as OpportunityType)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            opportunityData.type.includes(type as OpportunityType) &&
                              styles.typeChipTextSelected,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
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
                  onChangeText={(text) => setOpportunityData((prev) => ({ ...prev, title: text }))}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description *"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  value={opportunityData.description}
                  onChangeText={(text) =>
                    setOpportunityData((prev) => ({ ...prev, description: text }))
                  }
                  textAlignVertical="top"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Location *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={opportunityData.location}
                  onChangeText={(text) =>
                    setOpportunityData((prev) => ({ ...prev, location: text }))
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Deadline (e.g., March 15, 2024)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={opportunityData.deadline}
                  onChangeText={(text) =>
                    setOpportunityData((prev) => ({ ...prev, deadline: text }))
                  }
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
                    onChangeText={(text) =>
                      setOpportunityData((prev) => ({ ...prev, ageRange: text }))
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Skill Level Required"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={opportunityData.skillLevel}
                    onChangeText={(text) =>
                      setOpportunityData((prev) => ({ ...prev, skillLevel: text }))
                    }
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
                    onChangeText={(text) =>
                      setOpportunityData((prev) => ({ ...prev, compensation: text }))
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Duration"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={opportunityData.duration}
                    onChangeText={(text) =>
                      setOpportunityData((prev) => ({ ...prev, duration: text }))
                    }
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
                    onChangeText={(text) =>
                      setOpportunityData((prev) => ({ ...prev, compensation: text }))
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Academic Requirements"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={opportunityData.skillLevel}
                    onChangeText={(text) =>
                      setOpportunityData((prev) => ({ ...prev, skillLevel: text }))
                    }
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
                  onChangeText={(text) =>
                    setOpportunityData((prev) => ({ ...prev, requirements: text }))
                  }
                  textAlignVertical="top"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contact Information"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={opportunityData.contactInfo}
                  onChangeText={(text) =>
                    setOpportunityData((prev) => ({ ...prev, contactInfo: text }))
                  }
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional Notes"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  value={opportunityData.additionalInfo}
                  onChangeText={(text) =>
                    setOpportunityData((prev) => ({ ...prev, additionalInfo: text }))
                  }
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!opportunityData.title.trim() || !opportunityData.description.trim()) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleCreateOpportunity}
                disabled={
                  isCreating || !opportunityData.title.trim() || !opportunityData.description.trim()
                }
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Publish Opportunity</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  noPermissionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  noPermissionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
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
  formContainer: {
    padding: theme.spacing.md,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
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
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
});
