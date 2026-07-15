import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  SlidersHorizontal,
  ClipboardList,
  Settings2,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { formatDate } from '@/constants/format-date';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { useOpportunities, Opportunity } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';
import { Stack, router } from 'expo-router';
import CreateOpportunityModal from '@/components/CreateOpportunityModal';
import EmptyState from '@/components/EmptyState';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import { OpportunitySkeletonList } from '@/components/SkeletonScreens';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';

const ItemSeparator = () => <View style={{ height: 2 }} />;

type OpportunityCategory =
  'tryouts' | 'tournaments' | 'sponsorships' | 'scholarships' | 'contracts';
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
  const { opportunities, isLoading, refreshOpportunities } = useOpportunities();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { track } = useAnalytics();

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'opportunities' });
  }, []);

  const canCreateOpportunity =
    user?.role === 'coach' ||
    user?.role === 'scout' ||
    user?.role === 'team' ||
    user?.role === 'gym' ||
    user?.role === 'brand' ||
    user?.role === 'academy';
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
    additionalInfo: '',
  });

  const filteredOpportunities = useMemo(() => {
    let list = opportunities;

    if (selectedType) {
      list = list.filter((opp) => opp.type === selectedType);
    }

    if (selectedSport) {
      list = list.filter((opp) => opp.sport?.toLowerCase() === selectedSport?.toLowerCase());
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
    const uniqueSports = [...new Set(opportunities.map((opp) => opp.sport).filter(Boolean))];
    return uniqueSports.map((sport) => ({ id: sport.toLowerCase(), label: sport }));
  }, [opportunities]);

  // Applying now happens on the detail screen behind an explicit confirm
  // step (app/opportunity/[id].tsx) — the card never submits directly.
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tryouts':
        return theme.colors.primary;
      case 'tournaments':
        return theme.colors.secondary;
      case 'sponsorships':
        return theme.colors.accent;
      case 'scholarships':
        return theme.colors.accent;
      case 'contracts':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderOpportunity = useCallback(
    ({ item }: { item: Opportunity }) => {
      const canApply = user?.role === 'athlete' && !item.hasApplied;

      return (
        <TouchableOpacity
          style={styles.opportunityCard}
          onPress={() => {
            track(EVENTS.OPPORTUNITY_VIEWED, { opportunityId: item.id });
            router.push(`/opportunity/${item.id}` as any);
          }}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.title} details`}
        >
          <View style={styles.cardHeader}>
            {/* getTypeColor existed but the tag hardcoded green — every
                category looked identical (design audit: dead code, wired) */}
            <View style={[styles.typeTag, { borderColor: getTypeColor(item.type) }]}>
              <Text
                style={[styles.typeText, { color: getTypeColor(item.type) }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.sportTag}>
              <Text style={styles.sportTagText} numberOfLines={1} ellipsizeMode="tail">
                {item.sport}
              </Text>
            </View>
          </View>

          <Text style={styles.opportunityTitle} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={styles.organization} numberOfLines={1} ellipsizeMode="tail">
            {item.teamName || 'Unknown Team'}
          </Text>

          <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
            {item.description}
          </Text>

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <MapPin size={14} color={theme.colors.orange} style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                {item.location}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar size={14} color={theme.colors.cyan} style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                Deadline: {formatDate(item.deadline)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <DollarSign
                size={14}
                color={item.paid ? theme.colors.orange : theme.colors.textSecondary}
                style={styles.detailIcon}
              />
              <Text
                style={[styles.detailText, item.paid && styles.paidText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.paid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>

          {item.requirements &&
            Array.isArray(item.requirements) &&
            item.requirements.length > 0 && (
              <View style={styles.requirements}>
                <Text style={styles.requirementsTitle}>Requirements:</Text>
                {item.requirements.slice(0, 2).map((req, index) => (
                  <Text
                    key={index}
                    style={styles.requirement}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    • {req}
                  </Text>
                ))}
                {item.requirements.length > 2 && (
                  <Text style={styles.requirement}>• +{item.requirements.length - 2} more</Text>
                )}
              </View>
            )}

          <View style={styles.footer}>
            <View style={styles.applicants}>
              <Users size={14} color={theme.colors.cyan} style={styles.footerIcon} />
              <Text style={styles.applicantsText} numberOfLines={1} ellipsizeMode="tail">
                {item.applicationsCount || 0} applicants
              </Text>
            </View>

            {/* One blind tap used to submit the application from the card.
                Now the CTA routes to the detail screen: requirements +
                what's-shared + explicit confirm (design audit, Wave A). */}
            {canApply && (
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  track(EVENTS.OPPORTUNITY_VIEWED, { opportunityId: item.id });
                  router.push(`/opportunity/${item.id}` as any);
                }}
                accessibilityRole="button"
                accessibilityLabel={`View and apply to ${item.title}`}
              >
                <Text style={styles.applyButtonText} numberOfLines={1} ellipsizeMode="tail">
                  View & Apply
                </Text>
              </TouchableOpacity>
            )}

            {item.hasApplied && (
              <View style={styles.appliedButton}>
                <Text style={styles.appliedButtonText} numberOfLines={1} ellipsizeMode="tail">
                  Applied
                </Text>
              </View>
            )}

            {user?.role !== 'athlete' && (
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText} numberOfLines={1} ellipsizeMode="tail">
                  View Details
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [user, track, getTypeColor],
  );

  const types = [
    { id: 'tryouts', label: 'Tryouts' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'sponsorships', label: 'Sponsorships' },
    { id: 'scholarships', label: 'Scholarships' },
    { id: 'contracts', label: 'Contracts' },
  ];

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
            setShowCreateModal(false);
            refreshOpportunities();
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
      }),
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
      outputRange: [0, 300],
    });

    return (
      <View>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title} testID="opportunities-title">
                Opportunities
              </Text>
              <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                Find your next big break
              </Text>
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
          <View style={styles.navButtonsRow}>
            {user?.role === 'athlete' && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.push('/opportunities/my-applications' as any)}
                testID="my-applications-button"
              >
                <ClipboardList size={16} color={theme.colors.primary} />
                <Text style={styles.navButtonText}>My Applications</Text>
                <ChevronRight size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            {canCreateOpportunity && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.push('/opportunities/manage-applications' as any)}
                testID="manage-applications-button"
              >
                <Settings2 size={16} color={theme.colors.primary} />
                <Text style={styles.navButtonText}>Manage Applications</Text>
                <ChevronRight size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Animated.View
          style={[styles.filtersWrap, { maxHeight: filterMaxHeight, opacity: filterOpacity }]}
        >
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
              <Text
                style={[styles.filterText, !selectedType && styles.filterTextActive]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                All Types
              </Text>
            </TouchableOpacity>
            {types.map((type) => (
              <TouchableOpacity
                testID={`chip-${type.id}`}
                key={type.id}
                style={[styles.filterChip, selectedType === type.id && styles.filterChipActive]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text
                  style={[styles.filterText, selectedType === type.id && styles.filterTextActive]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {type.label}
                </Text>
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
                <Text
                  style={[styles.filterText, !selectedSport && styles.filterTextActive]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  All Sports
                </Text>
              </TouchableOpacity>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.filterChip, selectedSport === sport.id && styles.filterChipActive]}
                  onPress={() => setSelectedSport(sport.id)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedSport === sport.id && styles.filterTextActive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {sport.label}
                  </Text>
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
              <Text
                style={[styles.filterText, !selectedPayment && styles.filterTextActive]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="chip-paid"
              style={[styles.filterChip, selectedPayment === 'paid' && styles.filterChipActive]}
              onPress={() => setSelectedPayment('paid')}
            >
              <Text
                style={[styles.filterText, selectedPayment === 'paid' && styles.filterTextActive]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Paid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="chip-unpaid"
              style={[styles.filterChip, selectedPayment === 'unpaid' && styles.filterChipActive]}
              onPress={() => setSelectedPayment('unpaid')}
            >
              <Text
                style={[styles.filterText, selectedPayment === 'unpaid' && styles.filterTextActive]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Unpaid
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
        {!showFilters && getActiveFiltersCount > 0 && (
          <View style={styles.activeFiltersBar}>
            <Text style={styles.activeFiltersText}>Filters: {getActiveFiltersCount} active</Text>
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
    );
  }, [
    selectedType,
    selectedSport,
    selectedPayment,
    user,
    sports,
    types,
    showFilters,
    filterHeight,
    filterOpacity,
    toggleFilters,
    getActiveFiltersCount,
  ]);

  if (isLoading) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          {FiltersBar}
          <OpportunitySkeletonList />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerRight: () =>
              canCreateOpportunity ? (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowCreateModal(true)}
                  testID="create-opportunity-button"
                >
                  <Plus size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              ) : null,
          }}
        />
        {FiltersBar}
        <FlatList
          data={filteredOpportunities}
          renderItem={renderOpportunity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemSeparator}
          testID="opportunities-list"
          {...FLATLIST_PERF_PROPS}
          onRefresh={refreshOpportunities}
          refreshing={isLoading}
          ListEmptyComponent={
            <EmptyState
              preset="opportunities"
              subtitle="New tryouts, scholarships, and tournaments are posted daily — try widening your filters or check back soon."
            />
          }
        />

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
                      <View
                        style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}
                      >
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
        <CreateOpportunityModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        {/* Old Modal - keeping for reference but not used */}
        {false && (
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
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreateModal(false);
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
                            <Text style={styles.selectedCategoryText}>
                              {selectedCategory?.title}
                            </Text>
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
                      onChangeText={(text) =>
                        setOpportunityData((prev) => ({ ...prev, title: text }))
                      }
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
                      isCreating ||
                      !opportunityData.title.trim() ||
                      !opportunityData.description.trim()
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
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    letterSpacing: theme.letterSpacing.wide,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    letterSpacing: theme.letterSpacing.wide,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
  },
  filtersWrap: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderBottomColor: theme.colors.cardBorder,
  },
  filterContainer: {
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderStyle: 'solid',
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: '#aaa',
    fontWeight: theme.fontWeight.bold,
  },
  filterTextActive: {
    color: theme.colors.black,
    fontFamily: theme.fontFamily.displayBlack,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  opportunityCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
    marginBottom: 10,
  },
  typeTag: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '45%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  typeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  sportTag: {
    flexShrink: 1,
    maxWidth: '45%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  sportTagText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: 0.5,
  },
  opportunityTitle: {
    fontSize: 15,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  organization: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.orange,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: theme.letterSpacing.wide,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
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
  detailIcon: {
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  paidText: {
    color: theme.colors.orange,
    fontWeight: theme.fontWeight.extrabold,
  },
  requirements: {
    marginBottom: theme.spacing.md,
  },
  requirementsTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  requirement: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  applicants: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 0,
  },
  footerIcon: {
    flexShrink: 0,
  },
  applicantsText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.cyan,
    fontWeight: theme.fontWeight.bold,
  },
  applyButton: {
    flexShrink: 0,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  applyButtonText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.black,
    letterSpacing: 1,
  },
  separator: {
    height: 2,
  },
  segmentedRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  segmentItemActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  segmentTextActive: {
    color: theme.colors.black,
    fontFamily: theme.fontFamily.displayBlack,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: theme.colors.black,
    fontSize: 12,
    fontFamily: theme.fontFamily.displayBlack,
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  activeFiltersText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
  },
  clearFiltersButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  clearFiltersText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.extrabold,
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
    gap: theme.spacing.sm,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  appliedButton: {
    flexShrink: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  appliedButtonText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.primary,
  },
  viewButton: {
    flexShrink: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  viewButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
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
    color: theme.colors.textMuted,
  },
  navButtonsRow: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    gap: theme.spacing.sm,
  },
  navButtonText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  headerButton: {
    marginRight: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBg,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  categoriesList: {
    padding: theme.spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
  },
  categoryIcon: {
    flexShrink: 0,
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
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  formContainer: {
    padding: theme.spacing.md,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
  },
  categoryBadge: {
    flexShrink: 0,
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
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderStyle: 'solid',
  },
  typeChipText: {
    fontSize: theme.fontSize.sm,
    color: '#aaa',
    fontWeight: theme.fontWeight.bold,
  },
  typeChipTextSelected: {
    color: theme.colors.black,
    fontFamily: theme.fontFamily.displayBlack,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.black,
    letterSpacing: 1,
  },
});
