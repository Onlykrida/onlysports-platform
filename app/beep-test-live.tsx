import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Plus, UserMinus, Pause, Play, Square, Users, User } from 'lucide-react-native';

const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;
const Audio = Platform.OS !== 'web' ? require('expo-av').Audio : null;
import { theme } from '@/constants/theme';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { useSensorRecording } from '@/hooks/useSensorRecording';
import {
  YOYO_LEVELS,
  getMaxShuttlesForLevel,
  getSpeedForLevel,
  calculateDistance,
} from '@/constants/fitness-test-data';

/** Shuttle interval in seconds for a given speed (km/h). 40m distance. */
const getShuttleInterval = (speed: number): number => 144 / speed;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestAthlete {
  id: string;
  name: string;
  isRegistered: boolean;
  isActive: boolean;
  eliminatedAt?: { level: number; shuttle: number };
}

type TestMode = 'solo' | 'coach';
type TestPhase = 'setup' | 'running' | 'paused' | 'finished';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeepTestLiveScreen() {
  // Mode & phase
  const [mode, setMode] = useState<TestMode>('solo');
  const [phase, setPhase] = useState<TestPhase>('setup');

  // Test state
  const [currentLevel, setCurrentLevel] = useState(YOYO_LEVELS[0].level);
  const [currentShuttle, setCurrentShuttle] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeToNextBeep, setTimeToNextBeep] = useState(0);

  // Coach mode
  const [athletes, setAthletes] = useState<TestAthlete[]>([]);
  const [athleteName, setAthleteName] = useState('');

  // Audio
  const [sound, setSound] = useState<any>(null);
  const soundRef = useRef<any>(null);

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const nextBeepTimeRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const currentLevelRef = useRef(YOYO_LEVELS[0].level);
  const currentShuttleRef = useRef(0);

  // Sensors
  const { startRecording, stopRecording, getTurnCount, getSensorSummary } = useSensorRecording();
  const [sensorTurnCount, setSensorTurnCount] = useState(0);

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ref so advanceShuttle/scheduleNextBeep can call finishTest without circular deps
  const finishTestRef = useRef<() => void>(() => {});

  // ─── Audio Setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    async function loadSound() {
      try {
        if (!Audio) return;
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        const { sound: loadedSound } = await Audio.Sound.createAsync(
          require('@/assets/audio/beep.wav'),
        );
        if (mounted) {
          setSound(loadedSound);
          soundRef.current = loadedSound;
        }
      } catch (err) {
        if (__DEV__) console.warn('BeepTest: Could not load audio file', err);
      }
    }
    loadSound();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ─── Audio Playback ───────────────────────────────────────────────────────

  const playBeep = useCallback(async () => {
    try {
      await sound?.setPositionAsync(0);
      await sound?.playAsync();
      Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Audio may not be available
      Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [sound]);

  const playTripleBeep = useCallback(async () => {
    await playBeep();
    setTimeout(async () => {
      await playBeep();
    }, 200);
    setTimeout(async () => {
      await playBeep();
    }, 400);
  }, [playBeep]);

  // ─── Shuttle Advancement ──────────────────────────────────────────────────

  const advanceShuttle = useCallback(() => {
    const level = currentLevelRef.current;
    const shuttle = currentShuttleRef.current + 1;
    const maxShuttles = getMaxShuttlesForLevel(level);

    if (shuttle > maxShuttles) {
      // Level complete - advance to next level
      // Find the next Yo-Yo level entry
      const currentIdx = YOYO_LEVELS.findIndex((l) => l.level === level);
      if (currentIdx < 0 || currentIdx >= YOYO_LEVELS.length - 1) {
        // Test complete - max level reached
        finishTestRef.current();
        return;
      }
      const nextLevel = YOYO_LEVELS[currentIdx + 1].level;
      currentLevelRef.current = nextLevel;
      currentShuttleRef.current = 1;
      setCurrentLevel(nextLevel);
      setCurrentShuttle(1);
      playTripleBeep();
    } else {
      currentShuttleRef.current = shuttle;
      setCurrentShuttle(shuttle);
      playBeep();
    }

    // Update distance
    const dist = calculateDistance(currentLevelRef.current, currentShuttleRef.current);
    setTotalDistance(dist);

    // Update sensor turn count
    setSensorTurnCount(getTurnCount());
  }, [playBeep, playTripleBeep, getTurnCount]);

  // ─── Beep Scheduling (with drift compensation) ────────────────────────────

  const scheduleNextBeep = useCallback(() => {
    if (!isRunningRef.current) return;

    const now = Date.now();
    const levelData = YOYO_LEVELS.find((l) => l.level === currentLevelRef.current);
    if (!levelData) {
      finishTestRef.current();
      return;
    }

    const interval = getShuttleInterval(levelData.speed) * 1000;
    nextBeepTimeRef.current = nextBeepTimeRef.current + interval;
    const delay = Math.max(0, nextBeepTimeRef.current - now);

    // Animate progress bar
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: delay,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      if (!isRunningRef.current) return;
      advanceShuttle();
      scheduleNextBeep();
    }, delay);
  }, [advanceShuttle, progressAnim]);

  // ─── Countdown display timer ──────────────────────────────────────────────

  const startCountdownDisplay = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      if (!isRunningRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, (nextBeepTimeRef.current - now) / 1000);
      setTimeToNextBeep(remaining);
      setElapsedTime((now - startTimeRef.current) / 1000);
    }, 50);
  }, []);

  // ─── Test Controls ────────────────────────────────────────────────────────

  const startTest = useCallback(async () => {
    await startRecording();
    isRunningRef.current = true;
    currentLevelRef.current = YOYO_LEVELS[0].level;
    currentShuttleRef.current = 1;
    setCurrentLevel(YOYO_LEVELS[0].level);
    setCurrentShuttle(1);
    setTotalDistance(40);
    setElapsedTime(0);
    setPhase('running');

    startTimeRef.current = Date.now();
    nextBeepTimeRef.current = Date.now();

    // Play initial beep
    playBeep();

    // Schedule the next beep
    scheduleNextBeep();
    startCountdownDisplay();

    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [playBeep, scheduleNextBeep, startCountdownDisplay, startRecording]);

  const pauseTest = useCallback(() => {
    isRunningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    progressAnim.stopAnimation();
    setPhase('paused');
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [progressAnim]);

  const resumeTest = useCallback(() => {
    isRunningRef.current = true;
    const levelData = YOYO_LEVELS.find((l) => l.level === currentLevelRef.current);
    if (!levelData) return;
    const remaining = timeToNextBeep * 1000;
    const interval = getShuttleInterval(levelData.speed) * 1000;

    // Set nextBeepTimeRef so that scheduleNextBeep (which adds interval)
    // ends up scheduling at Date.now() + remaining
    nextBeepTimeRef.current = Date.now() + remaining - interval;

    setPhase('running');
    scheduleNextBeep();
    startCountdownDisplay();
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [timeToNextBeep, scheduleNextBeep, startCountdownDisplay]);

  const finishTest = useCallback(() => {
    isRunningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const sensorSummary = getSensorSummary();
    stopRecording();

    setPhase('finished');
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);

    router.push({
      pathname: '/beep-test-results' as any,
      params: {
        level: currentLevelRef.current.toString(),
        shuttle: currentShuttleRef.current.toString(),
        mode: 'self',
        testType: 'yoyo',
        sensorData: JSON.stringify(sensorSummary),
        sensorTurns: String(sensorSummary.turns_detected),
      },
    });
  }, [getSensorSummary, stopRecording]);

  // Keep ref in sync so advanceShuttle/scheduleNextBeep always call latest version
  finishTestRef.current = finishTest;

  const stopHere = useCallback(() => {
    isRunningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const sensorSummary = getSensorSummary();
    stopRecording();

    // Navigate to results
    router.push({
      pathname: '/beep-test-results' as any,
      params: {
        level: currentLevelRef.current.toString(),
        shuttle: currentShuttleRef.current.toString(),
        mode: 'self',
        testType: 'yoyo',
        sensorData: JSON.stringify(sensorSummary),
        sensorTurns: String(sensorSummary.turns_detected),
      },
    });
  }, [getSensorSummary, stopRecording]);

  const eliminateAthlete = useCallback((athleteId: string) => {
    setAthletes((prev) => {
      const updated = prev.map((a) =>
        a.id === athleteId
          ? {
              ...a,
              isActive: false,
              eliminatedAt: {
                level: currentLevelRef.current,
                shuttle: currentShuttleRef.current,
              },
            }
          : a,
      );

      // Check if all athletes are eliminated
      const activeCount = updated.filter((a) => a.isActive).length;
      if (activeCount === 0) {
        // All eliminated - finish test after state update
        setTimeout(() => {
          isRunningRef.current = false;
          if (timerRef.current) clearTimeout(timerRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);

          const results = updated
            .filter((a) => a.eliminatedAt)
            .map((a) => ({
              name: a.name,
              id: a.isRegistered ? a.id : undefined,
              level: a.eliminatedAt!.level,
              shuttle: a.eliminatedAt!.shuttle,
            }));

          router.push({
            pathname: '/beep-test-results' as any,
            params: {
              results: JSON.stringify(results),
              mode: 'coached',
              testType: 'yoyo',
            },
          });
        }, 100);
      }

      return updated;
    });

    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const confirmStopTest = useCallback(() => {
    Alert.alert('Stop Test', 'Are you sure you want to stop the test?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: () => {
          isRunningRef.current = false;
          if (timerRef.current) clearTimeout(timerRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);

          if (mode === 'solo') {
            router.push({
              pathname: '/beep-test-results' as any,
              params: {
                level: currentLevelRef.current.toString(),
                shuttle: currentShuttleRef.current.toString(),
                mode: 'self',
                testType: 'yoyo',
              },
            });
          } else {
            const results = athletes
              .filter((a) => a.eliminatedAt)
              .map((a) => ({
                name: a.name,
                id: a.isRegistered ? a.id : undefined,
                level: a.eliminatedAt!.level,
                shuttle: a.eliminatedAt!.shuttle,
              }));

            // Also include active athletes at current position
            const activeResults = athletes
              .filter((a) => a.isActive)
              .map((a) => ({
                name: a.name,
                id: a.isRegistered ? a.id : undefined,
                level: currentLevelRef.current,
                shuttle: currentShuttleRef.current,
              }));

            router.push({
              pathname: '/beep-test-results' as any,
              params: {
                results: JSON.stringify([...results, ...activeResults]),
                mode: 'coached',
                testType: 'yoyo',
              },
            });
          }
        },
      },
    ]);
  }, [mode, athletes]);

  // ─── Coach mode helpers ───────────────────────────────────────────────────

  const addAthlete = useCallback(() => {
    const name = athleteName.trim();
    if (!name) return;

    setAthletes((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name,
        isRegistered: false,
        isActive: true,
      },
    ]);
    setAthleteName('');
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [athleteName]);

  const removeAthlete = useCallback((id: string) => {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────

  const currentSpeed = getSpeedForLevel(currentLevel);
  const maxShuttles = getMaxShuttlesForLevel(currentLevel);
  const activeAthletes = athletes.filter((a) => a.isActive);
  const eliminatedAthletes = athletes.filter((a) => !a.isActive);

  // ─── Render: Setup Phase ──────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <Stack.Screen
            options={{
              title: 'YO-YO IR1 TEST',
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: theme.colors.text,
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                  <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
              ),
            }}
          />

          <ScrollView
            contentContainerStyle={styles.setupContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Instructions */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>SETUP</Text>
              <Text style={styles.instructionText}>
                Mark two lines 20 meters apart. Run 20m out and 20m back (one shuttle = 40m). Keep
                pace with the beeps. Speed increases each level. Go as long as you can!
              </Text>
            </View>

            {/* Mode Toggle */}
            <View style={styles.modeSection}>
              <Text style={styles.sectionLabel}>MODE</Text>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'solo' && styles.modeButtonActive]}
                  onPress={() => setMode('solo')}
                >
                  <User
                    size={18}
                    color={mode === 'solo' ? theme.colors.background : theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.modeButtonText, mode === 'solo' && styles.modeButtonTextActive]}
                  >
                    Solo Test
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'coach' && styles.modeButtonActive]}
                  onPress={() => setMode('coach')}
                >
                  <Users
                    size={18}
                    color={mode === 'coach' ? theme.colors.background : theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.modeButtonText, mode === 'coach' && styles.modeButtonTextActive]}
                  >
                    Coach Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Coach Mode: Add Athletes */}
            {mode === 'coach' && (
              <View style={styles.coachSection}>
                <Text style={styles.sectionLabel}>ATHLETES</Text>
                <View style={styles.addAthleteRow}>
                  <TextInput
                    style={styles.athleteInput}
                    placeholder="Athlete name"
                    placeholderTextColor={theme.colors.textMuted}
                    value={athleteName}
                    onChangeText={setAthleteName}
                    onSubmitEditing={addAthlete}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[styles.addButton, !athleteName.trim() && styles.addButtonDisabled]}
                    onPress={addAthlete}
                    disabled={!athleteName.trim()}
                  >
                    <Plus size={20} color={theme.colors.background} />
                  </TouchableOpacity>
                </View>

                {athletes.length > 0 && (
                  <View style={styles.athleteList}>
                    {athletes.map((a, idx) => (
                      <View key={a.id} style={styles.athleteListItem}>
                        <View style={styles.athleteInfo}>
                          <View style={styles.athleteNumber}>
                            <Text style={styles.athleteNumberText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.athleteNameText} numberOfLines={1}>
                            {a.name}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeAthlete(a.id)}
                          style={styles.removeButton}
                        >
                          <UserMinus size={16} color={theme.colors.red} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {athletes.length === 0 && (
                  <Text style={styles.emptyText}>Add at least one athlete to start the test</Text>
                )}
              </View>
            )}

            {/* Start Button */}
            <TouchableOpacity
              style={[
                styles.startButton,
                mode === 'coach' && athletes.length === 0 && styles.startButtonDisabled,
              ]}
              onPress={startTest}
              disabled={mode === 'coach' && athletes.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>START TEST</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  // ─── Render: Running / Paused Phase ───────────────────────────────────────

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.liveContainer}>
      <SafeAreaView style={styles.liveInner}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Level & Shuttle Display */}
        <View style={styles.mainDisplay}>
          <Text style={styles.levelLabel}>LEVEL</Text>
          <Text style={styles.levelNumber}>{currentLevel}</Text>
          <Text style={styles.shuttleText}>
            Shuttle {currentShuttle} / {maxShuttles}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.countdownText}>{timeToNextBeep.toFixed(1)}s</Text>
          </View>

          {/* Speed & Distance */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km/h</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalDistance >= 1000
                  ? `${(totalDistance / 1000).toFixed(1)}k`
                  : totalDistance.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>metres</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.floor(elapsedTime / 60)}:
                {String(Math.floor(elapsedTime % 60)).padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>time</Text>
            </View>
          </View>

          {/* Sensor turn count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: '#64D2FF', fontWeight: '600' }}>
              Sensor Turns: {sensorTurnCount}
            </Text>
          </View>
        </View>

        {/* Solo mode: "I Stopped Here" */}
        {mode === 'solo' && (
          <View style={styles.soloActions}>
            <TouchableOpacity style={styles.stopHereButton} onPress={stopHere} activeOpacity={0.7}>
              <Text style={styles.stopHereText}>I STOPPED HERE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coach mode: Active & Eliminated Athletes */}
        {mode === 'coach' && (
          <ScrollView style={styles.coachLiveSection} showsVerticalScrollIndicator={false}>
            {activeAthletes.length > 0 && (
              <View style={styles.coachGroup}>
                <Text style={styles.coachGroupLabel}>
                  Active: {activeAthletes.length} athlete{activeAthletes.length !== 1 ? 's' : ''}
                </Text>
                {activeAthletes.map((a) => (
                  <View key={a.id} style={styles.coachAthleteRow}>
                    <View style={styles.activeIndicator} />
                    <Text style={styles.coachAthleteName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.outButton}
                      onPress={() => eliminateAthlete(a.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.outButtonText}>OUT</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {eliminatedAthletes.length > 0 && (
              <View style={styles.coachGroup}>
                <Text style={styles.coachGroupLabel}>Eliminated: {eliminatedAthletes.length}</Text>
                {eliminatedAthletes.map((a) => (
                  <View key={a.id} style={styles.eliminatedRow}>
                    <Text style={styles.eliminatedX}>x</Text>
                    <Text style={styles.eliminatedName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.eliminatedLevel}>
                      L{a.eliminatedAt?.level}.{a.eliminatedAt?.shuttle}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {phase === 'paused' ? (
            <TouchableOpacity style={styles.controlButton} onPress={resumeTest}>
              <Play size={20} color={theme.colors.primary} />
              <Text style={styles.controlButtonText}>RESUME</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.controlButton} onPress={pauseTest}>
              <Pause size={20} color={theme.colors.textSecondary} />
              <Text style={styles.controlButtonText}>PAUSE</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonDanger]}
            onPress={confirmStopTest}
          >
            <Square size={20} color={theme.colors.red} />
            <Text style={[styles.controlButtonText, { color: theme.colors.red }]}>STOP TEST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Setup Phase ─────────────────────────────────────────────────────────
  container: {
    flex: 1,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  setupContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  instructionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  instructionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  modeSection: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadow.glow,
  },
  modeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  modeButtonTextActive: {
    color: theme.colors.background,
  },

  // ── Coach Mode Setup ────────────────────────────────────────────────────
  coachSection: {
    gap: theme.spacing.md,
  },
  addAthleteRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  athleteInput: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.glow,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  athleteList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  athleteListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  athleteNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteNumberText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  athleteNameText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    flex: 1,
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },

  // ── Start Button ────────────────────────────────────────────────────────
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadow.ctaGlow,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.background,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // ── Live Test Phase ─────────────────────────────────────────────────────
  liveContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  liveInner: {
    flex: 1,
  },
  mainDisplay: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  levelLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  levelNumber: {
    fontSize: 80,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    lineHeight: 88,
  },
  shuttleText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },

  // ── Progress Bar ────────────────────────────────────────────────────────
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    width: '100%',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  countdownText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    minWidth: 44,
    textAlign: 'right',
  },

  // ── Stats Row ───────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ── Solo Actions ────────────────────────────────────────────────────────
  soloActions: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  stopHereButton: {
    backgroundColor: theme.colors.red,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.fire,
  },
  stopHereText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: '#FFFFFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // ── Coach Live Section ──────────────────────────────────────────────────
  coachLiveSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  coachGroup: {
    marginBottom: theme.spacing.lg,
  },
  coachGroupLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  coachAthleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  coachAthleteName: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  outButton: {
    backgroundColor: theme.colors.red,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
  },
  outButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eliminatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    opacity: 0.5,
  },
  eliminatedX: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.red,
    width: 20,
    textAlign: 'center',
  },
  eliminatedName: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  eliminatedLevel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },

  // ── Bottom Controls ─────────────────────────────────────────────────────
  bottomControls: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  controlButtonDanger: {
    borderColor: 'rgba(255,69,58,0.3)',
  },
  controlButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
