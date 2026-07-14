import type { TestType } from '@/constants/fitness-test-data';

export interface GuidedInstructions {
  needs: string[];
  setup: string[];
  howTo: string[];
  commonMistakes: string[];
  attemptsRecommended: number;
}

const SPRINT_COMMON_MISTAKES = [
  'Decelerating before the finish line. Run THROUGH the line, not to it.',
  'False starts. Stay still until you decide to go, then commit fully.',
  'Standing tall at the start. Stay low for the first few steps to drive forward.',
];

const SPRINT_SETUP = (distance: number) => [
  `Place one cone at the start line and one at ${distance} metres.`,
  'Warm up: 5 minutes of jogging plus dynamic stretches (leg swings, high knees, A-skips).',
  'Pick a flat, grippy surface — grass or track works. Avoid loose dirt or wet concrete.',
  `Position someone with a stopwatch at the ${distance}m line, or set up your phone timer.`,
];

const SPRINT_HOW_TO = (distance: number) => [
  'Stationary start. Two-point or three-point stance — no rolling or flying starts.',
  'Drive low for the first 3–5 metres, then rise gradually to full upright sprint posture.',
  `Sprint flat out the full ${distance}m. Eyes forward, arms driving.`,
  'Cross the line at full speed. Slow down AFTER you finish, not before.',
];

const sprintInstructions = (distance: number): GuidedInstructions => ({
  needs: [
    '2 cones or markers',
    'Stopwatch (phone timer works fine)',
    `A flat ${distance}m of grass or track`,
    'Athletic shoes with grip',
  ],
  setup: SPRINT_SETUP(distance),
  howTo: SPRINT_HOW_TO(distance),
  commonMistakes: SPRINT_COMMON_MISTAKES,
  attemptsRecommended: 3,
});

export const GUIDED_INSTRUCTIONS: Partial<Record<TestType, GuidedInstructions>> = {
  sprint_10m: sprintInstructions(10),
  sprint_20m: sprintInstructions(20),
  sprint_30m: sprintInstructions(30),
  sprint_40m: sprintInstructions(40),

  agility_ttest: {
    needs: [
      '4 cones',
      'Stopwatch (phone timer works)',
      'A flat 10m × 10m area',
      'Athletic shoes with grip',
    ],
    setup: [
      'Place cone A at the start.',
      'Place cone B 10 metres straight ahead of A.',
      'Place cone C 5 metres to the left of B.',
      'Place cone D 5 metres to the right of B (so C and D are 10m apart, with B in the middle).',
      'Warm up: 5 minutes of jogging plus dynamic stretches and a few practice shuffles.',
    ],
    howTo: [
      'Start at cone A. On "go", sprint forward to cone B and touch its base.',
      'Side-shuffle LEFT to cone C and touch its base. Stay facing forward — do NOT cross your feet.',
      'Side-shuffle RIGHT past B all the way to cone D. Touch its base.',
      'Side-shuffle LEFT back to cone B. Touch.',
      'Backpedal from B to A. Stop your timer when you cross the A line.',
    ],
    commonMistakes: [
      'Crossing your feet on the shuffle. Use a true side-step, hips square.',
      'Turning around to run — you must face forward the whole shuffle leg.',
      'Skipping a cone touch. Touch the base of every cone or the rep does not count.',
    ],
    attemptsRecommended: 2,
  },

  vertical_jump: {
    needs: [
      'A wall taller than your standing reach + a clear half-metre above',
      'Chalk on your fingertips OR a sticky note marker',
      'Help from a friend if possible (easier to mark)',
      'Flat floor — no rugs, no soft mats',
    ],
    setup: [
      'Stand sideways next to the wall, feet flat on the floor.',
      'Reach your closer arm straight up the wall — fingers fully extended.',
      'Mark the highest point your fingertips touch with chalk. This is your STANDING REACH.',
      'Re-chalk your fingertips before each jump attempt.',
    ],
    howTo: [
      'Stand a few centimetres from the wall, feet shoulder-width apart.',
      'Quick countermovement: dip into a half-squat, then explode upward immediately. No pause at the bottom — the spring matters.',
      'Use your arms — swing them down on the dip, up hard on the jump.',
      'At the peak of the jump, swipe the wall with your closer hand to leave a chalk mark.',
      'Measure from your standing reach mark to your jump mark in centimetres. That is your vertical jump.',
    ],
    commonMistakes: [
      'Pausing at the bottom of the dip — kills the stretch reflex and costs you cm.',
      'Not using your arms. The arm swing adds 10–15% on most jumps.',
      'Jumping forward instead of straight up. Stay close to the wall and go vertical.',
    ],
    attemptsRecommended: 3,
  },
};
