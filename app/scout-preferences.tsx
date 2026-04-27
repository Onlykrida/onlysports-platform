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
import { X, Save, ChevronDown } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/Button';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { ScoutPreferencesRow, useScouting } from '@/hooks/scouting-context';

const SPORTS = [
  'Football',
  'Basketball',
  'Soccer',
  'Baseball',
  'Tennis',
  'Golf',
  'Swimming',
  'Track & Field',
  'Volleyball',
  'Hockey',
  'Wrestling',
  'Boxing',
  'MMA',
  'Cricket',
  'Rugby',
  'Other',
];

const POSITIONS: Record<string, string[]> = {
  Football: [
    'Quarterback',
    'Running Back',
    'Wide Receiver',
    'Tight End',
    'Offensive Line',
    'Defensive Line',
    'Linebacker',
    'Cornerback',
    'Safety',
    'Kicker',
    'Punter',
  ],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker'],
  Baseball: [
    'Pitcher',
    'Catcher',
    'First Base',
    'Second Base',
    'Third Base',
    'Shortstop',
    'Left Field',
    'Center Field',
    'Right Field',
  ],
  Tennis: ['Singles', 'Doubles'],
  Cricket: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
  Hockey: ['Goalie', 'Defender', 'Midfielder', 'Forward'],
  Rugby: [
    'Prop',
    'Hooker',
    'Lock',
    'Flanker',
    'Number Eight',
    'Scrum-Half',
    'Fly-Half',
    'Centre',
    'Wing',
    'Fullback',
  ],
  Volleyball: ['Setter', 'Libero', 'Outside Hitter', 'Middle Blocker', 'Opposite Hitter'],
  Other: ['Player', 'Athlete'],
};

