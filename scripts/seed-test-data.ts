/**
 * OnlyKrida Comprehensive Test Data Seed Script
 *
 * Creates realistic Indian sports data:
 *   50 Athletes, 10 Scouts, 5 Coaches, 5 Teams/Academies
 *   100 Posts, 20 Opportunities, social connections, fitness tests, messages, groups
 *
 * Run:   npx tsx scripts/seed-test-data.ts
 * Clean: npx tsx scripts/seed-test-data.ts --cleanup
 *
 * Requires env vars (reads from .env automatically):
 *   EXPO_PUBLIC_SUPABASE_URL  or  SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load .env file manually (no dotenv dependency needed)
try {
  const envPath = resolve(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
} catch {
  // .env file not found, rely on exported env vars
}
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// ENV
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SEED_TAG = 'onlykrida-seed-v2';

// Hardcoded demo emails from scripts/nuke-and-seed.ts. These accounts don't
// carry user_metadata.seed_tag, so cleanup matches them by exact email.
const NUKE_SEED_EMAILS = new Set<string>([
  'demo@onlykrida.com',
  'arjun@onlykrida.com',
  'priya@onlykrida.com',
  'fatima@onlykrida.com',
  'rahul@onlykrida.com',
  'sneha@onlykrida.com',
  'omar@onlykrida.com',
  'ananya@onlykrida.com',
  'vikram@onlykrida.com',
  'aisha@onlykrida.com',
  'dev@onlykrida.com',
  'scout.ravi@onlykrida.com',
  'scout.james@onlykrida.com',
  'scout.meera@onlykrida.com',
  'coach.kabir@onlykrida.com',
  'coach.sarah@onlykrida.com',
  'team.thunderbolts@onlykrida.com',
  'team.falcons@onlykrida.com',
  'trainer.raj@onlykrida.com',
]);

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function futureDate(minDays: number, maxDays: number): string {
  const d = new Date(Date.now() + randomInt(minDays, maxDays) * 86_400_000);
  return d.toISOString();
}
function pastDate(minDays: number, maxDays: number): string {
  const d = new Date(Date.now() - randomInt(minDays, maxDays) * 86_400_000);
  return d.toISOString();
}
function dob(ageYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - ageYears);
  d.setMonth(randomInt(0, 11));
  d.setDate(randomInt(1, 28));
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// VERIFICATION TIERS (post 2026-04-01 schema migration)
// ---------------------------------------------------------------------------

type VerificationTier = 'self_reported' | 'app_measured' | 'coach_verified' | 'center_tested';

function weightedTier(): VerificationTier {
  const r = Math.random();
  if (r < 0.4) return 'self_reported';
  if (r < 0.65) return 'app_measured';
  if (r < 0.9) return 'coach_verified';
  return 'center_tested';
}

function sensorSampleFor(testType: string): Record<string, any> {
  if (testType === 'yoyo') {
    return {
      accelerometer_samples: randomInt(800, 1600),
      peak_g: randomFloat(2.4, 4.2, 2),
      turn_count: randomInt(40, 120),
      sample_rate_hz: 50,
    };
  }
  if (testType === 'sprint_20m' || testType === 'sprint_40m') {
    return {
      accelerometer_samples: randomInt(80, 200),
      peak_g: randomFloat(2.8, 4.8, 2),
      sample_rate_hz: 50,
    };
  }
  return { accelerometer_samples: 200, sample_rate_hz: 50 };
}

function verificationFields(
  tier: VerificationTier,
  testType: string,
  coachId: string | null,
): Record<string, any> {
  const fields: Record<string, any> = { verification_tier: tier };
  if (tier === 'coach_verified' && coachId) {
    fields.verified_by = coachId;
    fields.verified_at = pastDate(0, 7);
    fields.verification_notes = pick([
      'Verified during team practice. Form was solid.',
      'Conducted alongside the squad — time confirmed.',
      'Present for the test. Result is accurate.',
      'Matches what I see in training.',
    ]);
  }
  if (tier === 'center_tested') {
    fields.verified_at = pastDate(0, 30);
    fields.verification_notes = 'Tested at certified Khelo India sub-junior camp.';
  }
  if (tier === 'app_measured') {
    fields.sensor_data = sensorSampleFor(testType);
  }
  if (tier === 'self_reported' || tier === 'app_measured') {
    fields.attestation_count = Math.random() < 0.3 ? randomInt(1, 4) : 0;
  }
  return fields;
}

// ---------------------------------------------------------------------------
// INDIAN NAMES
// ---------------------------------------------------------------------------

const MALE_FIRST = [
  'Aarav',
  'Arjun',
  'Vihaan',
  'Aditya',
  'Sai',
  'Rohan',
  'Karthik',
  'Dev',
  'Ishaan',
  'Pranav',
  'Rahul',
  'Sunil',
  'Vikram',
  'Akash',
  'Nikhil',
  'Mohit',
  'Harsh',
  'Ravi',
  'Ankit',
  'Deepak',
  'Kunal',
  'Sachin',
  'Gaurav',
  'Manish',
  'Varun',
  'Siddharth',
  'Yash',
  'Rishabh',
  'Shubham',
  'Abhishek',
] as const;

const FEMALE_FIRST = [
  'Ananya',
  'Diya',
  'Priya',
  'Sneha',
  'Kavya',
  'Isha',
  'Meera',
  'Neha',
  'Pooja',
  'Shreya',
  'Aisha',
  'Ritika',
  'Simran',
  'Tanvi',
  'Zara',
  'Nisha',
  'Bhavna',
  'Divya',
  'Kriti',
  'Sanya',
  'Tara',
  'Pallavi',
  'Jyoti',
  'Riya',
  'Aditi',
  'Swati',
  'Komal',
  'Megha',
  'Anjali',
  'Sakshi',
] as const;

const LAST_NAMES = [
  'Sharma',
  'Patel',
  'Reddy',
  'Kumar',
  'Singh',
  'Nair',
  'Rao',
  'Verma',
  'Iyer',
  'Joshi',
  'Das',
  'Choudhury',
  'Pillai',
  'Mishra',
  'Gupta',
  'Bhat',
  'Naidu',
  'Menon',
  'Deshpande',
  'Chakraborty',
  'Hegde',
  'Kaur',
  'Shetty',
  'Thakur',
  'Banerjee',
  'Kulkarni',
  'Patil',
  'Deshmukh',
  'Tiwari',
  'Saxena',
] as const;

const CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
] as const;

// ---------------------------------------------------------------------------
// SPORTS CONFIG
// ---------------------------------------------------------------------------

type SportName =
  | 'Football'
  | 'Cricket'
  | 'Kabaddi'
  | 'Basketball'
  | 'Athletics'
  | 'Badminton'
  | 'Hockey';

interface SportConfig {
  positions: string[];
  achievements: string[];
  postCaptions: string[];
  videoDescriptions: string[];
}

const SPORTS: Record<SportName, SportConfig> = {
  Football: {
    positions: [
      'Goalkeeper',
      'Centre-Back',
      'Right-Back',
      'Left-Back',
      'Defensive Midfielder',
      'Central Midfielder',
      'Attacking Midfielder',
      'Right Winger',
      'Left Winger',
      'Striker',
    ],
    achievements: [
      'Subroto Cup U-17 Winner',
      'Santosh Trophy Semifinalist',
      'ISL Youth League Top Scorer',
      'SAFF U-19 Championship Bronze',
      'State League Best Player',
      'Durand Cup Quarterfinalist',
      'I-League 2nd Division Winner',
      'National School Games Gold',
    ],
    postCaptions: [
      "Match day at the Kanteerava! Let's go",
      'Free kick practice session today',
      'Proud to represent my state in the Santosh Trophy',
      'First hat-trick of the season',
      'Recovery day. Ice baths and stretching',
      'Training with the ISL reserve team',
      'New boots, new season. Ready to go',
      'Derby day energy. Full stadium vibes.',
    ],
    videoDescriptions: [
      'Highlights vs Kerala Blasters youth',
      'Free kick compilation 2026',
      'Dribbling drills at Tata Football Academy',
      'Match-winning goal vs Goa',
    ],
  },
  Cricket: {
    positions: [
      'Opening Batsman',
      'Middle-Order Batsman',
      'Wicketkeeper-Batsman',
      'All-Rounder',
      'Fast Bowler',
      'Spin Bowler',
      'Medium Pacer',
    ],
    achievements: [
      'Ranji Trophy Debut',
      'BCCI U-19 Squad Selection',
      'Vijay Hazare Trophy Century',
      'Syed Mushtaq Ali T20 Best Bowler',
      'State U-16 Captain',
      'CK Nayudu Trophy Winner',
      'IPL Nets Session with MI',
      'NCA Trainee',
    ],
    postCaptions: [
      'Nets session at the NCA. Working on my cover drive',
      'Century in the state league!',
      'First five-wicket haul of the season',
      'Training harder than ever this pre-season',
      'Selected for the Ranji squad. Dreams do come true',
      'Gym session. Fast bowlers need to be athletes too',
    ],
    videoDescriptions: [
      'Cover drive compilation',
      'Yorker practice at nets',
      'Match highlights: 85 off 62 balls',
      'Slip catching drills',
    ],
  },
  Kabaddi: {
    positions: [
      'Raider',
      'Left Corner Defender',
      'Right Corner Defender',
      'Cover Defender',
      'All-Rounder',
    ],
    achievements: [
      'Pro Kabaddi League Draft Pick',
      'Senior National Championship Bronze',
      'State Kabaddi Champion',
      'University Kabaddi Gold',
      'Khelo India Games Silver',
      'PKL Young Player of the Season Nominee',
    ],
    postCaptions: [
      'Raid practice at the SAI centre',
      'Super raid! Three points in one move',
      'Defence wins championships. Working on my ankle holds',
      'Selected for state camp',
      'PKL dreams. Every raid counts',
    ],
    videoDescriptions: [
      'Super raid vs Tamil Thalaivas youth',
      'Ankle hold masterclass',
      'Best raids compilation 2026',
      'Kabaddi camp training footage',
    ],
  },
  Basketball: {
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Centre'],
    achievements: [
      'FIBA Asia U-18 Squad',
      'UBA Pro League MVP',
      'State Championship Winner',
      'NBA Academy India Graduate',
      'Senior National Camp Invite',
      '3x3 National Champion',
    ],
    postCaptions: [
      'Crossover game getting tighter',
      'Three-pointer practice. Shooting 200 a day',
      'UBA game night. Court was electric',
      'First dunk in a competitive game!',
      'Defensive drills at NBA Academy India',
    ],
    videoDescriptions: [
      'Crossover and finish at the rim',
      'Three-point shooting drill',
      'UBA highlights vs Punjab',
      'NBA Academy workout footage',
    ],
  },
  Athletics: {
    positions: [
      '100m Sprinter',
      '200m Sprinter',
      '400m Runner',
      '800m Runner',
      '1500m Runner',
      'Long Jumper',
      'High Jumper',
      'Shot Putter',
      'Javelin Thrower',
    ],
    achievements: [
      'National Inter-State Championship Finalist',
      'Khelo India Youth Games Gold',
      'Asian Junior Athletics Bronze',
      'Federation Cup Winner',
      'AFI National Camp Selection',
      'Junior National Record Holder',
      'State Championship Gold',
    ],
    postCaptions: [
      'PB in the 100m today! 10.68s',
      'Track session at the JN Stadium',
      'Plyometrics and sprint drills today',
      'Representing India at the Asian Juniors. Proud moment',
      'Strength training for explosive starts',
      'Altitude training camp in Ooty',
    ],
    videoDescriptions: [
      '100m final at National Inter-State',
      'Long jump PB attempt',
      'Sprint start technique analysis',
      'Javelin throw training',
    ],
  },
  Badminton: {
    positions: ['Singles Player', 'Doubles Specialist', 'Mixed Doubles Player'],
    achievements: [
      'BWF Junior International Quarterfinalist',
      'Senior National Championship Semifinalist',
      'All India Junior Ranking Tournament Winner',
      'Gopichand Academy Graduate',
      'Thomas Cup Junior Squad',
      'State Championship Gold',
    ],
    postCaptions: [
      'Smash practice at the Gopichand Academy',
      'Won the state junior title!',
      'Footwork drills. Speed is everything in badminton',
      'Cross-court drops for days',
      'Recovery session after a tough tournament week',
    ],
    videoDescriptions: [
      'Smash compilation from nationals',
      'Rally highlights vs top seed',
      'Deception shots practice',
      'Jump smash slow-motion analysis',
    ],
  },
  Hockey: {
    positions: [
      'Goalkeeper',
      'Full-Back',
      'Half-Back',
      'Inside Forward',
      'Centre Forward',
      'Winger',
    ],
    achievements: [
      'Hockey India Junior National Camp',
      'Nehru Cup Winner',
      'State Hockey Academy Graduate',
      'Sub-Junior National Championship Gold',
      'Khelo India Hockey Gold',
      'SAI Centre Trainee',
      'National School Games Champion',
    ],
    postCaptions: [
      'Drag-flick practice at the SAI centre',
      'Penalty corner routine looking sharp',
      'Proud to wear the state jersey',
      'Astro-turf sessions hitting different',
      "Hockey India camp starts Monday. Let's go",
      'Reverse hit goals are the best goals',
    ],
    videoDescriptions: [
      'Drag-flick goals compilation',
      'Penalty corner conversion',
      'Match highlights vs Punjab',
      'Dribbling through traffic',
    ],
  },
};

const SPORT_ATHLETE_COUNTS: Record<SportName, number> = {
  Football: 15,
  Cricket: 10,
  Kabaddi: 5,
  Basketball: 5,
  Athletics: 5,
  Badminton: 5,
  Hockey: 5,
};

// ---------------------------------------------------------------------------
// BIO TEMPLATES
// ---------------------------------------------------------------------------

function athleteBio(sport: SportName, position: string, city: string, age: number): string {
  const templates = [
    `${position} based in ${city}. Training daily to make it to the top.`,
    `${position} | ${city}. ${sport} is life. Looking for academy and trial opportunities.`,
    `Aspiring professional ${sport.toLowerCase()} player. ${position} at ${city} Sports Academy.`,
    `${age}-year-old ${position.toLowerCase()} from ${city}. State level. DM for trials.`,
    `${position} at ${city} ${sport} Club. ISL/IPL/PKL aspirant. Hard work beats talent.`,
    `${sport} | ${position} | ${city}. Representing the city in nationals this year.`,
    `Youth ${sport.toLowerCase()} player. Currently training at SAI Centre, ${city}.`,
    `${position} from ${city}. Dreams of wearing the national jersey someday.`,
  ];
  return pick(templates);
}

function scoutBio(org: string, sports: string[], city: string): string {
  const sportStr = sports.join(', ');
  const templates = [
    `Talent scout at ${org}. Scouting ${sportStr} across India.`,
    `${org} | Talent identification & recruitment. Based in ${city}.`,
    `Looking for the next generation of Indian ${sportStr.toLowerCase()} stars. ${org}.`,
    `Head of youth scouting at ${org}. DM me your highlights.`,
  ];
  return pick(templates);
}

function coachBio(sport: string, years: number, city: string): string {
  const templates = [
    `${sport} coach with ${years}+ years of experience. Based in ${city}.`,
    `AFC/NIS certified ${sport.toLowerCase()} coach. Developing grassroots talent in ${city}.`,
    `Head Coach, ${city} ${sport} Academy. ${years} years shaping young athletes.`,
    `Passionate about youth ${sport.toLowerCase()} development. ${years} years coaching experience.`,
  ];
  return pick(templates);
}

// ---------------------------------------------------------------------------
// SCOUT ORGS, TEAM/ACADEMY DATA, COACH DATA
// ---------------------------------------------------------------------------

const SCOUT_ORGS = [
  { name: 'Bengaluru FC Scouting', city: 'Bengaluru', sports: ['Football'] },
  { name: 'Mumbai City FC Youth', city: 'Mumbai', sports: ['Football'] },
  { name: 'Kerala Blasters Academy', city: 'Chennai', sports: ['Football'] },
  { name: 'BCCI Talent Development', city: 'Mumbai', sports: ['Cricket'] },
  { name: 'Hockey India Development', city: 'Delhi', sports: ['Hockey'] },
  { name: 'Pro Kabaddi Scouting Cell', city: 'Pune', sports: ['Kabaddi'] },
  { name: 'BAI National Scouting', city: 'Hyderabad', sports: ['Badminton'] },
  {
    name: 'Reliance Foundation Sports',
    city: 'Mumbai',
    sports: ['Football', 'Basketball', 'Athletics'],
  },
  { name: 'JSW Sports Talent ID', city: 'Bengaluru', sports: ['Football', 'Athletics'] },
  { name: 'SAI Regional Centre', city: 'Delhi', sports: ['Athletics', 'Hockey', 'Basketball'] },
] as const;

const TEAMS_ACADEMIES = [
  {
    name: 'Tata Football Academy',
    sport: 'Football',
    city: 'Jaipur',
    league: 'TFA Youth League',
    founded: '1987',
  },
  {
    name: 'JSW Bengaluru FC Academy',
    sport: 'Football',
    city: 'Bengaluru',
    league: 'ISL Youth',
    founded: '2013',
  },
  {
    name: 'Gopichand Badminton Academy',
    sport: 'Badminton',
    city: 'Hyderabad',
    league: 'PBL',
    founded: '2008',
  },
  {
    name: 'KIIT Hockey Academy',
    sport: 'Hockey',
    city: 'Kolkata',
    league: 'Hockey India League',
    founded: '2015',
  },
  {
    name: 'NBA Academy India',
    sport: 'Basketball',
    city: 'Delhi',
    league: 'UBA Pro',
    founded: '2017',
  },
] as const;

const COACH_DATA = [
  { sport: 'Football' as SportName, years: 15, cert: 'AFC A License' },
  { sport: 'Cricket' as SportName, years: 20, cert: 'NIS Certified' },
  { sport: 'Kabaddi' as SportName, years: 12, cert: 'SAI Level 3' },
  { sport: 'Basketball' as SportName, years: 10, cert: 'FIBA Licensed' },
  { sport: 'Athletics' as SportName, years: 18, cert: 'AFI Level 2' },
] as const;

// ---------------------------------------------------------------------------
// OPPORTUNITY TEMPLATES (20)
// ---------------------------------------------------------------------------

const OPPORTUNITY_TEMPLATES = [
  // Tryouts (5)
  {
    title: 'ISL Youth Team Open Trials 2026-27',
    category: 'tryouts' as const,
    sport: 'Football',
    desc: 'Open trials for the ISL youth development squad. Players aged 16-21 with state-level experience preferred. Bring your own boots and kit. Two-day trial process with fitness tests on Day 1 and match simulations on Day 2.',
    ageRange: '16-21',
    skillLevel: 'State Level+',
    paid: false,
  },
  {
    title: 'Ranji Trophy Probables Selection Camp',
    category: 'tryouts' as const,
    sport: 'Cricket',
    desc: 'State cricket association selection camp for Ranji Trophy probables. Open to players with district-level representation. Batting, bowling, and fielding assessments over three days.',
    ageRange: '18-28',
    skillLevel: 'District Level+',
    paid: false,
  },
  {
    title: 'Pro Kabaddi Season 11 Open Trials',
    category: 'tryouts' as const,
    sport: 'Kabaddi',
    desc: 'Open trials for PKL Season 11 team roster. Raiders and defenders welcome. Must have played at state level or above.',
    ageRange: '18-30',
    skillLevel: 'State Level+',
    paid: false,
  },
  {
    title: 'UBA Pro Basketball League Tryouts',
    category: 'tryouts' as const,
    sport: 'Basketball',
    desc: 'Open trials for UBA Pro League team. Looking for guards and forwards. Fitness test plus scrimmage format.',
    ageRange: '18-25',
    skillLevel: 'University Level+',
    paid: false,
  },
  {
    title: 'Hockey India Sub-Junior Selection',
    category: 'tryouts' as const,
    sport: 'Hockey',
    desc: 'Sub-junior national team selection trials. Open to all players under 16 with state academy training.',
    ageRange: '14-16',
    skillLevel: 'State Academy',
    paid: false,
  },
  // Tournaments (5)
  {
    title: 'Subroto Cup International Football Tournament',
    category: 'tournaments' as const,
    sport: 'Football',
    desc: "Asia's largest inter-school football tournament. Register your school or academy team. U-17 and U-19 categories.",
    ageRange: 'U-17, U-19',
    skillLevel: 'Open',
    paid: true,
  },
  {
    title: 'State-Level T20 Cricket Championship',
    category: 'tournaments' as const,
    sport: 'Cricket',
    desc: 'Annual state T20 championship. Team registration open. Top 4 teams qualify for zonal round.',
    ageRange: '16-28',
    skillLevel: 'District Level+',
    paid: true,
  },
  {
    title: 'National Junior Athletics Meet',
    category: 'tournaments' as const,
    sport: 'Athletics',
    desc: 'AFI sanctioned national junior athletics meet. Track and field events. Qualification standards apply.',
    ageRange: '16-20',
    skillLevel: 'State Level+',
    paid: true,
  },
  {
    title: 'All India Inter-University Badminton',
    category: 'tournaments' as const,
    sport: 'Badminton',
    desc: 'University-level badminton championship. Singles and doubles categories. Must be enrolled in a recognized university.',
    ageRange: '18-25',
    skillLevel: 'University Level',
    paid: false,
  },
  {
    title: 'Khelo India Youth Games District Qualifiers',
    category: 'tournaments' as const,
    sport: 'Basketball',
    desc: 'District-level qualifiers for Khelo India Youth Games. Top 2 teams advance to state round.',
    ageRange: '14-18',
    skillLevel: 'Open',
    paid: false,
  },
  // Scholarships (4)
  {
    title: 'Tata Sports Excellence Scholarship',
    category: 'scholarships' as const,
    sport: 'Football',
    desc: 'Full scholarship covering training, accommodation, and education at Tata Football Academy for promising footballers. Includes monthly stipend of Rs 15,000.',
    ageRange: '14-18',
    skillLevel: 'State Level+',
    paid: false,
  },
  {
    title: 'JSW Inspire Scholarship for Women Athletes',
    category: 'scholarships' as const,
    sport: 'Athletics',
    desc: 'Annual scholarship for outstanding women athletes across track and field disciplines. Covers coaching, nutrition, and competition travel for one year. Worth Rs 5,00,000.',
    ageRange: '16-22',
    skillLevel: 'National Level',
    paid: false,
  },
  {
    title: 'BCCI Junior Cricketer Development Grant',
    category: 'scholarships' as const,
    sport: 'Cricket',
    desc: 'Development grant for promising junior cricketers identified by state associations. Covers coaching fees and equipment for 12 months.',
    ageRange: '14-19',
    skillLevel: 'State Level+',
    paid: false,
  },
  {
    title: 'SAI Khelo India Scholarship',
    category: 'scholarships' as const,
    sport: 'Hockey',
    desc: 'Government scholarship under Khelo India scheme for hockey players showing national-level potential. Rs 6,28,000 per annum.',
    ageRange: '14-21',
    skillLevel: 'State Level+',
    paid: false,
  },
  // Sponsorships (4)
  {
    title: 'Puma Rising Stars Sponsorship Program',
    category: 'sponsorships' as const,
    sport: 'Football',
    desc: "Puma India's annual sponsorship program for emerging footballers. Selected athletes receive full kit sponsorship, social media features, and access to Puma training camps.",
    ageRange: '16-23',
    skillLevel: 'ISL Youth/State Level+',
    paid: true,
  },
  {
    title: 'MRF Cricket Equipment Sponsorship',
    category: 'sponsorships' as const,
    sport: 'Cricket',
    desc: 'MRF Pace Foundation and bat sponsorship for fast bowlers and batsmen showing exceptional promise at state level and above.',
    ageRange: '16-25',
    skillLevel: 'State Level+',
    paid: true,
  },
  {
    title: 'Yonex Badminton Sponsorship 2026',
    category: 'sponsorships' as const,
    sport: 'Badminton',
    desc: 'Equipment and apparel sponsorship for top junior badminton players. Selection based on national ranking and tournament performance.',
    ageRange: '14-22',
    skillLevel: 'National Ranking',
    paid: true,
  },
  {
    title: 'Nivia Sports Ambassador Program',
    category: 'sponsorships' as const,
    sport: 'Kabaddi',
    desc: 'Nivia Sports looking for kabaddi athletes to be brand ambassadors on social media. Content creation plus equipment deal.',
    ageRange: '18-28',
    skillLevel: 'PKL/State Level',
    paid: true,
  },
  // Contracts (2)
  {
    title: 'ISL Reserve Team Contract Opportunity',
    category: 'contracts' as const,
    sport: 'Football',
    desc: 'ISL club looking to sign reserve team players on developmental contracts. Six-month contract with option to extend. Monthly salary plus accommodation.',
    ageRange: '18-23',
    skillLevel: 'ISL Youth/I-League',
    paid: true,
  },
  {
    title: 'State Cricket Association Annual Contract',
    category: 'contracts' as const,
    sport: 'Cricket',
    desc: 'Annual retainer contract for state cricket association. Grade C contract worth Rs 3,00,000 per year. Must have Ranji Trophy experience.',
    ageRange: '20-32',
    skillLevel: 'Ranji Trophy',
    paid: true,
  },
];

// ---------------------------------------------------------------------------
// POST CAPTION POOLS
// ---------------------------------------------------------------------------

const GENERIC_CAPTIONS = [
  'Gym session done. Strength is the foundation of everything.',
  'Recovery day. Sleep, nutrition, hydration. The unsexy stuff that matters most.',
  'Grateful for this journey. Every setback is a setup for a comeback.',
  'Early morning training. While others sleep, we grind.',
  "Proud to announce I've been selected for the state camp!",
  'New personal best today! The hard work is paying off.',
  'Thank you to my coach for believing in me when no one else did.',
  'Looking for training partners in the city. DM me!',
  'Just completed the Yo-Yo test. Zone: Strong. Getting there.',
  "Watching film from last week's game. Always learning.",
  'Nutrition is 80% of the game. Meal prep Sunday.',
  'Injury rehab update: Back on the field next week!',
  'Sharing my training routine. Consistency over intensity.',
  'First day at the new academy. Excited for this chapter.',
  "Mental health matters. Taking a rest day and that's okay.",
];

const ACHIEVEMENT_CAPTIONS = [
  'State championship GOLD! All the sacrifice was worth it.',
  'Selected for nationals! Representing my state with pride.',
  'Best Player of the Tournament. Humbled and motivated.',
  'New state record! Years of work for one moment.',
  'Signed with the academy! Next chapter begins now.',
  'Featured in the newspaper today. Surreal feeling.',
  'Won the district championship for the third year running.',
  'Called up to the senior squad for the first time!',
];

// ---------------------------------------------------------------------------
// IMAGE / VIDEO PLACEHOLDER URLS
// ---------------------------------------------------------------------------

const SPORT_IMAGES: Record<string, string[]> = {
  Football: [
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  ],
  Cricket: [
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
  ],
  Kabaddi: ['https://images.unsplash.com/photo-1593349481020-5b884d931783?w=800'],
  Basketball: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800',
  ],
  Athletics: [
    'https://images.unsplash.com/photo-1461896836934-bd45ba4bfb23?w=800',
    'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=800',
  ],
  Badminton: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800'],
  Hockey: ['https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800'],
};

const VIDEO_URLS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
];

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface CreatedUser {
  id: string;
  email: string;
  name: string;
  role: 'athlete' | 'scout' | 'coach' | 'team' | 'academy';
  sport: SportName;
  position: string;
  city: string;
  gender: 'M' | 'F';
  age: number;
  verified: boolean;
}

// ---------------------------------------------------------------------------
// AUTH USER CREATION HELPER
// ---------------------------------------------------------------------------

async function createAuthUser(
  admin: SupabaseClient,
  email: string,
  fullName: string,
  role: 'athlete' | 'scout' | 'coach' | 'team' | 'academy',
  sport: SportName,
  extra: {
    position: string;
    city: string;
    gender: 'M' | 'F';
    age: number;
    verified: boolean;
  },
): Promise<CreatedUser | null> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: 'OnlyKrida123!',
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      sport,
      position: extra.position,
      seed: true,
      seed_tag: SEED_TAG,
    },
  });

  if (error) {
    console.error(`  WARN createUser ${email}: ${error.message}`);
    return null;
  }

  return {
    id: created.user!.id,
    email,
    name: fullName,
    role,
    sport,
    position: extra.position,
    city: extra.city,
    gender: extra.gender,
    age: extra.age,
    verified: extra.verified,
  };
}

// ---------------------------------------------------------------------------
// SPORT-SPECIFIC STAT GENERATION
// ---------------------------------------------------------------------------

function generateAthleteStats(sport: SportName): Record<string, any> {
  switch (sport) {
    case 'Football':
      return {
        goals: randomInt(0, 25),
        assists: randomInt(0, 15),
        appearances: randomInt(5, 60),
        clean_sheets: randomInt(0, 10),
      };
    case 'Cricket':
      return {
        runs: randomInt(50, 2500),
        wickets: randomInt(0, 80),
        batting_avg: randomFloat(15, 55),
        bowling_avg: randomFloat(18, 45),
      };
    case 'Kabaddi':
      return {
        raid_points: randomInt(10, 300),
        tackle_points: randomInt(5, 150),
        total_points: randomInt(20, 400),
        matches: randomInt(5, 50),
      };
    case 'Basketball':
      return {
        ppg: randomFloat(5, 25),
        rpg: randomFloat(2, 12),
        apg: randomFloat(1, 8),
        spg: randomFloat(0.5, 3),
      };
    case 'Athletics':
      return {
        personal_best: `${randomFloat(10, 15)}s`,
        events: randomInt(3, 15),
        medals: randomInt(0, 8),
      };
    case 'Badminton':
      return {
        wins: randomInt(5, 80),
        losses: randomInt(2, 40),
        national_ranking: randomInt(10, 500),
        titles: randomInt(0, 5),
      };
    case 'Hockey':
      return {
        goals: randomInt(0, 30),
        assists: randomInt(0, 20),
        appearances: randomInt(5, 50),
        penalty_corners: randomInt(0, 15),
      };
    default:
      return {};
  }
}

function cityToState(city: string): string {
  const map: Record<string, string> = {
    Bengaluru: 'Karnataka',
    Mumbai: 'Maharashtra',
    Delhi: 'Delhi',
    Hyderabad: 'Telangana',
    Chennai: 'Tamil Nadu',
    Kolkata: 'West Bengal',
    Pune: 'Maharashtra',
    Jaipur: 'Rajasthan',
    Kochi: 'Kerala',
    Jamshedpur: 'Jharkhand',
    Bhubaneswar: 'Odisha',
  };
  return map[city] || 'India';
}

// ---------------------------------------------------------------------------
// FITNESS TEST HELPERS
// ---------------------------------------------------------------------------

function weightedZone(): string {
  const zones = ['starter', 'building', 'rising', 'strong', 'elite', 'unstoppable'];
  const weights = [0.08, 0.15, 0.25, 0.28, 0.18, 0.06];
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < zones.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return zones[i];
  }
  return 'rising';
}

function zoneToYoyoLevel(zone: string): number {
  switch (zone) {
    case 'starter':
      return randomInt(5, 8);
    case 'building':
      return randomInt(9, 11);
    case 'rising':
      return randomInt(12, 14);
    case 'strong':
      return randomInt(15, 17);
    case 'elite':
      return randomInt(18, 20);
    case 'unstoppable':
      return randomInt(21, 23);
    default:
      return 12;
  }
}

function levelToVO2Max(level: number, shuttle: number): number {
  const base = 36.4 + (level - 5) * 2.8 + shuttle * 0.3;
  return parseFloat(base.toFixed(1));
}

function levelToTotalShuttles(level: number, shuttle: number): number {
  const shuttlesPerLevel = [0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
  let total = 0;
  for (let l = 5; l < level; l++) {
    total += shuttlesPerLevel[l] || 8;
  }
  total += shuttle;
  return total;
}

function zoneToSprintTime(zone: string, distance: number): number {
  if (distance === 20) {
    switch (zone) {
      case 'starter':
        return randomFloat(3.8, 4.2);
      case 'building':
        return randomFloat(3.5, 3.8);
      case 'rising':
        return randomFloat(3.2, 3.5);
      case 'strong':
        return randomFloat(3.0, 3.2);
      case 'elite':
        return randomFloat(2.8, 3.0);
      case 'unstoppable':
        return randomFloat(2.6, 2.8);
      default:
        return 3.3;
    }
  } else {
    switch (zone) {
      case 'starter':
        return randomFloat(6.5, 7.2);
      case 'building':
        return randomFloat(6.0, 6.5);
      case 'rising':
        return randomFloat(5.5, 6.0);
      case 'strong':
        return randomFloat(5.2, 5.5);
      case 'elite':
        return randomFloat(4.9, 5.2);
      case 'unstoppable':
        return randomFloat(4.6, 4.9);
      default:
        return 5.7;
    }
  }
}

// ---------------------------------------------------------------------------
// MAIN SEED FUNCTION
// ---------------------------------------------------------------------------

async function seed() {
  console.log('\n========================================');
  console.log('  OnlyKrida Seed Script v2');
  console.log('========================================\n');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
    console.error('Set them in .env or export them before running this script.');
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ================================================================
  // STEP 1: CREATE AUTH USERS
  // ================================================================

  console.log('[1/10] Creating 50 athletes...');
  const athletes: CreatedUser[] = [];
  for (const [sport, count] of Object.entries(SPORT_ATHLETE_COUNTS)) {
    for (let i = 0; i < count; i++) {
      const gender: 'M' | 'F' = Math.random() > 0.35 ? 'M' : 'F';
      const firstName = gender === 'M' ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
      const lastName = pick(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const city = pick(CITIES);
      const age = randomInt(16, 28);
      const position = pick(SPORTS[sport as SportName].positions);
      const verified = Math.random() > 0.85;

      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(10, 99)}@onlykrida.test`;
      const user = await createAuthUser(admin, email, fullName, 'athlete', sport as SportName, {
        position,
        city,
        gender,
        age,
        verified,
      });
      if (user) athletes.push(user);
    }
  }
  console.log(`  Created ${athletes.length} athletes`);

  console.log('[2/10] Creating 10 scouts...');
  const scouts: CreatedUser[] = [];
  for (let i = 0; i < 10; i++) {
    const org = SCOUT_ORGS[i];
    const gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
    const firstName = gender === 'M' ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const sport = org.sports[0] as SportName;
    const email = `scout.${firstName.toLowerCase()}${randomInt(10, 99)}@onlykrida.test`;
    const user = await createAuthUser(admin, email, fullName, 'scout', sport, {
      position: 'Scout',
      city: org.city,
      gender,
      age: randomInt(30, 55),
      verified: true,
    });
    if (user) scouts.push(user);
  }
  console.log(`  Created ${scouts.length} scouts`);

  console.log('[3/10] Creating 5 coaches...');
  const coaches: CreatedUser[] = [];
  for (let i = 0; i < 5; i++) {
    const cd = COACH_DATA[i];
    const gender: 'M' | 'F' = Math.random() > 0.4 ? 'M' : 'F';
    const firstName = gender === 'M' ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const city = pick(CITIES);
    const email = `coach.${firstName.toLowerCase()}${randomInt(10, 99)}@onlykrida.test`;
    const user = await createAuthUser(admin, email, fullName, 'coach', cd.sport, {
      position: 'Head Coach',
      city,
      gender,
      age: randomInt(35, 55),
      verified: true,
    });
    if (user) coaches.push(user);
  }
  console.log(`  Created ${coaches.length} coaches`);

  console.log('[4/10] Creating 5 teams/academies...');
  const teams: CreatedUser[] = [];
  for (const ta of TEAMS_ACADEMIES) {
    const email = `${ta.name.toLowerCase().replace(/\s+/g, '.')}@onlykrida.test`;
    const user = await createAuthUser(admin, email, ta.name, 'academy', ta.sport as SportName, {
      position: '',
      city: ta.city,
      gender: 'M',
      age: 0,
      verified: true,
    });
    if (user) teams.push(user);
  }
  console.log(`  Created ${teams.length} teams/academies`);

  const allUsers = [...athletes, ...scouts, ...coaches, ...teams];
  if (allUsers.length === 0) {
    console.error('No users created. Check Supabase connection and env vars.');
    process.exit(1);
  }

  // ================================================================
  // STEP 2: UPSERT PROFILES
  // ================================================================

  console.log('[5/10] Upserting profiles...');
  const profileRows = allUsers.map((u) => {
    let bio = '';
    let roleSpecificData: Record<string, any> = {};

    if (u.role === 'athlete') {
      bio = athleteBio(u.sport, u.position, u.city, u.age);
      roleSpecificData = {
        height: `${randomInt(155, 195)} cm`,
        weight: `${randomInt(50, 90)} kg`,
        dateOfBirth: dob(u.age),
        careerGoals: pick([
          'Play professionally in the top league',
          'Represent India at the international level',
          'Earn a sports scholarship abroad',
          'Get signed by a professional academy',
        ]),
      };
    } else if (u.role === 'scout') {
      const org = SCOUT_ORGS.find((o) => o.city === u.city) || SCOUT_ORGS[0];
      bio = scoutBio(org.name, org.sports as unknown as string[], u.city);
      roleSpecificData = {
        organization: org.name,
        scoutingRegions: pickN([...CITIES], 3),
        athleteLevels: pickN(['District', 'State', 'National', 'International'], 2),
        lookingFor: `Looking for talented ${u.sport.toLowerCase()} players aged 16-22`,
      };
    } else if (u.role === 'coach') {
      const cd = COACH_DATA.find((c) => c.sport === u.sport) || COACH_DATA[0];
      bio = coachBio(u.sport, cd.years, u.city);
      roleSpecificData = {
        experience: `${cd.years} years`,
        philosophy: pick([
          'Player development over results at youth level',
          'Discipline, fitness, and tactical awareness',
          'Building complete athletes with strong fundamentals',
          'Data-driven approach to training and match preparation',
        ]),
        teamHistory: pickN(
          ['SAI Centre', 'State Academy', 'District Team', 'ISL Youth', 'University Team'],
          2,
        ),
      };
    } else {
      const ta = TEAMS_ACADEMIES.find((t) => t.name === u.name);
      bio = ta
        ? `Official ${ta.sport} academy based in ${ta.city}. Developing champions since ${ta.founded}.`
        : `Sports academy based in ${u.city}.`;
      roleSpecificData = {
        league: ta?.league || '',
        founded: ta?.founded || '',
        homeVenue: `${u.city} Sports Complex`,
      };
    }

    const achievements =
      u.role === 'athlete' && Math.random() > 0.4
        ? pickN(SPORTS[u.sport].achievements, randomInt(1, 3)).map((title) => ({
            id: randomUUID(),
            title,
            description: title,
            date: pastDate(30, 730).split('T')[0],
          }))
        : [];

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role === 'academy' ? 'academy' : u.role,
      avatar: null,
      bio,
      location: u.city,
      verified: u.verified,
      sport: u.sport,
      position: u.position,
      achievements: JSON.stringify(achievements),
      stats: JSON.stringify(u.role === 'athlete' ? generateAthleteStats(u.sport) : {}),
      role_specific_data: JSON.stringify(roleSpecificData),
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
    };
  });

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(profileRows, { onConflict: 'id' });
  if (profileErr) console.error('  ERROR profiles:', profileErr.message);
  else console.log(`  Upserted ${profileRows.length} profiles`);

  // ================================================================
  // STEP 3: PLAYER STATS + SCOUT PREFERENCES
  // ================================================================

  console.log('[6/10] Creating player stats and scout preferences...');

  const playerStatsRows = athletes.map((a) => ({
    player_id: a.id,
    sport: a.sport,
    position: a.position,
    skill: randomInt(40, 95),
    speed: randomInt(40, 95),
    stamina: randomInt(40, 95),
  }));
  const { error: psErr } = await admin.from('player_stats').insert(playerStatsRows);
  if (psErr) console.error('  ERROR player_stats:', psErr.message);
  else console.log(`  Created ${playerStatsRows.length} player stat rows`);

  const scoutPrefRows = scouts.map((s, i) => {
    return {
      scout_id: s.id,
      sport: s.sport,
      preferred_positions: pickN(SPORTS[s.sport].positions, 3),
      weight_skill: randomFloat(0.2, 0.5),
      weight_speed: randomFloat(0.15, 0.35),
      weight_stamina: randomFloat(0.1, 0.3),
      weight_position_match: randomFloat(0.1, 0.3),
    };
  });
  const { error: spErr } = await admin.from('scout_preferences').insert(scoutPrefRows);
  if (spErr) console.error('  ERROR scout_preferences:', spErr.message);
  else console.log(`  Created ${scoutPrefRows.length} scout preference rows`);

  // ================================================================
  // STEP 4: 100 POSTS
  // ================================================================

  console.log('[7/10] Creating 100 posts...');
  const postRows: any[] = [];
  const postCreators = [...athletes, ...coaches];

  for (let i = 0; i < 100; i++) {
    const creator = pick(postCreators);
    const sportConfig = SPORTS[creator.sport];
    const rand = Math.random();

    let type: string;
    let title: string;
    let description: string;
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    if (rand < 0.35) {
      type = 'highlight';
      title = pick(sportConfig.videoDescriptions);
      description = pick(sportConfig.postCaptions);
      videoUrl = pick(VIDEO_URLS);
      imageUrl = pick(SPORT_IMAGES[creator.sport] || SPORT_IMAGES['Football']);
    } else if (rand < 0.65) {
      type = 'training';
      title = `Training session - ${creator.sport}`;
      description = pick([...sportConfig.postCaptions, ...GENERIC_CAPTIONS]);
      imageUrl = pick(SPORT_IMAGES[creator.sport] || SPORT_IMAGES['Football']);
    } else if (rand < 0.85) {
      type = 'achievement';
      title = pick(ACHIEVEMENT_CAPTIONS).slice(0, 60);
      description = pick(ACHIEVEMENT_CAPTIONS);
    } else {
      type = 'match';
      title = `Match day - ${creator.sport}`;
      description = pick(sportConfig.postCaptions);
      imageUrl = pick(SPORT_IMAGES[creator.sport] || SPORT_IMAGES['Football']);
    }

    postRows.push({
      user_id: creator.id,
      title,
      description,
      type,
      image_url: imageUrl,
      video_url: videoUrl,
      likes_count: randomInt(0, 120),
      comments_count: randomInt(0, 25),
      views_count: randomInt(5, 500),
      shares_count: randomInt(0, 15),
      created_at: pastDate(1, 90),
    });
  }

  const { error: postErr } = await admin.from('posts').insert(postRows);
  if (postErr) console.error('  ERROR posts:', postErr.message);
  else console.log(`  Created ${postRows.length} posts`);

  // Fetch post IDs for likes/comments
  const { data: insertedPosts } = await admin
    .from('posts')
    .select('id, user_id')
    .in(
      'user_id',
      postCreators.map((u) => u.id),
    )
    .order('created_at', { ascending: false })
    .limit(100);
  const postIds = (insertedPosts || []).map((p: any) => p.id);

  // ================================================================
  // STEP 5: 20 OPPORTUNITIES
  // ================================================================

  console.log('[8/10] Creating 20 opportunities...');
  const oppRows = OPPORTUNITY_TEMPLATES.map((tmpl) => {
    const poster = pick([...scouts, ...teams, ...coaches]);
    return {
      team_id: poster.id,
      title: tmpl.title,
      description: tmpl.desc,
      category: tmpl.category,
      type: JSON.stringify(tmpl.paid ? ['paid'] : ['unpaid']),
      sport: tmpl.sport,
      location: pick(CITIES),
      deadline: futureDate(15, 90),
      requirements: tmpl.skillLevel,
      age_range: tmpl.ageRange,
      skill_level: tmpl.skillLevel,
      compensation: tmpl.paid
        ? pick(['Equipment sponsorship', 'Monthly stipend', 'Full scholarship', 'Contract salary'])
        : null,
      duration: pick(['2 days', '1 week', '3 months', '6 months', '1 year']),
      contact_info: `${poster.name} - OnlyKrida DM`,
      paid: tmpl.paid,
      applications_count: 0,
    };
  });

  const { error: oppErr } = await admin.from('opportunities').insert(oppRows);
  if (oppErr) console.error('  ERROR opportunities:', oppErr.message);
  else console.log(`  Created ${oppRows.length} opportunities`);

  // ================================================================
  // STEP 6: FOLLOWS
  // ================================================================

  console.log('[9/10] Creating social connections...');
  const followRows: { follower_id: string; following_id: string }[] = [];
  const followSet = new Set<string>();

  function addFollow(from: string, to: string) {
    if (from === to) return;
    const key = `${from}:${to}`;
    if (followSet.has(key)) return;
    followSet.add(key);
    followRows.push({ follower_id: from, following_id: to });
  }

  // Scouts follow athletes in their sport
  for (const scout of scouts) {
    const targetAthletes = athletes.filter((a) => a.sport === scout.sport);
    const selected = pickN(targetAthletes, Math.min(targetAthletes.length, randomInt(5, 10)));
    for (const a of selected) {
      addFollow(scout.id, a.id);
    }
  }

  // Coaches follow athletes of their sport
  for (const coach of coaches) {
    const targetAthletes = athletes.filter((a) => a.sport === coach.sport);
    const selected = pickN(targetAthletes, Math.min(targetAthletes.length, randomInt(5, 12)));
    for (const a of selected) {
      addFollow(coach.id, a.id);
      if (Math.random() > 0.4) addFollow(a.id, coach.id);
    }
  }

  // Athletes follow each other (same sport or same city)
  for (const a of athletes) {
    const peers = athletes.filter(
      (b) => b.id !== a.id && (b.sport === a.sport || b.city === a.city),
    );
    const selected = pickN(peers, randomInt(2, 6));
    for (const b of selected) {
      addFollow(a.id, b.id);
    }
    for (const t of teams) {
      if (Math.random() > 0.5) addFollow(a.id, t.id);
    }
  }

  // Insert follows in batches
  const FOLLOW_BATCH = 200;
  for (let i = 0; i < followRows.length; i += FOLLOW_BATCH) {
    const batch = followRows.slice(i, i + FOLLOW_BATCH);
    const { error: fErr } = await admin.from('follows').insert(batch);
    if (fErr && !fErr.message.includes('duplicate')) {
      console.error('  ERROR follows batch:', fErr.message);
    }
  }
  console.log(`  Created ${followRows.length} follow relationships`);

  // ================================================================
  // STEP 7: MESSAGES (scout-athlete conversations)
  // ================================================================

  const messageRows: any[] = [];
  for (const scout of scouts.slice(0, 6)) {
    const targetAthletes = athletes.filter((a) => a.sport === scout.sport).slice(0, 3);
    for (const athlete of targetAthletes) {
      const convoTimestamp = new Date(Date.now() - randomInt(1, 30) * 86_400_000);
      const msgs = [
        {
          sender_id: scout.id,
          receiver_id: athlete.id,
          content: `Hi ${athlete.name.split(' ')[0]}, I saw your highlights on OnlyKrida. Impressive work!`,
          read: true,
          status: 'read',
          created_at: new Date(convoTimestamp.getTime()).toISOString(),
        },
        {
          sender_id: athlete.id,
          receiver_id: scout.id,
          content: `Thank you so much! I've been training hard this season.`,
          read: true,
          status: 'read',
          created_at: new Date(convoTimestamp.getTime() + 3600000).toISOString(),
        },
        {
          sender_id: scout.id,
          receiver_id: athlete.id,
          content: `We have trials coming up next month. Would you be interested in attending?`,
          read: Math.random() > 0.3,
          status: Math.random() > 0.3 ? 'read' : 'delivered',
          created_at: new Date(convoTimestamp.getTime() + 7200000).toISOString(),
        },
        {
          sender_id: athlete.id,
          receiver_id: scout.id,
          content: `Absolutely! Please share the details. I'll be there.`,
          read: Math.random() > 0.5,
          status: Math.random() > 0.5 ? 'read' : 'sent',
          created_at: new Date(convoTimestamp.getTime() + 10800000).toISOString(),
        },
      ];
      messageRows.push(...msgs);
    }
  }

  if (messageRows.length) {
    const { error: msgErr } = await admin.from('messages').insert(messageRows);
    if (msgErr) console.error('  ERROR messages:', msgErr.message);
    else console.log(`  Created ${messageRows.length} messages`);
  }

  // ================================================================
  // STEP 8: NOTIFICATIONS
  // ================================================================

  const notifRows: any[] = [];
  for (const f of followRows.slice(0, 30)) {
    const follower = allUsers.find((u) => u.id === f.follower_id);
    if (!follower) continue;
    notifRows.push({
      user_id: f.following_id,
      type: 'follow',
      title: 'New Follower',
      message: `${follower.name} started following you`,
      read: Math.random() > 0.4,
      data: JSON.stringify({ follower_id: f.follower_id }),
      created_at: pastDate(1, 30),
    });
  }

  for (let i = 0; i < 15; i++) {
    const athlete = pick(athletes);
    const tmpl = pick(OPPORTUNITY_TEMPLATES);
    notifRows.push({
      user_id: athlete.id,
      type: 'opportunity',
      title: 'New Opportunity',
      message: `${tmpl.title} - Apply now!`,
      read: Math.random() > 0.5,
      data: JSON.stringify({ sport: tmpl.sport }),
      created_at: pastDate(1, 14),
    });
  }

  if (notifRows.length) {
    const { error: nErr } = await admin.from('notifications').insert(notifRows);
    if (nErr) console.error('  ERROR notifications:', nErr.message);
    else console.log(`  Created ${notifRows.length} notifications`);
  }

  // ================================================================
  // STEP 9: GROUP CHATS (one per team/academy)
  // ================================================================

  console.log('[9b/10] Creating group chats...');
  let groupCount = 0;
  for (const team of teams) {
    const { data: groupData, error: gErr } = await admin
      .from('groups')
      .insert({ name: `${team.name} Group`, created_by: team.id })
      .select('id')
      .single();

    if (gErr || !groupData) {
      console.error('  ERROR creating group:', gErr?.message);
      continue;
    }

    const groupId = groupData.id;
    const teamAthletes = athletes.filter((a) => a.sport === team.sport);
    const members = pickN(teamAthletes, Math.min(teamAthletes.length, 8));

    const memberRows = [
      { group_id: groupId, user_id: team.id, role: 'admin' },
      ...members.map((m) => ({ group_id: groupId, user_id: m.id, role: 'member' as const })),
    ];

    const { error: gmErr } = await admin.from('group_members').insert(memberRows);
    if (gmErr) console.error('  ERROR group_members:', gmErr.message);

    const groupMsgs = [
      {
        group_id: groupId,
        sender_id: team.id,
        content: `Welcome to the ${team.name} group! Share updates here.`,
      },
      ...(members.length > 0
        ? [
            {
              group_id: groupId,
              sender_id: members[0].id,
              content: 'Excited to be part of this group!',
            },
          ]
        : []),
      ...(members.length > 1
        ? [
            {
              group_id: groupId,
              sender_id: members[1].id,
              content: 'When is the next training session?',
            },
          ]
        : []),
      {
        group_id: groupId,
        sender_id: team.id,
        content: 'Training resumes Monday 6 AM at the main ground. Be on time.',
      },
    ];

    const { error: gmsgErr } = await admin.from('group_messages').insert(groupMsgs);
    if (gmsgErr) console.error('  ERROR group_messages:', gmsgErr.message);
    groupCount++;
  }
  console.log(`  Created ${groupCount} group chats with members and messages`);

  // ================================================================
  // STEP 10: FITNESS TEST RESULTS
  // ================================================================

  console.log('[10/10] Creating fitness test results...');
  const fitnessRows: any[] = [];

  // Yo-Yo IR1 results for 20 athletes
  const yoyoAthletes = pickN(athletes, 20);
  for (const a of yoyoAthletes) {
    const zone = weightedZone();
    const level = zoneToYoyoLevel(zone);
    const shuttle = randomInt(1, 8);
    const vo2max = levelToVO2Max(level, shuttle);
    const totalShuttles = levelToTotalShuttles(level, shuttle);
    const totalDistance = totalShuttles * 20;
    const tier = weightedTier();
    const conductedBy = tier === 'coach_verified' || Math.random() > 0.5 ? pick(coaches).id : null;

    fitnessRows.push({
      athlete_id: a.id,
      conducted_by: conductedBy,
      test_type: 'yoyo',
      test_mode:
        tier === 'app_measured'
          ? 'self'
          : tier === 'coach_verified'
            ? 'coached'
            : pick(['self', 'coached', 'manual'] as const),
      level,
      shuttle,
      vo2max,
      total_distance: totalDistance,
      total_shuttles: totalShuttles,
      peak_speed: randomFloat(12.0, 17.5),
      zone,
      test_date: pastDate(1, 60),
      notes:
        Math.random() > 0.6
          ? pick([
              'Good effort, need to improve last 2 levels',
              'Consistent pace throughout',
              'Started strong, faded in final levels',
              'Personal best! Huge improvement from last test',
              'Post-injury test. Good recovery progress',
            ])
          : null,
      ...verificationFields(tier, 'yoyo', conductedBy),
    });
  }

  // Sprint results for 15 athletes
  const sprintAthletes = pickN(athletes, 15);
  for (const a of sprintAthletes) {
    const zone = weightedZone();
    const is20m = Math.random() > 0.4;
    const sprintTime = is20m ? zoneToSprintTime(zone, 20) : zoneToSprintTime(zone, 40);
    const testType = is20m ? 'sprint_20m' : 'sprint_40m';
    const tier = weightedTier();
    const conductedBy = tier === 'coach_verified' || Math.random() > 0.5 ? pick(coaches).id : null;

    fitnessRows.push({
      athlete_id: a.id,
      conducted_by: conductedBy,
      test_type: testType,
      test_mode:
        tier === 'app_measured'
          ? 'self'
          : tier === 'coach_verified'
            ? 'coached'
            : pick(['self', 'coached'] as const),
      sprint_time: sprintTime,
      sprint_distance: is20m ? 20 : 40,
      zone,
      test_date: pastDate(1, 45),
      notes:
        Math.random() > 0.7
          ? pick([
              'Reaction time was slow off the mark',
              'Strong acceleration phase',
              'Wind-assisted, may not count as PB',
              'Electronic timing used',
            ])
          : null,
      ...verificationFields(tier, testType, conductedBy),
    });
  }

  if (fitnessRows.length) {
    const { error: fitErr } = await admin.from('fitness_test_results').insert(fitnessRows);
    if (fitErr) console.error('  ERROR fitness_test_results:', fitErr.message);
    else console.log(`  Created ${fitnessRows.length} fitness test results (20 Yo-Yo + 15 Sprint)`);
  }

  // ================================================================
  // STEP 11: LIKES & COMMENTS on posts
  // ================================================================

  if (postIds.length > 0) {
    console.log('[10b/10] Creating likes and comments...');

    const likeRows: { user_id: string; post_id: string }[] = [];
    const likeSet = new Set<string>();
    for (let i = 0; i < 250; i++) {
      const user = pick(allUsers);
      const postId = pick(postIds);
      const key = `${user.id}:${postId}`;
      if (likeSet.has(key)) continue;
      likeSet.add(key);
      likeRows.push({ user_id: user.id, post_id: postId });
    }

    if (likeRows.length) {
      const { error: likeErr } = await admin.from('likes').insert(likeRows);
      if (likeErr && !likeErr.message.includes('duplicate'))
        console.error('  ERROR likes:', likeErr.message);
      else console.log(`  Created ${likeRows.length} likes`);
    }

    const commentContents = [
      'Great work! Keep it up',
      'Incredible skills!',
      'This is fire',
      'Superb technique',
      "You're going to go far",
      'Respect the grind',
      'Which academy are you training at?',
      'Would love to train together sometime',
      'State level talent right here',
      'National squad material',
      'Inspiring stuff!',
      'Hard work pays off',
      'Amazing improvement!',
      'Can you share your training routine?',
      'See you at the trials!',
    ];

    const commentRows: { user_id: string; post_id: string; content: string }[] = [];
    for (let i = 0; i < 80; i++) {
      commentRows.push({
        user_id: pick(allUsers).id,
        post_id: pick(postIds),
        content: pick(commentContents),
      });
    }

    if (commentRows.length) {
      const { error: cmtErr } = await admin.from('comments').insert(commentRows);
      if (cmtErr) console.error('  ERROR comments:', cmtErr.message);
      else console.log(`  Created ${commentRows.length} comments`);
    }
  }

  // ================================================================
  // SUMMARY
  // ================================================================

  console.log('\n========================================');
  console.log('  SEED COMPLETE');
  console.log('========================================');
  console.log(`  Athletes:          ${athletes.length}`);
  console.log(`  Scouts:            ${scouts.length}`);
  console.log(`  Coaches:           ${coaches.length}`);
  console.log(`  Teams/Academies:   ${teams.length}`);
  console.log(`  Posts:             ${postRows.length}`);
  console.log(`  Opportunities:     ${oppRows.length}`);
  console.log(`  Follows:           ${followRows.length}`);
  console.log(`  Messages:          ${messageRows.length}`);
  console.log(`  Notifications:     ${notifRows.length}`);
  console.log(`  Fitness Tests:     ${fitnessRows.length}`);
  console.log(`  Group Chats:       ${groupCount}`);
  console.log(`  Likes:             ~250`);
  console.log(`  Comments:          ~80`);
  console.log('========================================');
  console.log('  Default password: OnlyKrida123!');
  console.log('  Email domain:    @onlykrida.test');
  console.log('========================================\n');
}

// ---------------------------------------------------------------------------
// CLEANUP
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log('\n========================================');
  console.log('  OnlyKrida Cleanup');
  console.log('========================================\n');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Find all seed users by metadata tag or email domain
  const ids: string[] = [];
  const emails: string[] = [];
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = (data?.users ?? []).filter((u: any) => {
      const md: any = u.user_metadata ?? {};
      const email = (u.email ?? '').toLowerCase();
      return (
        md.seed_tag === SEED_TAG ||
        md.seed_tag === 'onlykrida-seed' || // old v1 tag
        md.seed === true ||
        email.endsWith('@onlykrida.test') ||
        email.endsWith('@example.test') || // old v1 domain
        NUKE_SEED_EMAILS.has(email) // hardcoded demo accounts from nuke-and-seed.ts
      );
    });
    batch.forEach((u: any) => {
      if (u.id) ids.push(u.id);
      if (u.email) emails.push(u.email);
    });
    if ((data?.users?.length ?? 0) < perPage) break;
    page++;
  }

  console.log(`Found ${ids.length} seed users to clean up`);
  if (!ids.length) {
    console.log('No seed users found. Nothing to clean up.');
    return;
  }

  const chunk = <T>(arr: T[], size: number): T[][] =>
    arr.reduce<T[][]>((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

  for (const group of chunk(ids, 500)) {
    const idList = group.join(',');

    // Delete in FK dependency order (children first)
    console.log(`  Deleting data for batch of ${group.length} users...`);
    await admin.from('group_messages').delete().in('sender_id', group);
    await admin.from('group_members').delete().in('user_id', group);
    await admin.from('fitness_test_results').delete().in('athlete_id', group);
    await admin.from('fitness_test_results').delete().in('conducted_by', group);
    await admin
      .from('ai_recommendations')
      .delete()
      .or(`scout_id.in.(${idList}),player_id.in.(${idList})`);
    await admin.from('scout_preferences').delete().in('scout_id', group);
    await admin.from('player_stats').delete().in('player_id', group);
    await admin.from('comment_likes').delete().in('user_id', group);
    await admin.from('comments').delete().in('user_id', group);
    await admin.from('likes').delete().in('user_id', group);
    await admin.from('notifications').delete().in('user_id', group);
    await admin.from('messages').delete().or(`sender_id.in.(${idList}),receiver_id.in.(${idList})`);
    await admin.from('applications').delete().in('athlete_id', group);
    await admin
      .from('follows')
      .delete()
      .or(`follower_id.in.(${idList}),following_id.in.(${idList})`);
    await admin.from('posts').delete().in('user_id', group);
    await admin.from('opportunities').delete().in('team_id', group);
    await admin.from('groups').delete().in('created_by', group);
    await admin.from('profiles').delete().in('id', group);
  }

  // Delete auth users
  console.log('  Deleting auth users...');
  for (const id of ids) {
    try {
      await admin.auth.admin.deleteUser(id);
    } catch (e: any) {
      console.error(`  WARN deleteUser ${id}: ${e?.message}`);
    }
  }

  console.log(`\n  Cleaned up ${ids.length} seed users and all related data.`);
  console.log(`  Sample emails: ${emails.slice(0, 3).join(', ')}\n`);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--cleanup')) {
    await cleanup();
  } else {
    await seed();
  }
}

main().catch((e) => {
  console.error('FATAL:', e?.message ?? String(e));
  process.exit(1);
});
