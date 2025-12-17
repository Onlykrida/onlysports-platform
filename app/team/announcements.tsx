import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useTeamManagement } from '@/hooks/team-management-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { theme } from '@/constants/theme';
import { Plus, Bell, AlertTriangle, Info } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function TeamAnnouncements() {
  const { user } = useAuth();
  const { announcements, loadAnnouncements, addAnnouncement, deleteAnnouncement, isLoading } = useTeamManagement();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  useEffect(() => {
    if (user?.role === 'team') {
      loadAnnouncements(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    if (!user?.role || user.role !== 'team') return;
    setRefreshing(true);
    await loadAnnouncements(user.id);
    setRefreshing(false);
  };

  const handleAddAnnouncement = async () => {
    if (!user) return;
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await addAnnouncement({
      teamId: user.id,
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      published: true,
    });

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setShowAddForm(false);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
      });
    }
  };

  const handleDelete = (announcementId: string, title: string) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAnnouncement(announcementId);
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle size={20} color={theme.colors.danger} />;
      case 'high':
        return <AlertTriangle size={20} color={theme.colors.warning} />;
      case 'normal':
        return <Bell size={20} color={theme.colors.primary} />;
      case 'low':
        return <Info size={20} color={theme.colors.textSecondary} />;
      default:
        return <Bell size={20} color={theme.colors.primary} />;
    }
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

  if (isLoading && announcements.length === 0) {
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
          {!showAddForm ? (
            <View style={styles.addButtonContainer}>
              <Button
                title="New Announcement"
                onPress={() => setShowAddForm(true)}
                icon={<Plus size={18} color={theme.colors.black} />}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create Announcement</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Content"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={5}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityButtons}>
                {(['low', 'normal', 'high', 'urgent'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority && styles.selectedPriority,
                      priority === 'urgent' && formData.priority === priority && styles.urgentPriority,
                      priority === 'high' && formData.priority === priority && styles.highPriority,
                      priority === 'normal' && formData.priority === priority && styles.normalPriority,
                      priority === 'low' && formData.priority === priority && styles.lowPriority,
                    ]}
                    onPress={() => setFormData({ ...formData, priority })}
                  >
                    <Text style={[
                      styles.priorityText,
                      formData.priority === priority && styles.selectedPriorityText,
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setShowAddForm(false)}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Post"
                  onPress={handleAddAnnouncement}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          <View style={styles.section}>
            {announcements.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyText}>No announcements</Text>
              </View>
            ) : (
              announcements.map((announcement) => (
                <View
                  key={announcement.id}
                  style={[
                    styles.announcementCard,
                    announcement.priority === 'urgent' && styles.urgentCard,
                    announcement.priority === 'high' && styles.highCard,
                  ]}
                >
                  <View style={styles.announcementHeader}>
                    {getPriorityIcon(announcement.priority)}
                    <View style={styles.announcementHeaderText}>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <Text style={styles.announcementMeta}>
                        {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.createdByName || 'Team'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(announcement.id, announcement.title)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.announcementContent}>{announcement.content}</Text>

                  {announcement.priority === 'urgent' && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>URGENT</Text>
                    </View>
                  )}
                </View>
              ))
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
  addButtonContainer: {
    padding: theme.spacing.md,
  },
  formContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  priorityButton: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  selectedPriority: {
    borderWidth: 2,
  },
  urgentPriority: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  highPriority: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  normalPriority: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  lowPriority: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  priorityText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  selectedPriorityText: {
    color: theme.colors.white,
  },
  formButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  section: {
    padding: theme.spacing.md,
  },
  announcementCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  urgentCard: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  highCard: {
    borderColor: theme.colors.warning,
    borderWidth: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  announcementHeaderText: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  announcementMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  deleteText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.danger,
    fontWeight: theme.fontWeight.semibold,
  },
  announcementContent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  urgentBadge: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  urgentBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});
