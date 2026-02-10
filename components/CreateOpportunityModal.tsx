import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, DollarSign, Users, Trophy, Award, Briefcase, GraduationCap } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useOpportunities, Opportunity } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';

interface CreateOpportunityModalProps {
  visible: boolean;
  onClose: () => void;
}

type OpportunityCategory = 'tryouts' | 'tournaments' | 'sponsorships' | 'scholarships' | 'contracts';

interface CategoryConfig {
  id: OpportunityCategory;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const categories: CategoryConfig[] = [
  {
    id: 'tryouts',
    label: 'Tryouts',
    icon: Users,
    color: theme.colors.primary,
    description: 'Team tryouts and player evaluations'
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: Trophy,
    color: theme.colors.secondary,
    description: 'Competitive tournaments and events'
  },
  {
    id: 'sponsorships',
    label: 'Sponsorships',
    icon: DollarSign,
    color: theme.colors.accent,
    description: 'Sponsorship opportunities and partnerships'
  },
  {
    id: 'scholarships',
    label: 'Scholarships',
    icon: GraduationCap,
    color: theme.colors.success,
    description: 'Educational scholarships and grants'
  },
  {
    id: 'contracts',
    label: 'Contracts',
    icon: Briefcase,
    color: '#FF6F00',
    description: 'Professional contracts and job opportunities'
  },
];

interface FormData {
  title: string;
  description: string;
  sport: string;
  location: string;
  deadline: string;
  paid: boolean;
  requirements: string[];
  // Category-specific fields
  duration?: string;
  ageGroup?: string;
  skillLevel?: string;
  compensation?: string;
  benefits?: string[];
  contractType?: string;
  teamSize?: string;
  registrationFee?: string;
  prizePool?: string;
  sponsorshipAmount?: string;
  scholarshipAmount?: string;
  eligibilityCriteria?: string[];
}

export default function CreateOpportunityModal({ visible, onClose }: CreateOpportunityModalProps) {
  const { createOpportunity } = useOpportunities();
  const { user } = useAuth();
  const [step, setStep] = useState<'category' | 'form'>('category');
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    sport: '',
    location: '',
    deadline: '',
    paid: false,
    requirements: [''],
  });

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setFormData({
      title: '',
      description: '',
      sport: '',
      location: '',
      deadline: '',
      paid: false,
      requirements: [''],
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategorySelect = (category: OpportunityCategory) => {
    setSelectedCategory(category);
    setStep('form');
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      setFormData(prev => ({
        ...prev,
        requirements: prev.requirements.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.sport.trim()) return 'Sport is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.deadline.trim()) return 'Deadline is required';
    
    // Validate deadline format (basic check)
    const deadlineDate = new Date(formData.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return 'Please enter a valid deadline date (YYYY-MM-DD)';
    }
    
    if (deadlineDate <= new Date()) {
      return 'Deadline must be in the future';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'teamId'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: selectedCategory,
        sport: formData.sport.trim(),
        location: formData.location.trim(),
        deadline: formData.deadline,
        paid: formData.paid,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
      };

      const { error } = await createOpportunity(opportunityData);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Opportunity created successfully!');
        handleClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecommendedCategories = () => {
    if (!user?.role) return categories;
    
    const roleRecommendations: Record<string, OpportunityCategory[]> = {
      coach: ['tryouts', 'tournaments'],
      scout: ['tryouts', 'scholarships', 'tournaments'],
      gym: ['tryouts'],
      brand: ['sponsorships', 'tournaments'],
      academy: ['scholarships', 'tryouts'],
      team: ['tryouts', 'tournaments', 'sponsorships'],
    };
    
    const recommended = roleRecommendations[user.role] || [];
    return categories.map(cat => ({
      ...cat,
      recommended: recommended.includes(cat.id)
    }));
  };

  const renderCategorySelection = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.sectionTitle}>Select Opportunity Type</Text>
      <Text style={styles.sectionSubtitle}>
        {user?.role === 'coach' && 'As a coach, you can post tryouts, camps, and tournaments'}
        {user?.role === 'scout' && 'As a scout, you can post tryouts, scholarships, and tournaments'}
        {user?.role === 'gym' && 'As a gym, you can post camps and training programs'}
        {user?.role === 'brand' && 'As a brand, you can post sponsorships and tournaments'}
        {user?.role === 'academy' && 'As an academy, you can post camps, scholarships, and tryouts'}
        {(!user?.role || !['coach', 'scout', 'gym', 'brand', 'academy'].includes(user.role)) && 'Choose the type of opportunity you want to create'}
      </Text>
      
      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {getRecommendedCategories().map((category) => {
          const IconComponent = category.icon;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                (category as any).recommended && styles.categoryCardRecommended
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <IconComponent size={24} color={theme.colors.white} />
              </View>
              <View style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.label}</Text>
                  {(category as any).recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>Recommended</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderFormFields = () => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return null;

    return (
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStep('category')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
            <category.icon size={16} color={theme.colors.white} />
            <Text style={styles.categoryBadgeText}>{category.label}</Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              placeholder={`Enter ${category.label.toLowerCase()} title`}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Provide detailed description"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Sport *</Text>
              <TextInput
                style={styles.input}
                value={formData.sport}
                onChangeText={(value) => updateFormData('sport', value)}
                placeholder="e.g., Soccer, Basketball"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="City, State"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline *</Text>
            <TextInput
              style={styles.input}
              value={formData.deadline}
              onChangeText={(value) => updateFormData('deadline', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Paid Opportunity</Text>
            <Switch
              value={formData.paid}
              onValueChange={(value) => updateFormData('paid', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={formData.paid ? theme.colors.white : theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Category-specific fields */}
        {renderCategorySpecificFields()}

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {formData.requirements.map((requirement, index) => (
            <View key={index} style={styles.requirementRow}>
              <TextInput
                style={[styles.input, styles.requirementInput]}
                value={requirement}
                onChangeText={(value) => updateRequirement(index, value)}
                placeholder={`Requirement ${index + 1}`}
                placeholderTextColor={theme.colors.textSecondary}
              />
              {formData.requirements.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeRequirement(index)}
                >
                  <X size={16} color={theme.colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addRequirement}>
            <Text style={styles.addButtonText}>+ Add Requirement</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create Opportunity</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderCategorySpecificFields = () => {
    if (!selectedCategory) return null;

    switch (selectedCategory) {
      case 'tryout':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tryout Details</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Age Group</Text>
                <TextInput
                  style={styles.input}
                  value={formData.ageGroup || ''}
                  onChangeText={(value) => updateFormData('ageGroup', value)}
                  placeholder="e.g., 16-18, U21"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Skill Level</Text>
                <TextInput
                  style={styles.input}
                  value={formData.skillLevel || ''}
                  onChangeText={(value) => updateFormData('skillLevel', value)}
                  placeholder="Beginner, Intermediate, Advanced"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Size</Text>
              <TextInput
                style={styles.input}
                value={formData.teamSize || ''}
                onChangeText={(value) => updateFormData('teamSize', value)}
                placeholder="Number of players needed"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        );

      case 'tournament':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tournament Details</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Registration Fee</Text>
                <TextInput
                  style={styles.input}
                  value={formData.registrationFee || ''}
                  onChangeText={(value) => updateFormData('registrationFee', value)}
                  placeholder="$0 or amount"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Prize Pool</Text>
                <TextInput
                  style={styles.input}
                  value={formData.prizePool || ''}
                  onChangeText={(value) => updateFormData('prizePool', value)}
                  placeholder="Total prize amount"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={formData.duration || ''}
                onChangeText={(value) => updateFormData('duration', value)}
                placeholder="e.g., 3 days, 1 week"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        );

      case 'sponsorship':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sponsorship Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sponsorship Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.sponsorshipAmount || ''}
                onChangeText={(value) => updateFormData('sponsorshipAmount', value)}
                placeholder="Amount or range"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Benefits Offered</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.benefits?.join(', ') || ''}
                onChangeText={(value) => updateFormData('benefits', value.split(', ').filter(b => b.trim()))}
                placeholder="Equipment, training, travel support, etc."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 'scholarship':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scholarship Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Scholarship Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.scholarshipAmount || ''}
                onChangeText={(value) => updateFormData('scholarshipAmount', value)}
                placeholder="Full/Partial or specific amount"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Eligibility Criteria</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.eligibilityCriteria?.join(', ') || ''}
                onChangeText={(value) => updateFormData('eligibilityCriteria', value.split(', ').filter(c => c.trim()))}
                placeholder="GPA requirements, athletic achievements, etc."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 'job':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contract Details</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Contract Type</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contractType || ''}
                  onChangeText={(value) => updateFormData('contractType', value)}
                  placeholder="Full-time, Part-time, Seasonal"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration || ''}
                  onChangeText={(value) => updateFormData('duration', value)}
                  placeholder="1 year, 2 seasons, etc."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Compensation</Text>
              <TextInput
                style={styles.input}
                value={formData.compensation || ''}
                onChangeText={(value) => updateFormData('compensation', value)}
                placeholder="Salary range or compensation details"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        );

      case 'camp':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Camp Details</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration || ''}
                  onChangeText={(value) => updateFormData('duration', value)}
                  placeholder="1 week, 2 weeks, etc."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Age Group</Text>
                <TextInput
                  style={styles.input}
                  value={formData.ageGroup || ''}
                  onChangeText={(value) => updateFormData('ageGroup', value)}
                  placeholder="8-12, 13-17, etc."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skill Level</Text>
              <TextInput
                style={styles.input}
                value={formData.skillLevel || ''}
                onChangeText={(value) => updateFormData('skillLevel', value)}
                placeholder="All levels, Beginner, Advanced"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {step === 'category' ? 'Create Opportunity' : 'Opportunity Details'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {step === 'category' ? renderCategorySelection() : renderFormFields()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  categoryContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  categoriesScroll: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  categoryContent: {
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
    lineHeight: 18,
  },
  categoryCardRecommended: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  recommendedBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  formContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  categoryBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  requirementInput: {
    flex: 1,
  },
  removeButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
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