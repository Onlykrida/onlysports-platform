import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, DollarSign, Plus } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useOpportunities, Opportunity } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';

export default function OpportunitiesScreen() {
  const { user } = useAuth();
  const { opportunities, isLoading, applyToOpportunity, refreshOpportunities } = useOpportunities();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

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
      <TouchableOpacity style={styles.opportunityCard}>
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

  const FiltersBar = useMemo(() => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title} testID="opportunities-title">Opportunities</Text>
            <Text style={styles.subtitle}>Find your next big break</Text>
          </View>
          {(user?.role === 'coach' || user?.role === 'scout' || user?.role === 'team') && (
            <TouchableOpacity style={styles.createButton}>
              <Plus size={20} color={theme.colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.filtersWrap}>
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
      </View>
    </View>
  ), [selectedType, selectedSport, selectedPayment, user, sports, types]);

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

  return (
    <SafeAreaView style={styles.container}>
      {FiltersBar}
      <FlatList
        data={filteredOpportunities}
        renderItem={renderOpportunity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        testID="opportunities-list"
        onRefresh={refreshOpportunities}
        refreshing={isLoading}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No opportunities found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
          </View>
        }
      />
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
});