import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { mockOpportunities } from '@/mocks/data';
import { Opportunity } from '@/types';

export default function OpportunitiesScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showing, setShowing] = useState<'all' | 'paid' | 'unpaid'>('all');
  const opportunities = mockOpportunities;

  const filteredOpportunities = useMemo(() => {
    console.log('[Opportunities] filtering with', { selectedType, showing });
    let list = selectedType ? opportunities.filter((opp) => opp.type === selectedType) : opportunities;
    if (showing !== 'all') {
      list = list.filter((opp) => {
        const hasComp = Boolean(opp.compensation && opp.compensation.trim().length > 0);
        return showing === 'paid' ? hasComp : !hasComp;
      });
    }
    return list;
  }, [opportunities, selectedType, showing]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tryout': return theme.colors.primary;
      case 'tournament': return theme.colors.secondary;
      case 'sponsorship': return theme.colors.accent;
      case 'job': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const renderOpportunity = useCallback(({ item }: { item: Opportunity }) => (
    <TouchableOpacity style={styles.opportunityCard}>
      <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
        <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
      </View>

      <Text style={styles.opportunityTitle}>{item.title}</Text>
      <Text style={styles.organization}>{item.organization}</Text>

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
          <Text style={styles.detailText}>Deadline: {item.deadline}</Text>
        </View>
        {item.compensation && (
          <View style={styles.detailItem}>
            <DollarSign size={14} color={theme.colors.success} />
            <Text style={styles.detailText}>{item.compensation}</Text>
          </View>
        )}
      </View>

      {item.requirements && (
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          {item.requirements.slice(0, 2).map((req, index) => (
            <Text key={index} style={styles.requirement}>• {req}</Text>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.applicants}>
          <Users size={14} color={theme.colors.textSecondary} />
          <Text style={styles.applicantsText}>{item.applicants} applicants</Text>
        </View>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), []);

  const types = [
    { id: 'tryout', label: 'Tryouts' },
    { id: 'tournament', label: 'Tournaments' },
    { id: 'sponsorship', label: 'Sponsorships' },
    { id: 'job', label: 'Jobs' },
  ];

  const ListHeader = useMemo(() => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title} testID="opportunities-title">Opportunities</Text>
        <Text style={styles.subtitle}>Find your next big break</Text>
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
            <Text style={[styles.filterText, !selectedType && styles.filterTextActive]}>All</Text>
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
        <View style={styles.segmentedRow}>
          {(['all','paid','unpaid'] as const).map((key) => (
            <TouchableOpacity
              key={key}
              testID={`chip-${key}`}
              style={[styles.segmentItem, showing === key && styles.segmentItemActive]}
              onPress={() => setShowing(key)}
            >
              <Text style={[styles.segmentText, showing === key && styles.segmentTextActive]}>{key === 'all' ? 'All' : key === 'paid' ? 'Paid' : 'Unpaid'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  ), [selectedType, showing]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredOpportunities}
        renderItem={renderOpportunity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
        testID="opportunities-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContainer: {
    backgroundColor: theme.colors.white,
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
    color: theme.colors.text,
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
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
    backgroundColor: theme.colors.white,
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
});