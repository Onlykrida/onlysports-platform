import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, CheckCircle, XCircle, ChevronLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';

const ItemSeparator = () => <View style={{ height: theme.spacing.sm }} />;
import { useOpportunities, Application } from '@/hooks/opportunities-context';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

export default function MyApplicationsScreen() {
  const { user } = useAuth();
  const { myApplications, isLoading, loadMyApplications } = useOpportunities();

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

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={theme.colors.warning} />;
      case 'accepted':
        return <CheckCircle size={16} color={theme.colors.success} />;
      case 'rejected':
        return <XCircle size={16} color={theme.colors.danger} />;
      default:
        return null;
    }
  };

  const renderApplication = useCallback(({ item }: { item: Application }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.applicationCard}>
        <View style={styles.cardTop}>
          <View style={styles.titleRow}>
            <Text style={styles.opportunityTitle} numberOfLines={2}>
              {item.opportunityTitle || 'Untitled Opportunity'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              {getStatusIcon(item.status)}
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>
              Applied {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.status === 'accepted' && (
          <View style={styles.acceptedBanner}>
            <CheckCircle size={16} color={theme.colors.success} />
            <Text style={styles.acceptedBannerText}>
              Congratulations! Your application has been accepted.
            </Text>
          </View>
        )}

        {item.status === 'rejected' && (
          <View style={styles.rejectedBanner}>
            <XCircle size={16} color={theme.colors.danger} />
            <Text style={styles.rejectedBannerText}>
              Unfortunately, your application was not accepted this time.
            </Text>
          </View>
        )}
      </View>
    );
  }, []);

  if (!user || user.role !== 'athlete') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyTitle}>Athletes Only</Text>
          <Text style={styles.emptySubtext}>Only athletes can view their applications.</Text>
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
        <Text style={styles.headerTitle}>My Applications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && myApplications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={myApplications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemSeparator}
          {...FLATLIST_PERF_PROPS}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadMyApplications}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centeredContainer}>
              <Text style={styles.emptyTitle}>No Applications Yet</Text>
              <Text style={styles.emptySubtext}>
                Browse opportunities and apply to get started.
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  opportunityTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
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
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.successBg,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  acceptedBannerText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerBg,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  rejectedBannerText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
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
