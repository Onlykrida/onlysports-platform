import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import BackgroundGradientWrapper from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { useAnalytics, AthleteWithStats } from '@/hooks/analytics-context';
import { 
  TrendingUp, 
  Trophy, 
  Activity,
  MapPin,
  Filter,
  ChevronRight,
  Zap,
  Award,
  Target,
  Users
} from 'lucide-react-native';

const getRankCategoryColor = (category: string) => {
  switch (category) {
    case 'Elite':
      return theme.colors.accent;
    case 'Advanced':
      return theme.colors.primary;
    case 'Amateur':
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
};

const StatCard = ({ label, value, icon: Icon, color }: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  color: string;
}) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AthleteCard = ({ athlete, onPress }: { athlete: AthleteWithStats; onPress: () => void }) => (
  <TouchableOpacity style={styles.athleteCard} onPress={onPress}>
    <View style={styles.athleteHeader}>
      <View style={styles.athleteInfo}>
        <Text style={styles.athleteName}>{athlete.full_name}</Text>
        <View style={styles.athleteMetaRow}>
          <Text style={styles.athleteSport}>{athlete.sport}</Text>
          <View style={styles.dot} />
          <Text style={styles.athleteAge}>{athlete.age} yrs</Text>
          {athlete.location && (
            <>
              <View style={styles.dot} />
              <MapPin size={12} color={theme.colors.textMuted} />
              <Text style={styles.athleteLocation}>{athlete.location}</Text>
            </>
          )}
        </View>
      </View>
      {athlete.ranking && (
        <View style={[styles.rankBadge, { backgroundColor: getRankCategoryColor(athlete.ranking.rank_category) }]}>
          <Text style={styles.rankBadgeText}>{athlete.ranking.rank_category}</Text>
        </View>
      )}
    </View>

    {athlete.ranking && (
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBar}>
          <View 
            style={[
              styles.scoreBarFill, 
              { 
                width: `${(athlete.ranking.ranking_score / 10) * 100}%`,
                backgroundColor: getRankCategoryColor(athlete.ranking.rank_category)
              }
            ]} 
          />
        </View>
        <Text style={styles.scoreText}>{athlete.ranking.ranking_score.toFixed(2)} / 10</Text>
      </View>
    )}

    {athlete.stats && (
      <View style={styles.statsGrid}>
        <View style={styles.miniStat}>
          <Zap size={14} color={theme.colors.warning} />
          <Text style={styles.miniStatLabel}>Speed</Text>
          <Text style={styles.miniStatValue}>{athlete.stats.speed.toFixed(1)}</Text>
        </View>
        <View style={styles.miniStat}>
          <Activity size={14} color={theme.colors.success} />
          <Text style={styles.miniStatLabel}>Stamina</Text>
          <Text style={styles.miniStatValue}>{athlete.stats.stamina.toFixed(1)}</Text>
        </View>
        <View style={styles.miniStat}>
          <Target size={14} color={theme.colors.primary} />
          <Text style={styles.miniStatLabel}>Agility</Text>
          <Text style={styles.miniStatValue}>{athlete.stats.agility.toFixed(1)}</Text>
        </View>
        <View style={styles.miniStat}>
          <Award size={14} color={theme.colors.accent} />
          <Text style={styles.miniStatLabel}>Match</Text>
          <Text style={styles.miniStatValue}>{athlete.stats.match_performance.toFixed(1)}</Text>
        </View>
      </View>
    )}

    <View style={styles.cardFooter}>
      <Text style={styles.viewDetailsText}>View Full Profile</Text>
      <ChevronRight size={16} color={theme.colors.primary} />
    </View>
  </TouchableOpacity>
);

