import { useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

let Accelerometer: any = null;
if (Platform.OS !== 'web') {
  Accelerometer = require('expo-sensors').Accelerometer;
}

interface SensorReading {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

interface TurnEvent {
  timestamp: number;
  index: number;
}

interface FreefallEvent {
  startTimestamp: number;
  endTimestamp: number;
  durationMs: number;
}

export interface SensorSession {
  readings: SensorReading[];
  turns: TurnEvent[];
  freefalls: FreefallEvent[];
  startTime: number;
  endTime: number;
}

const TURN_DECEL_THRESHOLD = 14.0;
const TURN_DEBOUNCE_MS = 1500;
const FREEFALL_THRESHOLD = 2.0;
const FREEFALL_MIN_MS = 100;
const SAMPLING_INTERVAL_MS = 20;

export function useSensorRecording() {
  const subscription = useRef<any>(null);
  const session = useRef<SensorSession>({
    readings: [],
    turns: [],
    freefalls: [],
    startTime: 0,
    endTime: 0,
  });
  const lastTurnTime = useRef(0);
  const inFreefall = useRef(false);
  const freefallStart = useRef(0);

  const processReading = useCallback((data: { x: number; y: number; z: number }) => {
    const now = Date.now();
    const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2) * 9.81;

    session.current.readings.push({
      timestamp: now,
      x: data.x * 9.81,
      y: data.y * 9.81,
      z: data.z * 9.81,
      magnitude,
    });

    if (magnitude > TURN_DECEL_THRESHOLD && now - lastTurnTime.current > TURN_DEBOUNCE_MS) {
      lastTurnTime.current = now;
      session.current.turns.push({ timestamp: now, index: session.current.turns.length });
    }

    if (magnitude < FREEFALL_THRESHOLD) {
      if (!inFreefall.current) {
        inFreefall.current = true;
        freefallStart.current = now;
      }
    } else if (inFreefall.current) {
      const duration = now - freefallStart.current;
      if (duration >= FREEFALL_MIN_MS) {
        session.current.freefalls.push({
          startTimestamp: freefallStart.current,
          endTimestamp: now,
          durationMs: duration,
        });
      }
      inFreefall.current = false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    session.current = { readings: [], turns: [], freefalls: [], startTime: Date.now(), endTime: 0 };
    lastTurnTime.current = 0;
    inFreefall.current = false;
    if (Accelerometer) {
      Accelerometer.setUpdateInterval(SAMPLING_INTERVAL_MS);
      subscription.current = Accelerometer.addListener(processReading);
    }
  }, [processReading]);

  const stopRecording = useCallback((): SensorSession => {
    subscription.current?.remove();
    subscription.current = null;
    session.current.endTime = Date.now();
    return { ...session.current };
  }, []);

  // Safety net: if the component unmounts mid-test (e.g. the athlete backs out
  // of the Yo-Yo screen with the Android back gesture) without calling
  // stopRecording, the accelerometer would otherwise keep sampling at 50 Hz
  // forever — draining the battery and growing session.readings unbounded.
  useEffect(() => {
    return () => {
      subscription.current?.remove();
      subscription.current = null;
    };
  }, []);

  const getTurnCount = useCallback(() => session.current.turns.length, []);

  const getLastFreefall = useCallback((): FreefallEvent | null => {
    const ff = session.current.freefalls;
    return ff.length > 0 ? ff[ff.length - 1] : null;
  }, []);

  const calculateJumpHeight = useCallback((freefallMs: number): number => {
    const t = freefallMs / 1000;
    return ((9.81 * t * t) / 8) * 100;
  }, []);

  const validateMovementPattern = useCallback(
    (
      readings: SensorReading[],
    ): {
      isLikelyRunning: boolean;
      dominantFrequencyHz: number;
      confidence: number;
    } => {
      if (readings.length < 100)
        return { isLikelyRunning: false, dominantFrequencyHz: 0, confidence: 0 };
      const magnitudes = readings.map((r) => r.magnitude);
      const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      let crossings = 0;
      for (let i = 1; i < magnitudes.length; i++) {
        if (magnitudes[i] > mean !== magnitudes[i - 1] > mean) crossings++;
      }
      const durationSec = (readings[readings.length - 1].timestamp - readings[0].timestamp) / 1000;
      const frequencyHz = crossings / (2 * durationSec);
      const isLikelyRunning = frequencyHz >= 1.5 && frequencyHz <= 5.0;
      return {
        isLikelyRunning,
        dominantFrequencyHz: frequencyHz,
        confidence: isLikelyRunning ? Math.min(1, durationSec / 30) : 0.2,
      };
    },
    [],
  );

  const getSensorSummary = useCallback((): Record<string, any> => {
    const s = session.current;
    const validation = validateMovementPattern(s.readings);
    return {
      duration_ms: s.endTime - s.startTime,
      total_readings: s.readings.length,
      sampling_rate_hz:
        s.endTime > s.startTime ? s.readings.length / ((s.endTime - s.startTime) / 1000) : 0,
      turns_detected: s.turns.length,
      freefalls_detected: s.freefalls.length,
      movement_validation: validation,
      turn_timestamps: s.turns.map((t) => t.timestamp - s.startTime),
    };
  }, [validateMovementPattern]);

  return {
    startRecording,
    stopRecording,
    getTurnCount,
    getLastFreefall,
    calculateJumpHeight,
    validateMovementPattern,
    getSensorSummary,
  };
}
