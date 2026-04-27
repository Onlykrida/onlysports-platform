import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, ShieldCheck, Heart } from 'lucide-react-native';
import { theme, roleAccents } from '@/constants/theme';
import CachedImage from '@/components/CachedImage';
import { useUsers } from '@/hooks/users-context';
import { useFollow } from '@/hooks/follow-context';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import type { User } from '@/types';

interface Props {
  visible: boolean;
  testResultId: string;
  testTypeLabel: string;
  onClose: () => void;
  onSubmitted: (coachName: string) => void;
}

// Closes the loop on the CoachVerificationQueue card on the coach dashboard.
// Athlete saves a self/app-tested result → opens this modal → picks a coach →
// row inserted into verification_requests with status='pending' → coach
// dashboard surfaces it next refresh → coach approves → tier upgrades from
// app_measured (0.85×) to coach_verified (1.0×).
export default function RequestVerificationModal({
  visible,
  testResultId,
  testTypeLabel,
  onClose,
  onSubmitted,
}: Props) {
  const { users } = useUsers();
  const { isFollowing } = useFollow();
  const { requestCoachVerification } = useFitnessTest();

  const [query, setQuery] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [athleteNotes, setAthleteNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coach, trainer, AND scout can all verify. Athletes choose deliberately —
  // a scout who watches the video is a different trust signal from a coach
  // who was at the test in person, but both are valid verifiers. UI will show
  // role on each row so the athlete picks intentionally. Sort by:
  // 1. Already-followed verifiers at top (signal of relationship)
  // 2. Then alphabetical by name
  const coaches = useMemo(() => {
    const filtered = users
      .filter((u) => u.role === 'coach' || u.role === 'trainer' || u.role === 'scout')
      .filter((u) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          (u.sport ?? '').toLowerCase().includes(q) ||
          (u.location ?? '').toLowerCase().includes(q)
        );
      });
    return filtered.sort((a, b) => {
      const af = isFollowing(a.id) ? 0 : 1;
      const bf = isFollowing(b.id) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name);
    });
  }, [users, query, isFollowing]);

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId) ?? null;

  const handleSubmit = useCallback(async () => {
    if (!selectedCoach) return;
    setIsSubmitting(true);
    setError(null);
    const result = await requestCoachVerification(
      testResultId,
      selectedCoach.id,
      athleteNotes.trim() || undefined,
    );
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSubmitted(selectedCoach.name);
    // Reset for next time
    setSelectedCoachId(null);
    setQuery('');
    setAthleteNotes('');
  }, [selectedCoach, requestCoachVerification, testResultId, onSubmitted, athleteNotes]);

  const renderCoach = useCallback(
    ({ item }: { item: User }) => {
      const accent = roleAccents[item.role]?.accent ?? theme.colors.cyan;
      const isSelected = item.id === selectedCoachId;
      const followed = isFollowing(item.id);
      return (
        <TouchableOpacity
          style={[
            styles.coachRow,
            isSelected && {
              backgroundColor: accent + '15',
              borderColor: accent,
            },
          ]}
          onPress={() => setSelectedCoachId(item.id)}
          activeOpacity={0.7}
        >
          <CachedImage source={item.avatar} size={44} placeholder="avatar" />
          <View style={styles.coachText}>
            <View style={styles.coachNameRow}>
              <Text style={styles.coachName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
              {followed && (
                <Heart size={12} color={theme.colors.primary} fill={theme.colors.primary} />
              )}
            </View>
            <Text style={styles.coachMeta} numberOfLines={1} ellipsizeMode="tail">
              {item.role.toUpperCase()}
              {item.sport ? ` · ${item.sport}` : ''}
              {item.location ? ` · ${item.location}` : ''}
            </Text>
          </View>
          {isSelected && <ShieldCheck size={20} color={accent} />}
        </TouchableOpacity>
      );
    },
    [selectedCoachId, isFollowing],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Request Coach Verification</Text>
            <Text style={styles.subtitle}>{testTypeLabel}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, sport, or location"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <X size={14} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {coaches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {query ? 'No coach matches that search' : 'No coaches found'}
            </Text>
            <Text style={styles.emptyDescription}>
              {query
                ? 'Try a different name or clear the search.'
                : 'Follow a coach from Discover to request verification from them.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={coaches}
            keyExtractor={(item) => item.id}
            renderItem={renderCoach}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {/* Optional context note — only shown after a verifier is selected,
              so the user is committed enough to bother adding context. */}
          {selectedCoach && (
            <View style={styles.notesField}>
              <Text style={styles.notesLabel}>Add a note (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Tested at LB Nagar ground Sunday morning"
                placeholderTextColor={theme.colors.textMuted}
                value={athleteNotes}
                onChangeText={setAthleteNotes}
                multiline
                maxLength={300}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCoach || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedCoach || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.black} />
            ) : (
              <>
                <ShieldCheck size={18} color={theme.colors.black} />
                <Text style={styles.submitText}>
                  {selectedCoach
                    ? `Send Request to ${selectedCoach.name}`
                    : 'Pick a coach, trainer, or scout'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.footerHint}>
            Coach-verified results earn 1.0× scout trust vs 0.85× for app-tested.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardBg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    margin: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: theme.spacing.xs,
  },
  coachText: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  coachName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  coachMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: theme.colors.red + '20',
    borderColor: theme.colors.red,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.red,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    gap: theme.spacing.sm,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.black,
  },
  footerHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  notesField: {
    gap: 6,
  },
  notesLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notesInput: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    minHeight: 60,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlignVertical: 'top',
    ...theme.dashBorder,
  },
});
