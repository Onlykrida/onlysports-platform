import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================
// PITCH-READY DEMO DATA
// ============================================================

const DEMO_PASSWORD = 'Demo1234!';

interface DemoUser {
  email: string;
  name: string;
  role: string;
  sport: string;
  position: string;
  bio: string;
  location: string;
  verified: boolean;
  achievements: string[];
}

const DEMO_USERS: DemoUser[] = [
  // ---- ATHLETES ----
  {
    email: 'arjun@onlykrida.com',
    name: 'Arjun Deshmukh',
    role: 'athlete',
    sport: 'Football',
    position: 'Striker',
    bio: 'U-23 India camp invitee. 47 goals in 3 seasons with Mumbai City FC Youth. Looking for ISL & international trials.',
    location: 'Mumbai, India',
    verified: true,
    achievements: [
      'Mumbai City FC Youth Top Scorer 2025',
      'U-23 India Camp 2025',
      'MDFA Elite Division Champion',
    ],
  },
  {
    email: 'priya@onlykrida.com',
    name: 'Priya Sharma',
    role: 'athlete',
    sport: 'Boxing',
    position: 'Flyweight',
    bio: 'National Sub-Junior Gold Medalist. Training out of a garage in Dharavi — ready for the world stage.',
    location: 'Mumbai, India',
    verified: true,
    achievements: [
      'National Sub-Junior Gold 2024',
      'Maharashtra State Champion 2025',
      'SAI Scholarship Recipient',
    ],
  },
  {
    email: 'fatima@onlykrida.com',
    name: 'Fatima Al-Rashid',
    role: 'athlete',
    sport: 'Athletics',
    position: '400m Sprint',
    bio: 'Dubai Athletics Club. PB 52.1s in 400m. Chasing the Asian Games qualifying time.',
    location: 'Dubai, UAE',
    verified: true,
    achievements: [
      'UAE National 400m Bronze 2025',
      'Dubai Athletics Club Record Holder',
      'GCC Junior Champion 2024',
    ],
  },
  {
    email: 'rahul@onlykrida.com',
    name: 'Rahul Verma',
    role: 'athlete',
    sport: 'Cricket',
    position: 'Fast Bowler',
    bio: 'Left-arm pace, clocking 140+ kmph. Ranji Trophy debut at 19. Looking for IPL scout connections.',
    location: 'Delhi, India',
    verified: false,
    achievements: [
      'Ranji Trophy Debut 2025',
      'DDCA U-19 Best Bowler',
      '5-wicket haul vs Maharashtra',
    ],
  },
  {
    email: 'sneha@onlykrida.com',
    name: 'Sneha Patil',
    role: 'athlete',
    sport: 'Badminton',
    position: 'Singles',
    bio: 'BWF Junior Ranked #47. Training at Pullela Gopichand Academy. Eyes on 2028 Olympics.',
    location: 'Hyderabad, India',
    verified: true,
    achievements: [
      'BWF Junior World Ranking #47',
      'All India Junior Champion 2025',
      'Gopichand Academy Scholar',
    ],
  },
  {
    email: 'omar@onlykrida.com',
    name: 'Omar Hassan',
    role: 'athlete',
    sport: 'Football',
    position: 'Goalkeeper',
    bio: 'Al Wasl FC Academy graduate. 6\'3" shot-stopper with 14 clean sheets this season.',
    location: 'Dubai, UAE',
    verified: false,
    achievements: [
      'Al Wasl FC Academy Best GK 2025',
      'UAE U-21 Squad',
      '14 Clean Sheets in 2025 Season',
    ],
  },
  {
    email: 'ananya@onlykrida.com',
    name: 'Ananya Krishnan',
    role: 'athlete',
    sport: 'Swimming',
    position: 'Freestyle',
    bio: '200m freestyle national record holder (U-18). Training for Asian Aquatic Championships.',
    location: 'Bangalore, India',
    verified: true,
    achievements: [
      'National U-18 Record - 200m Freestyle',
      'Karnataka State Gold x5',
      'SAI Center of Excellence Trainee',
    ],
  },
  {
    email: 'vikram@onlykrida.com',
    name: 'Vikram Singh',
    role: 'athlete',
    sport: 'Kabaddi',
    position: 'Raider',
    bio: 'PKL aspirant. 156 raid points in state league. The streets of Haryana made me.',
    location: 'Sonipat, India',
    verified: false,
    achievements: [
      'Haryana State Kabaddi Gold 2025',
      '156 Raid Points - State League',
      'SAI Scholarship Holder',
    ],
  },
  {
    email: 'aisha@onlykrida.com',
    name: 'Aisha Mohammed',
    role: 'athlete',
    sport: 'Basketball',
    position: 'Point Guard',
    bio: "Captain of Dubai Basketball Club women's team. 18.3 PPG average. Seeking NCAA D1 opportunities.",
    location: 'Dubai, UAE',
    verified: true,
    achievements: [
      'Dubai Basketball Club Captain',
      '18.3 PPG Season Average',
      'GCC All-Star Team 2025',
    ],
  },
  {
    email: 'dev@onlykrida.com',
    name: 'Dev Patel',
    role: 'athlete',
    sport: 'Tennis',
    position: 'Singles',
    bio: 'ITF Junior ranked. Training at DLTA. Backhand that makes coaches stop and stare.',
    location: 'Delhi, India',
    verified: false,
    achievements: [
      'ITF Junior Points Winner',
      'AITA National Ranking #23 (U-18)',
      'DLTA Academy Top Prospect',
    ],
  },

  // ---- SCOUTS ----
  {
    email: 'scout.ravi@onlykrida.com',
    name: 'Ravi Menon',
    role: 'scout',
    sport: 'Football',
    position: '',
    bio: 'Chief Scout at Kerala Blasters FC. 15 years in Indian football scouting. Finding the next Sunil Chhetri.',
    location: 'Kochi, India',
    verified: true,
    achievements: [
      'Scouted 12 ISL players',
      'Kerala Blasters FC - Chief Scout',
      'AFC B License Holder',
    ],
  },
  {
    email: 'scout.james@onlykrida.com',
    name: 'James Al-Maktoum',
    role: 'scout',
    sport: 'Football',
    position: '',
    bio: 'UAE Pro League talent scout. Specializing in South Asian & Middle Eastern talent pipelines.',
    location: 'Abu Dhabi, UAE',
    verified: true,
    achievements: [
      'UAE Pro League Scout Network',
      'Identified 8 international signings',
      'AFC A License',
    ],
  },
  {
    email: 'scout.meera@onlykrida.com',
    name: 'Dr. Meera Joshi',
    role: 'scout',
    sport: 'Athletics',
    position: '',
    bio: "SAI talent identification specialist. Ph.D in Sports Science. Building India's Olympic pipeline.",
    location: 'Patiala, India',
    verified: true,
    achievements: [
      'SAI Senior Scout',
      'Identified 5 Olympic hopefuls',
      'Sports Science Ph.D - NIS Patiala',
    ],
  },

  // ---- COACHES ----
  {
    email: 'coach.kabir@onlykrida.com',
    name: 'Coach Kabir Khan',
    role: 'coach',
    sport: 'Football',
    position: '',
    bio: 'AFC Pro License. Former I-League player turned youth development coach. Building champions from grassroots.',
    location: 'Kolkata, India',
    verified: true,
    achievements: [
      'AFC Pro License',
      'Developed 20+ professional players',
      'I-League Best Youth Coach 2024',
    ],
  },
  {
    email: 'coach.sarah@onlykrida.com',
    name: 'Sarah Al-Dosari',
    role: 'coach',
    sport: 'Basketball',
    position: '',
    bio: "Head Coach, Dubai Women's Basketball. FIBA licensed. Empowering the next generation of women in sport.",
    location: 'Dubai, UAE',
    verified: true,
    achievements: [
      'FIBA Licensed Coach',
      "Dubai Women's Basketball - Head Coach",
      'GCC Coach of the Year 2024',
    ],
  },

  // ---- TEAMS ----
  {
    email: 'team.thunderbolts@onlykrida.com',
    name: 'Mumbai Thunderbolts FC',
    role: 'team',
    sport: 'Football',
    position: '',
    bio: 'Rising youth football academy in Mumbai. Producing ISL-ready talent since 2020. Open trials every quarter.',
    location: 'Mumbai, India',
    verified: true,
    achievements: [
      'MDFA Youth League Champions 2025',
      '8 players signed to ISL clubs',
      'Best Youth Academy - Maharashtra',
    ],
  },
  {
    email: 'team.falcons@onlykrida.com',
    name: 'Dubai Sports Falcons',
    role: 'team',
    sport: 'Multi-Sport',
    position: '',
    bio: 'Multi-sport academy based in Dubai Sports City. Football, basketball, athletics programs for ages 12-23.',
    location: 'Dubai, UAE',
    verified: true,
    achievements: [
      'Dubai Sports City Partner Academy',
      '500+ active athletes',
      'GCC Youth Excellence Award 2025',
    ],
  },

  // ---- TRAINERS ----
  {
    email: 'trainer.raj@onlykrida.com',
    name: 'Raj Fitness Pro',
    role: 'trainer',
    sport: 'Strength & Conditioning',
    position: '',
    bio: 'NSCA-CSCS certified. Training elite athletes across cricket, football, and combat sports. Science-backed programming.',
    location: 'Pune, India',
    verified: false,
    achievements: [
      'NSCA-CSCS Certified',
      'Trained 30+ professional athletes',
      'Sports Performance Lab - Pune',
    ],
  },

  // ---- DEMO LOGIN USER (easy to remember for pitch) ----
  {
    email: 'demo@onlykrida.com',
    name: 'Anirudh Tumuluru',
    role: 'athlete',
    sport: 'Football',
    position: 'Midfielder',
    bio: 'OnlyKrida founder & athlete. Building the platform I wish existed when I was growing up.',
    location: 'Dubai, UAE',
    verified: true,
    achievements: ['OnlyKrida Founder', 'Grassroots Football Advocate', 'Sports Tech Innovator'],
  },
];