export default function AnalyticsScreen() {
  const { 
    users, 
    isLoading, 
    refreshData, 
    getTopAthletes, 
    sports, 
    categories, 
    locations,
    filterBySport,
    filterByCategory,
    filterByLocation
  } = useAnalytics();

  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  const filteredAthletes = useMemo(() => {
    let result = users;
    
    if (selectedSport !== 'All') {
      result = filterBySport(selectedSport);
    }
    
    if (selectedCategory !== 'All') {
      result = filterByCategory(selectedCategory);
    }
    
    if (selectedLocation !== 'All') {
      result = filterByLocation(selectedLocation);
    }
    
    return result.sort((a, b) => (b.ranking?.ranking_score || 0) - (a.ranking?.ranking_score || 0));
  }, [users, selectedSport, selectedCategory, selectedLocation, filterBySport, filterByCategory, filterByLocation]);

  const topAthletes = getTopAthletes(3);
  
  const avgScore = useMemo(() => {
    const withScores = filteredAthletes.filter(a => a.ranking);
    if (withScores.length === 0) return 0;
    return withScores.reduce((sum, a) => sum + (a.ranking?.ranking_score || 0), 0) / withScores.length;
  }, [filteredAthletes]);

  const categoryDistribution = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = filteredAthletes.filter(a => a.ranking?.rank_category === cat).length;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredAthletes, categories]);

  const handleAthletePress = (athlete: AthleteWithStats) => {
    console.log('View athlete details:', athlete.id);
  };

  const FilterChip = ({ 
    label, 
    selected, 
    onPress 
  }: { 
    label: string; 
    selected: boolean; 
    onPress: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && users.length === 0) {
    return (
      <BackgroundGradientWrapper style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={48} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </BackgroundGradientWrapper>
    );
  }

  return (
    <BackgroundGradientWrapper style={styles.container}>
      <FlatList
        data={filteredAthletes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AthleteCard athlete={item} onPress={() => handleAthletePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Analytics Dashboard</Text>
              <Text style={styles.subtitle}>Performance insights & rankings</Text>
            </View>

            <View style={styles.statsRow}>
              <StatCard 
                label="Total Athletes" 
                value={users.length} 
                icon={Users}
                color={theme.colors.primary}
              />
              <StatCard 
                label="Avg Score" 
                value={avgScore.toFixed(1)} 
                icon={TrendingUp}
                color={theme.colors.success}
              />
              <StatCard 
                label="Elite" 
                value={categoryDistribution['Elite'] || 0} 
                icon={Trophy}
                color={theme.colors.accent}
              />
            </View>

            {topAthletes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Trophy size={20} color={theme.colors.accent} />
                  <Text style={styles.sectionTitle}>Top Performers</Text>
                </View>
                {topAthletes.map((athlete, index) => (
                  <TouchableOpacity 
                    key={athlete.id}
                    style={styles.topAthleteItem}
                    onPress={() => handleAthletePress(athlete)}
                  >
                    <View style={[styles.rank, { backgroundColor: index === 0 ? theme.colors.accent : index === 1 ? theme.colors.primary : theme.colors.success }]}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.topAthleteInfo}>
                      <Text style={styles.topAthleteName}>{athlete.full_name}</Text>
                      <Text style={styles.topAthleteMeta}>{athlete.sport} • {athlete.location}</Text>
                    </View>
                    <Text style={styles.topAthleteScore}>{athlete.ranking?.ranking_score.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Filter size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Filters</Text>
              </View>

              <Text style={styles.filterLabel}>Sport</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterRowContent}
              >
                <FilterChip 
                  label="All" 
                  selected={selectedSport === 'All'} 
                  onPress={() => setSelectedSport('All')}
                />
                {sports.map((sport) => (
                  <FilterChip 
                    key={sport}
                    label={sport} 
                    selected={selectedSport === sport} 
                    onPress={() => setSelectedSport(sport)}
                  />
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterRowContent}
              >
                <FilterChip 
                  label="All" 
                  selected={selectedCategory === 'All'} 
                  onPress={() => setSelectedCategory('All')}
                />
                {categories.map((cat) => (
                  <FilterChip 
                    key={cat}
                    label={cat} 
                    selected={selectedCategory === cat} 
                    onPress={() => setSelectedCategory(cat)}
                  />
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>Location</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterRowContent}
              >
                <FilterChip 
                  label="All" 
                  selected={selectedLocation === 'All'} 
                  onPress={() => setSelectedLocation('All')}
                />
                {locations.map((loc) => (
                  <FilterChip 
                    key={loc}
                    label={loc} 
                    selected={selectedLocation === loc} 
                    onPress={() => setSelectedLocation(loc)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionHeader}>
              <Activity size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>All Athletes ({filteredAthletes.length})</Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </BackgroundGradientWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase' as const,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  topAthleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  rankText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.white,
  },
  topAthleteInfo: {
    flex: 1,
  },
  topAthleteName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  topAthleteMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  topAthleteScore: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  filterLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  filterRow: {
    marginBottom: theme.spacing.sm,
  },
  filterRowContent: {
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  filterChipTextSelected: {
    color: theme.colors.white,
  },
  athleteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  athleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  athleteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  athleteSport: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  athleteAge: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  athleteLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
  },
  rankBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  rankBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  scoreContainer: {
    marginBottom: theme.spacing.md,
  },
  scoreBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  miniStat: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  viewDetailsText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
});
