import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import {
  Users,
  FileText,
  Briefcase,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Zap,
} from 'lucide-react-native';
import { theme, formatRoleName } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useOpportunities } from '@/hooks/opportunities-context';
import { useScouting } from '@/hooks/scouting-context';
import { User } from '@/types';
import { router } from 'expo-router';

const ORG_ROLES = ['team', 'coach', 'scout', 'gym', 'academy', 'brand'];

export default function TeamDashboardScreen() {
  const { user } = useAuth();
  const {
    opportunities,
    receivedApplications,
    updateApplicationStatus,
    loadReceivedApplications,
    loadOpportunities,
  } = useOpportunities();
  const { getInterestedAthletesForOrg, computeForScout, isComputing } = useScouting();

  const [interestedAthletes, setInterestedAthletes] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Filter to only this org's opportunities
  const myOpportunities = opportunities.filter((o) => o.teamId === user?.id);

  // Group applications by status
  const pendingApps = receivedApplications.filter((a) => a.status === 'pending');
  const acceptedApps = receivedApplications.filter((a) => a.status === 'accepted');
  const rejectedApps = receivedApplications.filter((a) => a.status === 'rejected');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const athletes = await getInterestedAthletesForOrg(user.id);
      setInterestedAthletes(athletes);
      await loadReceivedApplications();
      await loadOpportunities();
    } catch (e) {
      console.error('TeamDashboard: loadData failed', e);
    } finally {
      setLoading(false);
    }
  }, [user, getInterestedAthletesForOrg, loadReceivedApplications, loadOpportunities]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    setUpdatingAppId(appId);
    await updateApplicationStatus(appId, status);
    setUpdatingAppId(null);
  };

  // Gate: only org roles
  if (!user || !ORG_ROLES.includes(user.role)) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Access restricted to organization accounts.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Text style={styles.backLinkText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (loading) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Team Dashboard</Text>
              <Text style={styles.headerSubtitle}>{user.name}</Text>
            </View>
          </View>

          {/* Run AI Match Button */}
          <View style={styles.aiMatchContainer}>
            <TouchableOpacity
              style={styles.aiMatchButton}
              onPress={() => user && computeForScout(user.id)}
              disabled={isComputing}
            >
              {isComputing ? (
                <ActivityIndicator size="small" color={theme.colors.black} />
              ) : (
                <Zap size={18} color={theme.colors.black} />
              )}
              <Text style={styles.aiMatchButtonText}>
                {isComputing ? 'Matching...' : 'Run AI Match'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.quickStatCard, { borderColor: theme.colors.primary }]}>
              <Users size={20} color={theme.colors.primary} />
              <Text style={styles.quickStatValue}>{interestedAthletes.length}</Text>
              <Text style={styles.quickStatLabel}>Athletes</Text>
            </View>
            <View style={[styles.quickStatCard, { borderColor: theme.colors.warning }]}>
              <Clock size={20} color={theme.colors.warning} />
              <Text style={styles.quickStatValue}>{pendingApps.length}</Text>
              <Text style={styles.quickStatLabel}>Pending</Text>
            </View>
            <View style={[styles.quickStatCard, { borderColor: theme.colors.info }]}>
              <Briefcase size={20} color={theme.colors.info} />
              <Text style={styles.quickStatValue}>{myOpportunities.length}</Text>
              <Text style={styles.quickStatLabel}>Active Opps</Text>
            </View>
            <View style={[styles.quickStatCard, { borderColor: theme.colors.textMuted }]}>
              <Eye size={20} color={theme.colors.textMuted} />
              <Text style={styles.quickStatValue}>--</Text>
              <Text style={styles.quickStatLabel}>Views</Text>
            </View>
          </View>

          {/* Roster Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Your Roster</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{interestedAthletes.length}</Text>
              </View>
            </View>
            {interestedAthletes.length > 0 ? (
              interestedAthletes.map((athlete) => (
                <TouchableOpacity
                  key={athlete.id}
                  style={styles.athleteRow}
                  onPress={() => router.push({ pathname: '/user/[id]' as any, params: { id: athlete.id } })}
                >
                  <Image
                    source={{
                      uri:
                        athlete.avatar ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                    }}
                    style={styles.athleteAvatar}
                  />
                  <View style={styles.athleteInfo}>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    <Text style={styles.athleteDetail}>
                      {athlete.sport || 'Athlete'}
                      {athlete.position ? ` \u00B7 ${athlete.position}` : ''}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No athletes on your roster yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Express interest in athlete profiles to add them here
                </Text>
              </View>
            )}
          </View>

          {/* Applications Pipeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.colors.warning} />
              <Text style={styles.sectionTitle}>Applications Pipeline</Text>
            </View>

            {/* Status tabs */}
            <View style={styles.statusTabs}>
              <View style={[styles.statusTab, styles.statusTabPending]}>
                <Clock size={14} color={theme.colors.warning} />
                <Text style={[styles.statusTabText, { color: theme.colors.warning }]}>
                  Pending ({pendingApps.length})
                </Text>
              </View>
              <View style={[styles.statusTab, styles.statusTabAccepted]}>
                <CheckCircle size={14} color={theme.colors.success} />
                <Text style={[styles.statusTabText, { color: theme.colors.success }]}>
                  Accepted ({acceptedApps.length})
                </Text>
              </View>
              <View style={[styles.statusTab, styles.statusTabRejected]}>
                <XCircle size={14} color={theme.colors.danger} />
                <Text style={[styles.statusTabText, { color: theme.colors.danger }]}>
                  Rejected ({rejectedApps.length})
                </Text>
              </View>
            </View>

            {/* Pending applications with action buttons */}
            {pendingApps.length > 0 ? (
              pendingApps.map((app) => (
                <View key={app.id} style={styles.applicationCard}>
                  <View style={styles.appCardHeader}>
                    <Image
                      source={{
                        uri:
                          app.athleteAvatar ||
                          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
                      }}
                      style={styles.appAvatar}
                    />
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.athleteName || 'Unknown Athlete'}</Text>
                      <Text style={styles.appDetail}>
                        {app.athleteSport || ''}
                        {app.athletePosition ? ` \u00B7 ${app.athletePosition}` : ''}
                      </Text>
                      <Text style={styles.appOpportunity}>{app.opportunityTitle}</Text>
                    </View>
                  </View>
                  <View style={styles.appActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleUpdateStatus(app.id, 'accepted')}
                      disabled={updatingAppId === app.id}
                    >
                      {updatingAppId === app.id ? (
                        <ActivityIndicator size="small" color={theme.colors.black} />
                      ) : (
                        <>
                          <CheckCircle size={14} color={theme.colors.black} />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleUpdateStatus(app.id, 'rejected')}
                      disabled={updatingAppId === app.id}
                    >
                      <XCircle size={14} color={theme.colors.danger} />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending applications</Text>
              </View>
            )}

            {/* Accepted applications (compact) */}
            {acceptedApps.length > 0 && (
              <View style={styles.compactSection}>
                <Text style={styles.compactSectionTitle}>Recently Accepted</Text>
                {acceptedApps.slice(0, 3).map((app) => (
                  <View key={app.id} style={styles.compactAppRow}>
                    <CheckCircle size={14} color={theme.colors.success} />
                    <Text style={styles.compactAppText}>
                      {app.athleteName} - {app.opportunityTitle}
                    </Text>
                  </View>
                ))}
                {acceptedApps.length > 3 && (
                  <Text style={styles.moreText}>+{acceptedApps.length - 3} more</Text>
                )}
              </View>
            )}

            {/* Rejected applications (compact) */}
            {rejectedApps.length > 0 && (
              <View style={styles.compactSection}>
                <Text style={styles.compactSectionTitle}>Recently Rejected</Text>
                {rejectedApps.slice(0, 3).map((app) => (
                  <View key={app.id} style={styles.compactAppRow}>
                    <XCircle size={14} color={theme.colors.danger} />
                    <Text style={styles.compactAppText}>
                      {app.athleteName} - {app.opportunityTitle}
                    </Text>
                  </View>
                ))}
                {rejectedApps.length > 3 && (
                  <Text style={styles.moreText}>+{rejectedApps.length - 3} more</Text>
                )}
              </View>
            )}
          </View>

          {/* Opportunities Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color={theme.colors.info} />
              <Text style={styles.sectionTitle}>Your Opportunities</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{myOpportunities.length}</Text>
              </View>
            </View>
            {myOpportunities.length > 0 ? (
              myOpportunities.map((opp) => {
                const isExpired = new Date(opp.deadline) < new Date();
                return (
                  <TouchableOpacity
                    key={opp.id}
                    style={styles.opportunityCard}
                    onPress={() => router.push({ pathname: '/(tabs)/opportunities' as any })}
                  >
                    <View style={styles.oppHeader}>
                      <Text style={styles.oppTitle} numberOfLines={1}>
                        {opp.title}
                      </Text>
                      <View
                        style={[
                          styles.oppTypeBadge,
                          isExpired && { backgroundColor: theme.colors.dangerBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.oppTypeText,
                            isExpired && { color: theme.colors.danger },
                          ]}
                        >
                          {isExpired ? 'Expired' : opp.type}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.oppDetails}>
                      <Text style={styles.oppDetailText}>
                        Deadline: {new Date(opp.deadline).toLocaleDateString()}
                      </Text>
                      <View style={styles.oppAppsCount}>
                        <FileText size={12} color={theme.colors.textMuted} />
                        <Text style={styles.oppDetailText}>
                          {opp.applicationsCount || 0} applications
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No opportunities created yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create opportunities to attract athletes
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  backLink: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  backLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // AI Match
  aiMatchContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  aiMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  aiMatchButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Quick Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  quickStatValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  section: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.black,
  },

  // Athlete Row
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  athleteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  athleteDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Status tabs
  statusTabs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statusTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusTabPending: {
    backgroundColor: theme.colors.warning + '15',
  },
  statusTabAccepted: {
    backgroundColor: theme.colors.successBg,
  },
  statusTabRejected: {
    backgroundColor: theme.colors.dangerBg,
  },
  statusTabText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Application card
  applicationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  appAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  appDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  appOpportunity: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 2,
    fontWeight: theme.fontWeight.semibold,
  },
  appActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  acceptButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  rejectButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Compact sections
  compactSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  compactSectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  compactAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  compactAppText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  moreText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },

  // Opportunity card
  opportunityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  oppTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  oppTypeBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  oppTypeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  oppDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oppDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  oppAppsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyStateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
