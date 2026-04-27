import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { X, Save, ChevronDown, Activity } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/Button';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { PlayerStatRow } from '@/hooks/scouting-context';

const SPORTS = [
  'Cricket',
  'Football',
  'Kabaddi',
  'Badminton',
  'Hockey',
  'Athletics',
  'Basketball',
  'Tennis',
  'Swimming',
  'Boxing',
  'Wrestling',
  'Other',
];

const POSITIONS: Record<string, string[]> = {
  Cricket: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
  Football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'],
  Kabaddi: ['Raider', 'Defender', 'All-rounder'],
  Badminton: ['Singles', 'Doubles'],
  Hockey: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Athletics: ['Sprinter', 'Distance Runner', 'Jumper', 'Thrower'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Tennis: ['Singles', 'Doubles'],
  Swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Medley'],
  Boxing: [
    'Flyweight',
    'Bantamweight',
    'Featherweight',
    'Lightweight',
    'Welterweight',
    'Middleweight',
    'Heavyweight',
  ],
  Wrestling: ['Freestyle', 'Greco-Roman', 'Folk Style'],
  Other: ['Player', 'Athlete'],
};

export default function PlayerStatsScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [sport, setSport] = useState(user?.sport || '');
  const [position, setPosition] = useState(user?.position || '');
  const [skill, setSkill] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [stamina, setStamina] = useState(50);

  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const availablePositions = sport ? POSITIONS[sport] || POSITIONS.Other : POSITIONS.Other;

  const loadExistingStats = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', user.id)
        .single();

      if (error) {
        if (
          error.code === 'PGRST116' ||
          error.code === 'PGRST205' ||
          error.message?.includes('Could not find')
        ) {
          // No row found or table doesn't exist - that's fine
        } else {
          if (__DEV__) console.log('PlayerStats: load error', error);
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        const row = data as unknown as PlayerStatRow;
        setExistingId(row.id);
        if (row.sport) setSport(row.sport);
        if (row.position) setPosition(row.position);
        setSkill(row.skill ?? 50);
        setSpeed(row.speed ?? 50);
        setStamina(row.stamina ?? 50);
      }
    } catch (e) {
      if (__DEV__) console.log('PlayerStats: load exception', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadExistingStats();
  }, [loadExistingStats]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save stats.');
      return;
    }

    if (!sport) {
      Alert.alert('Error', 'Please select a sport.');
      return;
    }

    setIsSaving(true);
    try {
      if (!isSupabaseConfigured) {
        Alert.alert('Info', 'Database is not configured. Stats cannot be saved remotely.');
        setIsSaving(false);
        return;
      }

      const payload = {
        player_id: user.id,
        sport,
        position: position || null,
        skill,
        speed,
        stamina,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingId) {
        result = await supabase.from('player_stats').update(payload).eq('id', existingId);
      } else {
        result = await supabase
          .from('player_stats')
          .insert({ ...payload, created_at: new Date().toISOString() });
      }

      if (result.error) {
        if (
          result.error.code === 'PGRST205' ||
          result.error.message?.includes('Could not find the table')
        ) {
          Alert.alert(
            'Setup Required',
            'The player_stats table has not been created yet. Please run the database migration first.',
          );
        } else {
          Alert.alert('Error', result.error.message || 'Failed to save stats.');
        }
      } else {
        Alert.alert('Success', 'Your stats have been saved!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        // TODO: trigger global recompute for all scouts
        // The real-time subscription in scouting-context.tsx listens for
        // player_stats changes and auto-recomputes for the current scout.
      }
    } catch (e) {
      if (__DEV__) console.log('PlayerStats: save exception', e);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Please log in to edit your stats.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Player Stats',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isSaving}>
              <Save size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Sport Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport & Position</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sport</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  setShowSportPicker(!showSportPicker);
                  setShowPositionPicker(false);
                }}
              >
                <Text style={[styles.pickerText, !sport && styles.placeholderText]}>
                  {sport || 'Select your sport'}
                </Text>
                <ChevronDown size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {showSportPicker && (
                <ScrollView style={styles.pickerOptions} nestedScrollEnabled>
                  {SPORTS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.pickerOption, s === sport && styles.pickerOptionSelected]}
                      onPress={() => {
                        setSport(s);
                        setPosition('');
                        setShowSportPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          s === sport && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {sport ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Position</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    setShowPositionPicker(!showPositionPicker);
                    setShowSportPicker(false);
                  }}
                >
                  <Text style={[styles.pickerText, !position && styles.placeholderText]}>
                    {position || 'Select your position'}
                  </Text>
                  <ChevronDown size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {showPositionPicker && (
                  <ScrollView style={styles.pickerOptions} nestedScrollEnabled>
                    {availablePositions.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.pickerOption, p === position && styles.pickerOptionSelected]}
                        onPress={() => {
                          setPosition(p);
                          setShowPositionPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            p === position && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}
          </View>

          {/* Stat Sliders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>

            <StatSlider
              label="Skill"
              value={skill}
              onChange={setSkill}
              color={theme.colors.primary}
            />
            <StatSlider label="Speed" value={speed} onChange={setSpeed} color={theme.colors.info} />
            <StatSlider
              label="Stamina"
              value={stamina}
              onChange={setStamina}
              color={theme.colors.warning}
            />
          </View>

          {/* Summary Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sport</Text>
                <Text style={styles.summaryValue}>{sport || 'Not selected'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Position</Text>
                <Text style={styles.summaryValue}>{position || 'Not selected'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Overall Rating</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: theme.colors.primary, fontWeight: theme.fontWeight.black },
                  ]}
                >
                  {Math.round((skill + speed + stamina) / 3)}
                </Text>
              </View>
            </View>
          </View>

          {/* Beep Test Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Assessment</Text>
            <TouchableOpacity
              style={styles.beepTestLink}
              onPress={() => router.push('/beep-test' as any)}
            >
              <Activity size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <Text style={styles.beepTestLinkTitle}>Beep Test</Text>
                <Text style={styles.beepTestLinkSubtitle}>
                  Measure your endurance with the 20m shuttle run test
                </Text>
              </View>
              <ChevronDown
                size={18}
                color={theme.colors.textSecondary}
                style={{ transform: [{ rotate: '-90deg' }] }}
              />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <View style={styles.actions}>
            <Button title="Save Stats" onPress={handleSave} loading={isSaving} variant="primary" />
            <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ─── Stat Slider Component ─── */
function StatSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  const decrement = () => onChange(Math.max(0, value - 1));
  const increment = () => onChange(Math.min(100, value + 1));
  const decrementBy10 = () => onChange(Math.max(0, value - 10));
  const incrementBy10 = () => onChange(Math.min(100, value + 10));

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.sliderControls}>
        <TouchableOpacity style={styles.sliderBtn} onPress={decrementBy10}>
          <Text style={styles.sliderBtnText}>-10</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sliderBtn} onPress={decrement}>
          <Text style={styles.sliderBtnText}>-1</Text>
        </TouchableOpacity>
        <View style={styles.sliderValueBadge}>
          <Text style={[styles.sliderValueBadgeText, { color }]}>{value}</Text>
        </View>
        <TouchableOpacity style={styles.sliderBtn} onPress={increment}>
          <Text style={styles.sliderBtnText}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sliderBtn} onPress={incrementBy10}>
          <Text style={styles.sliderBtnText}>+10</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
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
  section: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    minHeight: 52,
  },
  pickerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.xs,
    maxHeight: 200,
  },
  pickerOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  pickerOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  pickerOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  /* Slider styles */
  sliderContainer: {
    marginBottom: theme.spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sliderLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  sliderFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  sliderBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sliderBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  sliderValueBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  sliderValueBadgeText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },

  /* Summary card */
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },

  beepTestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  beepTestLinkTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  beepTestLinkSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