const POST_DATA = [
  {
    userEmail: 'arjun@onlykrida.com',
    title: 'Hat-trick vs Bengaluru FC Youth!',
    description:
      'What a night! 3 goals in 25 minutes. The hard work is paying off. Thanks to everyone who believed in me when nobody was watching. 🔥⚽',
    type: 'highlight',
  },
  {
    userEmail: 'arjun@onlykrida.com',
    title: 'Morning training session',
    description: 'First one in, last one out. 6 AM sprint drills. No shortcuts.',
    type: 'training',
  },
  {
    userEmail: 'priya@onlykrida.com',
    title: 'National Gold Medal — Flyweight',
    description:
      'FROM A GARAGE IN DHARAVI TO THE NATIONAL PODIUM. This is just the beginning. 🥊🥇',
    type: 'achievement',
  },
  {
    userEmail: 'priya@onlykrida.com',
    title: 'Sparring session highlights',
    description: 'Working on counter-punching combinations with my coach. Speed kills.',
    type: 'training',
  },
  {
    userEmail: 'fatima@onlykrida.com',
    title: 'New PB — 52.1s in 400m!',
    description:
      "Asian Games qualifying time is 51.8s. I'm 0.3 seconds away. The grind doesn't stop.",
    type: 'achievement',
  },
  {
    userEmail: 'rahul@onlykrida.com',
    title: 'Ranji Trophy debut — 4 wickets!',
    description:
      '4/38 on debut. Left-arm pace at 142 kmph. Dreams do come true if you work for them.',
    type: 'highlight',
  },
  {
    userEmail: 'sneha@onlykrida.com',
    title: 'BWF Junior semifinal win!',
    description: 'Through to the finals! 21-18, 21-15. Feeling strong and focused. 🏸',
    type: 'highlight',
  },
  {
    userEmail: 'omar@onlykrida.com',
    title: 'Clean sheet vs Al Ain Academy',
    description: "Big save in the 89th minute to keep it 1-0. That's what goalkeepers live for.",
    type: 'highlight',
  },
  {
    userEmail: 'ananya@onlykrida.com',
    title: 'National record broken! 🏊‍♀️',
    description: 'New U-18 national record in 200m freestyle. 2:01.34. Every lap counts.',
    type: 'achievement',
  },
  {
    userEmail: 'vikram@onlykrida.com',
    title: 'State league raiding masterclass',
    description: '23 raid points in one match. Haryana style. The mat is my stage.',
    type: 'highlight',
  },
  {
    userEmail: 'aisha@onlykrida.com',
    title: 'Game-winner vs Sharjah!',
    description: "Buzzer-beater three-pointer to win it 67-65. Captain's knock. 🏀",
    type: 'highlight',
  },
  {
    userEmail: 'dev@onlykrida.com',
    title: 'ITF Junior points tournament W',
    description: 'Won my first ITF Junior event! Straight sets in the final. 6-3, 6-4.',
    type: 'achievement',
  },
  {
    userEmail: 'demo@onlykrida.com',
    title: 'Building OnlyKrida — Day 1',
    description:
      "Every athlete deserves to be seen. We're building the platform that makes it happen. Stay tuned. 🚀",
    type: 'highlight',
  },
  {
    userEmail: 'demo@onlykrida.com',
    title: 'Weekend pickup game',
    description: 'Nothing beats playing with friends on a Friday evening. This is why we do it.',
    type: 'training',
  },
];

