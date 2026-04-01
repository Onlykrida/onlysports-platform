import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const { data: profiles } = await admin.from('profiles').select('id, email');
  const idMap: Record<string, string> = {};
  for (const p of profiles || []) idMap[p.email] = p.id;

  const opps = [
    {
      teamEmail: 'team.thunderbolts@onlykrida.com',
      title: 'Mumbai Thunderbolts FC — Open Trials 2026',
      description:
        'Looking for U-23 forwards and midfielders for our I-League 2nd Division squad. Must have competitive match experience. Trials at Cooperage Stadium.',
      category: 'tryouts',
      type: ['local'],
      sport: 'Football',
      location: 'Mumbai, India',
      daysUntil: 30,
      paid: false,
    },
    {
      teamEmail: 'team.falcons@onlykrida.com',
      title: 'Dubai Sports Falcons — Basketball Scholarship',
      description:
        'Full scholarship for talented women basketball players aged 16-20. Includes training, accommodation, and competition fees.',
      category: 'scholarships',
      type: ['long-term'],
      sport: 'Basketball',
      location: 'Dubai, UAE',
      daysUntil: 45,
      paid: false,
    },
    {
      teamEmail: 'team.falcons@onlykrida.com',
      title: 'GCC Youth Athletics Championship',
      description:
        'Registrations open for the GCC Youth Athletics Championship 2026. Events: 100m, 200m, 400m, 800m, Long Jump, High Jump.',
      category: 'tournaments',
      type: ['national'],
      sport: 'Athletics',
      location: 'Abu Dhabi, UAE',
      daysUntil: 60,
      paid: false,
    },
    {
      teamEmail: 'team.thunderbolts@onlykrida.com',
      title: 'Nike Grassroots Football Sponsorship',
      description:
        'Nike India partnering with grassroots academies. Equipment sponsorship + coaching grants for promising youth programs.',
      category: 'sponsorships',
      type: ['paid'],
      sport: 'Football',
      location: 'Pan-India',
      daysUntil: 20,
      paid: true,
    },
    {
      teamEmail: 'coach.kabir@onlykrida.com',
      title: 'Kolkata Football Academy — Talent Hunt',
      description:
        'Annual talent hunt for boys & girls aged 12-16. No registration fee. Just bring your boots and your hunger.',
      category: 'tryouts',
      type: ['local'],
      sport: 'Football',
      location: 'Kolkata, India',
      daysUntil: 15,
      paid: false,
    },
    {
      teamEmail: 'coach.sarah@onlykrida.com',
      title: "Women's Basketball Development Camp",
      description:
        '2-week intensive development camp. FIBA methodology. Open to all skill levels. Limited to 40 spots.',
      category: 'tournaments',
      type: ['short-term'],
      sport: 'Basketball',
      location: 'Dubai, UAE',
      daysUntil: 35,
      paid: false,
    },
  ];

  for (const o of opps) {
    const teamId = idMap[o.teamEmail];
    if (!teamId) {
      console.log('No ID for', o.teamEmail);
      continue;
    }
    const deadline = new Date(Date.now() + o.daysUntil * 86400000).toISOString();
    const { error } = await admin.from('opportunities').insert({
      team_id: teamId,
      title: o.title,
      description: o.description,
      category: o.category,
      type: o.type,
      sport: o.sport,
      location: o.location,
      deadline,
      paid: o.paid,
      contact_info: 'Apply through OnlyKrida app',
      requirements: 'Competitive experience required',
    });
    if (error) console.log('✗', o.title, error.message);
    else console.log('✓', o.title);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
