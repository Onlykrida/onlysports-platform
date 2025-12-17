import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement } from '@/hooks/team-management-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { Calendar, Check, X, Clock, AlertCircle } from 'lucide-react-native';

export default function AttendanceTracking() {
  const { user } = useAuth();
  const { members, attendanceRecords, loadTeamMembers, loadAttendance, addAttendance, isLoading } = useTeamManagement();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === 'team') {
      loadTeamMembers(user.id);
      loadAttendance(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    if (!user?.role || user.role !== 'team') return;
    setRefreshing(true);
    await Promise.all([
      loadTeamMembers(user.id),
      loadAttendance(user.id),
    ]);
    setRefreshing(false);
  };

  const todayRecords = attendanceRecords.filter(r => {
    const recordDate = new Date(r.sessionDate);
    return recordDate.toDateString() === selectedDate.toDateString();
  });

  const activeMembers = members.filter(m => m.status === 'active');

  const markAttendance = async (playerId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!user) return;
    
    const result = await addAttendance({
      teamId: user.id,
      playerId,
      sessionDate: selectedDate,
      sessionType: 'training',
      status,
    });

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      loadAttendance(user.id);
    }
  };

  const getAttendanceForPlayer = (playerId: string) => {
    return todayRecords.find(r => r.playerId === playerId);
  };

  const attendanceStats = {
    present: todayRecords.filter(r => r.status === 'present').length,
    absent: todayRecords.filter(r => r.status === 'absent').length,
    late: todayRecords.filter(r => r.status === 'late').length,
    excused: todayRecords.filter(r => r.status === 'excused').length,
  };

  if (!user || user.role !== 'team') {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorText}>Access denied</Text>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  if (isLoading && members.length === 0) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.dateSelector}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
            >
              <Text style={styles.dateButtonText}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.dateDisplay}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
            >
              <Text style={styles.dateButtonText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { borderLeftColor: theme.colors.success }]}>
              <Text style={styles.statValue}>{attendanceStats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: theme.colors.danger }]}>
              <Text style={styles.statValue}>{attendanceStats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: theme.colors.warning }]}>
              <Text style={styles.statValue}>{attendanceStats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: theme.colors.secondary }]}>
              <Text style={styles.statValue}>{attendanceStats.excused}</Text>
              <Text style={styles.statLabel}>Excused</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mark Attendance</Text>
            {activeMembers.map((member) => {
              const attendance = getAttendanceForPlayer(member.playerId);
              return (
                <View key={member.id} style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{member.playerName}</Text>
                    <Text style={styles.playerPosition}>
                      {member.position} • #{member.jerseyNumber || '-'}
                    </Text>
                  </View>

                  <View style={styles.attendanceButtons}>
                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        attendance?.status === 'present' && styles.presentButton,
                      ]}
                      onPress={() => markAttendance(member.playerId, 'present')}
                    >
                      <Check size={18} color={attendance?.status === 'present' ? theme.colors.white : theme.colors.success} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        attendance?.status === 'late' && styles.lateButton,
                      ]}
                      onPress={() => markAttendance(member.playerId, 'late')}
                    >
                      <Clock size={18} color={attendance?.status === 'late' ? theme.colors.white : theme.colors.warning} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        attendance?.status === 'excused' && styles.excusedButton,
                      ]}
                      onPress={() => markAttendance(member.playerId, 'excused')}
                    >
                      <AlertCircle size={18} color={attendance?.status === 'excused' ? theme.colors.white : theme.colors.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        attendance?.status === 'absent' && styles.absentButton,
                      ]}
                      onPress={() => markAttendance(member.playerId, 'absent')}
                    >
                      <X size={18} color={attendance?.status === 'absent' ? theme.colors.white : theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {activeMembers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No active players</Text>
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
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButton: {
    padding: theme.spacing.sm,
  },
  dateButtonText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerCard: {
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  playerPosition: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  attendanceButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presentButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  absentButton: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  lateButton: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  excusedButton: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
});