export default function ScoutPreferencesScreen() {
  const { user } = useAuth();
  const { computeForScout } = useScouting();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [sport, setSport] = useState('');
  const [preferredPositions, setPreferredPositions] = useState<string[]>([]);
  const [weightSkill, setWeightSkill] = useState(0.3);
  const [weightSpeed, setWeightSpeed] = useState(0.2);
  const [weightStamina, setWeightStamina] = useState(0.15);
  const [weightPositionMatch, setWeightPositionMatch] = useState(0.2);
  const [weightEndurance, setWeightEndurance] = useState(0.15);

  const [showSportPicker, setShowSportPicker] = useState(false);

  const availablePositions = sport ? POSITIONS[sport] || POSITIONS.Other : [];

  const weightSum =
    weightSkill + weightSpeed + weightStamina + weightPositionMatch + weightEndurance;
  const isWeightBalanced = Math.abs(weightSum - 1.0) < 0.05;

  const togglePosition = (pos: string) => {
    setPreferredPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  };

  const loadExistingPrefs = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scout_preferences')
        .select('*')
        .eq('scout_id', user.id)
        .single();

      if (error) {
        if (
          error.code === 'PGRST116' ||
          error.code === 'PGRST205' ||
          error.message?.includes('Could not find')
        ) {
          // No row found or table doesn't exist
        } else {
          if (__DEV__) console.log('ScoutPreferences: load error', error);
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        const row = data as unknown as ScoutPreferencesRow;
        setExistingId(row.id);
        if (row.sport) setSport(row.sport);
        if (row.preferred_positions) setPreferredPositions(row.preferred_positions);
        setWeightSkill(row.weight_skill ?? 0.3);
        setWeightSpeed(row.weight_speed ?? 0.2);
        setWeightStamina(row.weight_stamina ?? 0.15);
        setWeightPositionMatch(row.weight_position_match ?? 0.2);
        setWeightEndurance(row.weight_endurance ?? 0.15);
      }
    } catch (e) {
      if (__DEV__) console.log('ScoutPreferences: load exception', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadExistingPrefs();
  }, [loadExistingPrefs]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    if (!sport) {
      Alert.alert('Error', 'Please select a sport.');
      return;
    }

    if (!isWeightBalanced) {
      Alert.alert(
        'Warning',
        `Your importance weights sum to ${weightSum.toFixed(2)} instead of ~1.0. Adjust them before saving.`,
      );
      return;
    }

    setIsSaving(true);
    try {
      if (!isSupabaseConfigured) {
        Alert.alert('Info', 'Database is not configured. Preferences cannot be saved remotely.');
        setIsSaving(false);
        return;
      }

      const payload = {
        scout_id: user.id,
        sport,
        preferred_positions: preferredPositions,
        weight_skill: parseFloat(weightSkill.toFixed(2)),
        weight_speed: parseFloat(weightSpeed.toFixed(2)),
        weight_stamina: parseFloat(weightStamina.toFixed(2)),
        weight_position_match: parseFloat(weightPositionMatch.toFixed(2)),
        weight_endurance: parseFloat(weightEndurance.toFixed(2)),
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingId) {
        result = await supabase.from('scout_preferences').update(payload).eq('id', existingId);
      } else {
        result = await supabase
          .from('scout_preferences')
          .insert({ ...payload, created_at: new Date().toISOString() });
      }

      if (result.error) {
        if (
          result.error.code === 'PGRST205' ||
          result.error.message?.includes('Could not find the table')
        ) {
          Alert.alert(
            'Setup Required',
            'The scout_preferences table has not been created yet. Please run the database migration first.',
          );
        } else {
          Alert.alert('Error', result.error.message || 'Failed to save preferences.');
        }
      } else {
        Alert.alert('Success', 'Your scouting preferences have been saved!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        // Trigger recommendation recomputation with updated preferences
        void computeForScout(user.id);
      }
    } catch (e) {
      if (__DEV__) console.log('ScoutPreferences: save exception', e);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Please log in to set preferences.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Scouting Preferences',
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
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Sport Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Sport</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sport</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowSportPicker(!showSportPicker)}
              >
                <Text style={[styles.pickerText, !sport && styles.placeholderText]}>
                  {sport || 'Select sport to scout'}
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
                        setPreferredPositions([]);
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
          </View>

          {/* Preferred Positions */}
          {sport ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferred Positions</Text>
              <Text style={styles.sectionHint}>
                Tap to select the positions you are looking for
              </Text>
              <View style={styles.chipsContainer}>
                {availablePositions.map((pos) => {
                  const selected = preferredPositions.includes(pos);
                  return (
                    <TouchableOpacity
                      key={pos}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => togglePosition(pos)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {preferredPositions.length > 0 && (
                <Text style={styles.selectedCount}>
                  {preferredPositions.length} position{preferredPositions.length !== 1 ? 's' : ''}{' '}
                  selected
                </Text>
              )}
            </View>
          ) : null}

          {/* Importance Weights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Importance Weights</Text>
            <View style={styles.weightSumRow}>
              <Text style={styles.weightSumLabel}>Total</Text>
              <Text style={[styles.weightSumValue, !isWeightBalanced && styles.weightSumWarning]}>
                {weightSum.toFixed(2)}
              </Text>
              <Text style={[styles.weightSumHint, !isWeightBalanced && styles.weightSumWarning]}>
                {isWeightBalanced ? '(balanced)' : '(should be ~1.0)'}
              </Text>
            </View>

            <WeightSlider
              label="Skill Importance"
              value={weightSkill}
              onChange={setWeightSkill}
              color={theme.colors.primary}
            />
            <WeightSlider
              label="Speed Importance"
              value={weightSpeed}
              onChange={setWeightSpeed}
              color={theme.colors.info}
            />
            <WeightSlider
              label="Stamina Importance"
              value={weightStamina}
              onChange={setWeightStamina}
              color={theme.colors.warning}
            />
            <WeightSlider
              label="Position Match"
              value={weightPositionMatch}
              onChange={setWeightPositionMatch}
              color={theme.colors.success}
            />
            <WeightSlider
              label="Endurance (Beep Test)"
              value={weightEndurance}
              onChange={setWeightEndurance}
              color="#FF9F0A"
            />
          </View>

          {/* Save Button */}
          <View style={styles.actions}>
            <Button
              title="Save Preferences"
              onPress={handleSave}
              loading={isSaving}
              variant="primary"
            />
            <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ─── Weight Slider Component ─── */
function WeightSlider({
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
  const step = 0.05;
  const decrement = () => onChange(Math.max(0, parseFloat((value - step).toFixed(2))));
  const increment = () => onChange(Math.min(1, parseFloat((value + step).toFixed(2))));

  const percentage = Math.round(value * 100);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color }]}>{value.toFixed(2)}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.sliderControls}>
        <TouchableOpacity style={styles.sliderBtn} onPress={decrement}>
          <Text style={styles.sliderBtnText}>-0.05</Text>
        </TouchableOpacity>
        <View style={styles.sliderValueBadge}>
          <Text style={[styles.sliderValueBadgeText, { color }]}>{percentage}%</Text>
        </View>
        <TouchableOpacity style={styles.sliderBtn} onPress={increment}>
          <Text style={styles.sliderBtnText}>+0.05</Text>
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
    marginBottom: theme.spacing.sm,
  },
  sectionHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
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

  /* Chip styles for multi-select positions */
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },
  chipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  selectedCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Weight sum display */
  weightSumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weightSumLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weightSumValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  weightSumHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  weightSumWarning: {
    color: theme.colors.warning,
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
    minWidth: 70,
    alignItems: 'center',
  },
  sliderValueBadgeText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },

  actions: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
