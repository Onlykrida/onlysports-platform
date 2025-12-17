import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement } from '@/hooks/team-management-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { 
  Users, 
  Calendar, 
  Trophy, 
  AlertCircle, 
  Bell, 
  ChevronRight,
  UserPlus,
  TrendingUp,
  Activity,
} from 'lucide-react-native';

export default function TeamDashboard() {
  const { user } = useAuth();
  const { 
    members, 
    attendanceRecords, 
    injuryRecords, 
    matchRecords,
    announcements,
    loadTeamMembers, 
    loadAttendance, 
    loadInjuries,
    loadMatches,
    loadAnnouncements,
    loadTrainingSessions,
    trainingSession,
  } = useTeamManagement();
  
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = async () => {
    if (!user || user.role !== 'team') return;
    
    try {
      await Promise.all([
        loadTeamMembers(user.id),
        loadAttendance(user.id),
        loadInjuries(user.id),
        loadMatches(user.id),
        loadAnnouncements(user.id),
        loadTrainingSessions(user.id),
      ]);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  if (!user || user.role !== 'team') {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <AlertCircle size={48} color={theme.colors.danger} />
          <Text style={styles.errorText}>This feature is only available for teams and academies</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (isLoading) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading team data...</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const activeInjuries = injuryRecords.filter(i => i.status === 'active' || i.status === 'recovering');
  const upcomingMatches = matchRecords.filter(m => m.result === 'pending' && new Date(m.matchDate) > new Date());
  const todayTraining = trainingSession.filter(t => {
    const today = new Date();
    const sessionDate = new Date(t.sessionDate);
    return sessionDate.toDateString() === today.toDateString();
  });

  const todayAttendance = attendanceRecords.filter(a => {
    const today = new Date();
    const recordDate = new Date(a.sessionDate);
    return recordDate.toDateString() === today.toDateString();
  });

  const attendanceRate = activeMembers.length > 0 && todayAttendance.length > 0
    ? Math.round((todayAttendance.filter(a => a.status === 'present').length / activeMembers.length) * 100)
    : 0;

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Team Management</Text>
            <Text style={styles.subtitle}>{user.name}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{activeMembers.length}</Text>
              <Text style={styles.statLabel}>Active Players</Text>
            </View>
            
            <View style={styles.statCard}>
              <AlertCircle size={24} color={theme.colors.warning} />
              <Text style={styles.statValue}>{activeInjuries.length}</Text>
              <Text style={styles.statLabel}>Injuries</Text>
            </View>

            <View style={styles.statCard}>
              <Trophy size={24} color={theme.colors.secondary} />
              <Text style={styles.statValue}>{upcomingMatches.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>

            <View style={styles.statCard}>
              <Activity size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{attendanceRate}%</Text>
              <Text style={styles.statLabel}>Today Rate</Text>
            </View>
          </View>

          {todayTraining.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today&apos;s Training</Text>
              {todayTraining.map(session => (
                <View key={session.id} style={styles.trainingCard}>
                  <View style={styles.trainingHeader}>
                    <Text style={styles.trainingTitle}>{session.title}</Text>
                    <Text style={styles.trainingTime}>
                      {new Date(session.sessionDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  {session.description && (
                    <Text style={styles.trainingDescription}>{session.description}</Text>
                  )}
                  {session.location && (
                    <Text style={styles.trainingLocation}>📍 {session.location}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {announcements.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Announcements</Text>
                <TouchableOpacity onPress={() => router.push('/team/announcements')}>
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              </View>
              {announcements.slice(0, 3).map(announcement => (
                <View key={announcement.id} style={[
                  styles.announcementCard,
                  announcement.priority === 'urgent' && styles.urgentCard,
                ]}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementContent} numberOfLines={2}>
                    {announcement.content}
                  </Text>
                  <Text style={styles.announcementDate}>
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/team/roster')}
            >
              <View style={styles.menuItemLeft}>
                <Users size={24} color={theme.colors.primary} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Team Roster</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {activeMembers.length} active players
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/team/attendance')}
            >
              <View style={styles.menuItemLeft}>
                <Calendar size={24} color={theme.colors.secondary} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Attendance Tracking</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {todayAttendance.length} records today
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/team/matches')}
            >
              <View style={styles.menuItemLeft}>
                <Trophy size={24} color={theme.colors.warning} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Match Records</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {matchRecords.length} matches recorded
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/team/injuries')}
            >
              <View style={styles.menuItemLeft}>
                <AlertCircle size={24} color={theme.colors.danger} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Injury Management</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {activeInjuries.length} active injuries
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/team/announcements')}
            >
              <View style={styles.menuItemLeft}>
                <Bell size={24} color={theme.colors.success} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Team Announcements</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {announcements.length} announcements
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/team/invite')}
            >
              <View style={styles.menuItemLeft}>
                <UserPlus size={24} color={theme.colors.primary} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Invite Players</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Add new members to your team
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
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
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  trainingCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  trainingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
  },
  trainingTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  trainingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  trainingLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  announcementCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  urgentCard: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  announcementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  announcementContent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  announcementDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  menuSection: {
    padding: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  menuItemSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
