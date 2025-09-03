import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  FlatList as RNFlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Plus,
  Trophy,
  FileSignature,
  GraduationCap,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useOpportunities, Opportunity } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import CreateOpportunityModal from '@/components/CreateOpportunityModal';

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

export default function OpportunitiesScreen() {
  const { user } = useAuth();
  const { opportunities, isLoading, applyToOpportunity, refreshOpportunities } = useOpportunities();
  const params = useLocalSearchParams<{ focus?: string }>();
  const listRef = useRef<RNFlatList<Opportunity>>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const filterHeight = useState(new Animated.Value(1))[0];
  const filterOpacity = useState(new Animated.Value(1))[0];
  
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

  const filteredOpportunities = useMemo(() => {
    let list = opportunities;
    
    if (selectedType) {
      list = list.filter((opp) => opp.type === selectedType);
    }
    
    if (selectedSport) {
      list = list.filter((opp) => opp.sport.toLowerCase() === selectedSport.toLowerCase());
    }
    
    if (selectedPayment) {
      if (selectedPayment === 'paid') {
        list = list.filter((opp) => opp.paid === true);
      } else if (selectedPayment === 'unpaid') {
        list = list.filter((opp) => opp.paid === false);
      }
    }
    
    // Show only opportunities for athletes (scouts/coaches can see all)
    if (user?.role === 'athlete') {
      list = list.filter((opp) => !opp.hasApplied);
    }
    
    return list;
  }, [opportunities, selectedType, selectedSport, selectedPayment, user]);

  const sports = useMemo(() => {
    const uniqueSports = [...new Set(opportunities.map(opp => opp.sport))];
    return uniqueSports.map(sport => ({ id: sport.toLowerCase(), label: sport }));
  }, [opportunities]);

  const handleApply = useCallback(async (opportunityId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to apply');
      return;
    }

    if (user.role !== 'athlete') {
      Alert.alert('Error', 'Only athletes can apply to opportunities');
      return;
    }

    setApplyingTo(opportunityId);
    
    try {
      const { error } = await applyToOpportunity(opportunityId);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Your application has been submitted!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application');
    } finally {
      setApplyingTo(null);
    }
  }, [user, applyToOpportunity]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tryout': return theme.colors.primary;
      case 'tournament': return theme.colors.secondary;
      case 'sponsorship': return theme.colors.accent;
      case 'job': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const renderOpportunity = useCallback(({ item }: { item: Opportunity }) => {
    const isApplying = applyingTo === item.id;
    const canApply = user?.role === 'athlete' && !item.hasApplied;
    
    return (
      <TouchableOpacity style={styles.opportunityCard} onPress={() => setSelectedOpportunity(item)} testID={`opp-card-${item.id}`}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.sportTag}>{item.sport}</Text>
        </View>

        <Text style={styles.opportunityTitle}>{item.title}</Text>
        <Text style={styles.organization}>{item.teamName || 'Unknown Team'}</Text>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <MapPin size={14} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <DollarSign size={14} color={item.paid ? theme.colors.success : theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: item.paid ? theme.colors.success : theme.colors.textSecondary }]}>
              {item.paid ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </View>

        {item.requirements && item.requirements.length > 0 && (
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Requirements:</Text>
            {item.requirements.slice(0, 2).map((req, index) => (
              <Text key={index} style={styles.requirement}>• {req}</Text>
            ))}
            {item.requirements.length > 2 && (
              <Text style={styles.requirement}>• +{item.requirements.length - 2} more</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.applicants}>
            <Users size={14} color={theme.colors.textSecondary} />
            <Text style={styles.applicantsText}>{item.applicationsCount || 0} applicants</Text>
          </View>
          
          {canApply && (
            <TouchableOpacity 
              style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
              onPress={() => handleApply(item.id)}
              disabled={isApplying}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.applyButtonText}>Apply Now</Text>
              )}
            </TouchableOpacity>
          )}
          
          {item.hasApplied && (
            <View style={styles.appliedButton}>
              <Text style={styles.appliedButtonText}>Applied</Text>
            </View>
          )}
          
          {user?.role !== 'athlete' && (
            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [applyingTo, user, handleApply, getTypeColor]);

  const types = [
    { id: 'tryout', label: 'Tryouts' },
    { id: 'tournament', label: 'Tournaments' },
    { id: 'sponsorship', label: 'Sponsorships' },
    { id: 'scholarship', label: 'Scholarships' },
  ];

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
    setShowCreateModal(true);
  };

  const handleTypeToggle = (type: OpportunityType) => {
    setOpportunityData(prev => ({
      ...prev,
      type: prev.type.includes(type) 
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const handleCreateOpportunity = async () => {
    if (!opportunityData.category || !opportunityData.title.trim() || !opportunityData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create opportunities');
      return;
    }

    try {
      setIsCreating(true);
      console.log('Creating opportunity:', opportunityData);
      Alert.alert('Success', 'Your opportunity has been posted!', [
        {
          text: 'OK',
          onPress: () => {
            resetOpportunityData();
            setShowCreateModal(false);
            refreshOpportunities();
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating opportunity:', error);
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
      additionalInfo: ''
    });
  };

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
    Animated.parallel([
      Animated.timing(filterHeight, {
        toValue: showFilters ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(filterOpacity, {
        toValue: showFilters ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();
  }, [showFilters, filterHeight, filterOpacity]);

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (selectedSport) count++;
    if (selectedPayment) count++;
    return count;
  }, [selectedType, selectedSport, selectedPayment]);

  const FiltersBar = useMemo(() => {
    const filterMaxHeight = filterHeight.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });

    return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title} testID="opportunities-title">Opportunities</Text>
            <Text style={styles.subtitle}>Find your next big break</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterToggleButton} 
            onPress={toggleFilters}
            testID="filter-toggle-button"
          >
            <SlidersHorizontal size={18} color={theme.colors.primary} />
            {getActiveFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount}</Text>
              </View>
            )}
            {showFilters ? (
              <ChevronUp size={18} color={theme.colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.filtersWrap, { maxHeight: filterMaxHeight, opacity: filterOpacity }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            testID="chip-all-types"
            style={[styles.filterChip, !selectedType && styles.filterChipActive]}
            onPress={() => setSelectedType(null)}
          >
            <Text style={[styles.filterText, !selectedType && styles.filterTextActive]}>All Types</Text>
          </TouchableOpacity>
          {types.map((type) => (
            <TouchableOpacity
              testID={`chip-${type.id}`}
              key={type.id}
              style={[styles.filterChip, selectedType === type.id && styles.filterChipActive]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={[styles.filterText, selectedType === type.id && styles.filterTextActive]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {sports.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, !selectedSport && styles.filterChipActive]}
              onPress={() => setSelectedSport(null)}
            >
              <Text style={[styles.filterText, !selectedSport && styles.filterTextActive]}>All Sports</Text>
            </TouchableOpacity>
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                style={[styles.filterChip, selectedSport === sport.id && styles.filterChipActive]}
                onPress={() => setSelectedSport(sport.id)}
              >
                <Text style={[styles.filterText, selectedSport === sport.id && styles.filterTextActive]}>{sport.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            testID="chip-all-payment"
            style={[styles.filterChip, !selectedPayment && styles.filterChipActive]}
            onPress={() => setSelectedPayment(null)}
          >
            <Text style={[styles.filterText, !selectedPayment && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="chip-paid"
            style={[styles.filterChip, selectedPayment === 'paid' && styles.filterChipActive]}
            onPress={() => setSelectedPayment('paid')}
          >
            <Text style={[styles.filterText, selectedPayment === 'paid' && styles.filterTextActive]}>Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="chip-unpaid"
            style={[styles.filterChip, selectedPayment === 'unpaid' && styles.filterChipActive]}
            onPress={() => setSelectedPayment('unpaid')}
          >
            <Text style={[styles.filterText, selectedPayment === 'unpaid' && styles.filterTextActive]}>Unpaid</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      {!showFilters && getActiveFiltersCount > 0 && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            Filters: {getActiveFiltersCount} active
          </Text>
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedType(null);
              setSelectedSport(null);
              setSelectedPayment(null);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )}, [selectedType, selectedSport, selectedPayment, user, sports, types, showFilters, filterHeight, filterOpacity, toggleFilters, getActiveFiltersCount]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {FiltersBar}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (params?.focus && opportunities.length > 0) {
      const index = opportunities.findIndex(o => o.id === params.focus);
      if (index >= 0) {
        listRef.current?.scrollToIndex({ index, animated: true });
        setTimeout(() => setSelectedOpportunity(opportunities[index] ?? null), 350);
      }
    }
  }, [params?.focus, opportunities]);

  return (
    <SafeAreaView style={styles.container}>
      {FiltersBar}
      <FlatList
        ref={listRef as any}
        data={filteredOpportunities}
        renderItem={renderOpportunity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        testID="opportunities-list"
        onRefresh={refreshOpportunities}
        refreshing={isLoading}
        getItemLayout={(_, index) => ({ length: 200, offset: 200 * index, index })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No opportunities found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
          </View>
        }
      />
      
      {/* Opportunity Details Modal */}
      <Modal
        visible={!!selectedOpportunity}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOpportunity(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOpportunity?.title ?? 'Opportunity'}</Text>
              <TouchableOpacity onPress={() => setSelectedOpportunity(null)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
              {selectedOpportunity && (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                    <View style={[styles.typeTag, { backgroundColor: getTypeColor(selectedOpportunity.type) }]}>
                      <Text style={styles.typeText}>{selectedOpportunity.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.sportTag}>{selectedOpportunity.sport}</Text>
                  </View>
                  <Text style={styles.organization}>{selectedOpportunity.teamName || 'Unknown Team'}</Text>
                  <Text style={styles.description}>{selectedOpportunity.description}</Text>
                  <View style={styles.details}>
                    <View style={styles.detailItem}>
                      <MapPin size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.detailText}>{selectedOpportunity.location}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Calendar size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.detailText}>Deadline: {new Date(selectedOpportunity.deadline).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <DollarSign size={14} color={selectedOpportunity.paid ? theme.colors.success : theme.colors.textSecondary} />
                      <Text style={[styles.detailText, { color: selectedOpportunity.paid ? theme.colors.success : theme.colors.textSecondary }]}>
                        {selectedOpportunity.paid ? 'Paid' : 'Unpaid'}
                      </Text>
                    </View>
                  </View>
                  {!!selectedOpportunity.requirements?.length && (
                    <View style={styles.requirements}>
                      <Text style={styles.requirementsTitle}>Requirements</Text>
                      {selectedOpportunity.requirements.map((req, idx) => (
                        <Text key={`${req}-${idx}`} style={styles.requirement}>• {req}</Text>
                      ))}
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.sm }}>
                    {user?.role === 'athlete' && !selectedOpportunity.hasApplied && (
                      <TouchableOpacity style={styles.applyButton} onPress={() => {
                        setSelectedOpportunity(null);
                        handleApply(selectedOpportunity.id);
                      }}>
                        <Text style={styles.applyButtonText}>Apply Now</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.viewButton} onPress={() => setSelectedOpportunity(null)}>
                      <Text style={styles.viewButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
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

      {/* Create Opportunity Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetOpportunityData();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Opportunity</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                resetOpportunityData();
              }}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              {opportunityData.category && (
                <View style={styles.selectedCategory}>
                  {(() => {
                    const selectedCategory = categories.find(c => c.id === opportunityData.category);
                    const IconComponent = selectedCategory?.icon || Trophy;
                    return (
                      <>
                        <View style={[styles.categoryBadge, { backgroundColor: selectedCategory?.color + '20' }]}>
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

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!opportunityData.title.trim() || !opportunityData.description.trim()) && styles.submitButtonDisabled
                ]}
                onPress={handleCreateOpportunity}
                disabled={isCreating || !opportunityData.title.trim() || !opportunityData.description.trim()}
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
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
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
  filtersWrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  opportunityCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  opportunityTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  organization: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  details: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  requirements: {
    marginBottom: theme.spacing.md,
  },
  requirementsTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  requirement: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  applicantsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  applyButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  separator: {
    height: theme.spacing.sm,
  },
  segmentedRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  segmentItemActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  filterBadge: {
    backgroundColor: theme.colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  filterBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeFiltersText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  clearFiltersButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  clearFiltersText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sportTag: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  appliedButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  appliedButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  viewButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  headerButton: {
    marginRight: theme.spacing.md,
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