const OPPORTUNITY_DATA = [
  {
    teamEmail: 'team.thunderbolts@onlykrida.com',
    title: 'Mumbai Thunderbolts FC — Open Trials 2026',
    description:
      'Looking for U-23 forwards and midfielders for our I-League 2nd Division squad. Must have competitive match experience. Trials at Cooperage Stadium.',
    type: 'tryout',
    sport: 'Football',
    location: 'Mumbai, India',
    daysUntil: 30,
  },
  {
    teamEmail: 'team.falcons@onlykrida.com',
    title: 'Dubai Sports Falcons — Basketball Scholarship',
    description:
      'Full scholarship for talented women basketball players aged 16-20. Includes training, accommodation, and competition fees. Apply with highlight reel.',
    type: 'scholarship',
    sport: 'Basketball',
    location: 'Dubai, UAE',
    daysUntil: 45,
  },
  {
    teamEmail: 'team.falcons@onlykrida.com',
    title: 'GCC Youth Athletics Championship',
    description:
      'Registrations open for the GCC Youth Athletics Championship 2026. Events: 100m, 200m, 400m, 800m, Long Jump, High Jump.',
    type: 'tournament',
    sport: 'Athletics',
    location: 'Abu Dhabi, UAE',
    daysUntil: 60,
  },
  {
    teamEmail: 'team.thunderbolts@onlykrida.com',
    title: 'Nike Grassroots Football Sponsorship',
    description:
      'Nike India partnering with grassroots academies. Equipment sponsorship + coaching grants for promising youth programs.',
    type: 'sponsorship',
    sport: 'Football',
    location: 'Pan-India',
    daysUntil: 20,
  },
  {
    teamEmail: 'coach.kabir@onlykrida.com',
    title: 'Kolkata Football Academy — Talent Hunt',
    description:
      'Annual talent hunt for boys & girls aged 12-16. No registration fee. Just bring your boots and your hunger.',
    type: 'tryout',
    sport: 'Football',
    location: 'Kolkata, India',
    daysUntil: 15,
  },
  {
    teamEmail: 'coach.sarah@onlykrida.com',
    title: "Women's Basketball Development Camp",
    description:
      '2-week intensive development camp. FIBA methodology. Open to all skill levels. Limited to 40 spots.',
    type: 'tournament',
    sport: 'Basketball',
    location: 'Dubai, UAE',
    daysUntil: 35,
  },
];

