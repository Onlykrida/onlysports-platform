import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock, ChevronLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import CachedImage from '@/components/CachedImage';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';

const ItemSeparator = () => <View style={{ height: theme.spacing.sm }} />;
import { useOpportunities, Application } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

export default function ManageApplicationsScreen() {
  const { user } = useAuth();
  const { receivedApplications, isLoading, loadReceivedApplications, updateApplicationStatus } =
    useOpportunities();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdateStatus = useCallback(
    async (applicationId: string, status: 'accepted' | 'rejected', athleteName?: string) => {
      const action = status === 'accepted' ? 'accept' : 'reject';
      const actionPast = status === 'accepted' ? 'accepted' : 'rejected';

      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Application`,
        `Are you sure you want to ${action} ${athleteName || 'this applicant'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: action.charAt(0).toUpperCase() + action.slice(1),
            style: status === 'rejected' ? 'destructive' : 'default',
            onPress: async () => {
              setProcessingId(applicationId);
              try {
                const { error } = await updateApplicationStatus(applicationId, status);
                if (error) {
                  Alert.alert('Error', error);
                } else {
                  Alert.alert('Success', `Application has been ${actionPast}.`);
                }
              } catch {
                Alert.alert('Error', `Failed to ${action} application.`);
              } finally {
                setProcessingId(null);
              }
            },
          },
        ],
      );
    },
    [updateApplicationStatus],
  );

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'accepted':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderApplication = useCallback(
    ({ item }: { item: Application }) => {
      const statusColor = getStatusColor(item.status);
      const isProcessing = processingId === item.id;

      return (
        <View style={styles.applicationCard}>
          <View style={styles.cardTop}>
            <View style={styles.applicantRow}>
              <CachedImage source={item.athleteAvatar} size={44} placeholder="avatar" />
              <View style={styles.applicantInfo}>
                <Text style={styles.applicantName}>{item.athleteName || 'Unknown Athlete'}</Text>
                <View style={styles.applicantMeta}>
                  {item.athleteSport && <Text style={styles.metaText}>{item.athleteSport}</Text>}
                  {item.athleteSport && item.athletePosition && (
                    <Text style={styles.metaDot}> / </Text>
                  )}
                  {item.athletePosition && (
                    <Text style={styles.metaText}>{item.athletePosition}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                {item.status === 'pending' && <Clock size={14} color={statusColor} />}
                {item.status === 'accepted' && <CheckCircle size={14} color={statusColor} />}
                {item.status === 'rejected' && <XCircle size={14} color={statusColor} />}
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.opportunityRow}>
            <Text style={styles.opportunityLabel}>For:</Text>
            <Text style={styles.opportunityTitle} numberOfLines={1}>
              {item.opportunityTitle || 'Untitled Opportunity'}
            </Text>
          </View>

          <Text style={styles.dateText}>
            Applied {new Date(item.createdAt).toLocaleDateString()}
          </Text>

          {item.status === 'pending' && (
            <View style={styles.actionsRow}>
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleUpdateStatus(item.id, 'accepted', item.athleteName)}
                  >
                    <CheckCircle size={16} color={theme.colors.white} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleUpdateStatus(item.id, 'rejected', item.athleteName)}
                  >
                    <XCircle size={16} color={theme.colors.danger} />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      );
    },
    [processingId, handleUpdateStatus],
  );

  const canManage =
    user?.role === 'coach' ||
    user?.role === 'scout' ||
    user?.role === 'team' ||
    user?.role === 'gym' ||
    user?.role === 'brand' ||
    user?.role === 'academy';

  if (!user || !canManage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyTitle}>Permission Required</Text>
          <Text style={styles.emptySubtext}>
            Only coaches, scouts, and teams can manage applications.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Applications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && receivedApplications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={receivedApplications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemSeparator}
          {...FLATLIST_PERF_PROPS}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadReceivedApplications}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centeredContainer}>
              <Text style={styles.emptyTitle}>No Applications Received</Text>
              <Text style={styles.emptySubtext}>
                Applications to your opportunities will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  applicationCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: {
    marginBottom: theme.spacing.sm,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  applicantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  metaDot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  opportunityLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
  opportunityTitle: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  dateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  acceptButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    gap: theme.spacing.xs,
  },
  rejectButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.danger,
  },
  separator: {
    height: theme.spacing.sm,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
});