// ============================================================
// MAIN EXECUTION
// ============================================================

async function nukeAllData() {
  console.log('🗑️  Nuking all existing data...');

  // Delete all rows from all tables (order matters for foreign keys)
  const tables = [
    'likes',
    'notifications',
    'messages',
    'applications',
    'posts',
    'opportunities',
    'follows',
    'group_members',
    'group_messages',
    'groups',
    'profiles',
  ];
  for (const table of tables) {
    const { error } = await admin
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && !error.message.includes('does not exist')) {
      console.log(`  ${table}: ${error.message}`);
    } else {
      console.log(`  ✓ ${table} cleared`);
    }
  }

  // Delete ALL auth users
  let page = 1;
  let totalDeleted = 0;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('listUsers error:', error.message);
      break;
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
      if (delErr) console.error(`  Failed to delete ${user.email}:`, delErr.message);
      else totalDeleted++;
    }
    // Don't increment page since we're deleting from the front
  }
  console.log(`  ✓ ${totalDeleted} auth users deleted`);
}

async function seedPitchData() {
  console.log('\n🌱 Seeding pitch-ready demo data...');

  // Create auth users and profiles
  const userIdMap: Record<string, string> = {};

  for (const u of DEMO_USERS) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role, sport: u.sport },
    });

    if (error) {
      console.error(`  ✗ Failed to create ${u.email}:`, error.message);
      continue;
    }

    const userId = created.user!.id;
    userIdMap[u.email] = userId;

    // Insert profile
    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email: u.email,
        name: u.name,
        role: u.role,
        sport: u.sport,
        position: u.position,
        bio: u.bio,
        location: u.location,
        verified: u.verified,
        achievements: u.achievements,
        stats: {},
      },
      { onConflict: 'id' },
    );

    if (profileErr) console.error(`  ✗ Profile for ${u.email}:`, profileErr.message);
    else console.log(`  ✓ ${u.name} (${u.role}) — ${u.email}`);
  }

  // Create posts
  console.log('\n📝 Creating posts...');
  for (const p of POST_DATA) {
    const userId = userIdMap[p.userEmail];
    if (!userId) continue;

    const { error } = await admin.from('posts').insert({
      user_id: userId,
      title: p.title,
      description: p.description,
      type: p.type,
      image_url: null,
      video_url: null,
    });
    if (error) console.error(`  ✗ Post "${p.title}":`, error.message);
    else console.log(`  ✓ "${p.title}"`);
  }

  // Create opportunities
  console.log('\n🎯 Creating opportunities...');
  for (const o of OPPORTUNITY_DATA) {
    const teamId = userIdMap[o.teamEmail];
    if (!teamId) continue;

    const deadline = new Date(Date.now() + o.daysUntil * 24 * 3600 * 1000).toISOString();
    const { error } = await admin.from('opportunities').insert({
      team_id: teamId,
      title: o.title,
      description: o.description,
      type: o.type,
      sport: o.sport,
      location: o.location,
      deadline,
      requirements: ['Competitive experience', 'Highlight reel or stats', 'Committed attitude'],
    });
    if (error) console.error(`  ✗ Opportunity "${o.title}":`, error.message);
    else console.log(`  ✓ "${o.title}"`);
  }

  // Create follows (athletes follow scouts/coaches, scouts follow athletes)
  console.log('\n👥 Creating follow relationships...');
  const athletes = DEMO_USERS.filter((u) => u.role === 'athlete');
  const nonAthletes = DEMO_USERS.filter((u) => u.role !== 'athlete');
  let followCount = 0;

  for (const athlete of athletes) {
    const athleteId = userIdMap[athlete.email];
    if (!athleteId) continue;

    for (const other of nonAthletes) {
      const otherId = userIdMap[other.email];
      if (!otherId) continue;

      // Athletes follow all scouts/coaches/teams
      await admin.from('follows').insert({ follower_id: athleteId, following_id: otherId });
      followCount++;

      // Some scouts/coaches follow athletes back
      if (Math.random() > 0.3) {
        await admin.from('follows').insert({ follower_id: otherId, following_id: athleteId });
        followCount++;
      }
    }
  }

  // Athletes follow each other
  for (let i = 0; i < athletes.length; i++) {
    for (let j = i + 1; j < athletes.length; j++) {
      if (Math.random() > 0.5) {
        const id1 = userIdMap[athletes[i].email];
        const id2 = userIdMap[athletes[j].email];
        if (id1 && id2) {
          await admin.from('follows').insert({ follower_id: id1, following_id: id2 });
          await admin.from('follows').insert({ follower_id: id2, following_id: id1 });
          followCount += 2;
        }
      }
    }
  }
  console.log(`  ✓ ${followCount} follow relationships`);

  // Create some messages
  console.log('\n💬 Creating demo messages...');
  const demoId = userIdMap['demo@onlykrida.com'];
  const scoutRaviId = userIdMap['scout.ravi@onlykrida.com'];
  const coachKabirId = userIdMap['coach.kabir@onlykrida.com'];
  const arjunId = userIdMap['arjun@onlykrida.com'];

  const messages = [
    {
      sender: scoutRaviId,
      receiver: arjunId,
      content:
        'Arjun, I watched your hat-trick highlights. Impressive movement off the ball. Kerala Blasters youth setup would love to have you for trials.',
    },
    {
      sender: arjunId,
      receiver: scoutRaviId,
      content: "Thank you sir! I've been dreaming of ISL. When are the next trials?",
    },
    {
      sender: scoutRaviId,
      receiver: arjunId,
      content: "Next month in Kochi. I'll send you the details. Keep training hard.",
    },
    {
      sender: coachKabirId,
      receiver: demoId,
      content:
        "Hey Anirudh, love what you're building with OnlyKrida. This is exactly what Indian sports needs. Count me in as an early supporter.",
    },
    {
      sender: demoId,
      receiver: coachKabirId,
      content:
        'Coach Kabir! That means a lot coming from you. Would love to feature your academy on the platform.',
    },
    {
      sender: scoutRaviId,
      receiver: demoId,
      content:
        "This platform is going to change how scouting works in India. Finally, talent won't go unnoticed.",
    },
  ];

  for (const m of messages) {
    if (!m.sender || !m.receiver) continue;
    const { error } = await admin.from('messages').insert({
      sender_id: m.sender,
      receiver_id: m.receiver,
      content: m.content,
      read: false,
    });
    if (error) console.error(`  ✗ Message:`, error.message);
  }
  console.log(`  ✓ ${messages.length} messages created`);

  // Create some likes
  console.log('\n❤️ Creating likes...');
  const { data: allPosts } = await admin.from('posts').select('id, user_id');
  let likeCount = 0;
  if (allPosts) {
    for (const post of allPosts) {
      // Each post gets likes from random users
      const likers = Object.entries(userIdMap)
        .filter(([_, id]) => id !== post.user_id)
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 8) + 3);

      for (const [_, likerId] of likers) {
        const { error } = await admin.from('likes').insert({ user_id: likerId, post_id: post.id });
        if (!error) likeCount++;
      }
    }
  }
  console.log(`  ✓ ${likeCount} likes`);

  console.log('\n✅ SEED COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 Demo login credentials:');
  console.log(`   Email: demo@onlykrida.com`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('');
  console.log('   All accounts use password: ' + DEMO_PASSWORD);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function main() {
  await nukeAllData();
  await seedPitchData();
}

main().catch((e) => {
  console.error('Fatal:', e?.message ?? String(e));
  process.exit(1);
});
