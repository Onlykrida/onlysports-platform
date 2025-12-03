import { supabase } from '@/constants/supabase';

const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Parker', 'Quinn', 'Reese', 'Avery', 'Jamie', 'Cameron', 'Drew', 'Elliot', 'Harper', 'Kai', 'Logan', 'Mason', 'Noah', 'Owen', 'Peyton', 'Rowan', 'Sawyer', 'Skyler', 'Sage', 'Blake', 'Charlie', 'Dakota', 'Eden', 'Finley'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker'];
const sports = ['Football', 'Basketball', 'Soccer', 'Tennis', 'Badminton', 'Cricket', 'Swimming', 'Volleyball', 'Rugby', 'Hockey', 'Athletics', 'Baseball', 'Golf'];
const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Dubai', 'London', 'New York', 'Los Angeles', 'Singapore', 'Sydney', 'Toronto', 'Berlin', 'Paris', 'Tokyo', 'Madrid'];
const bios = [
  'Passionate athlete dedicated to excellence',
  'Professional coach with 10+ years experience',
  'Scout looking for next generation talent',
  'Team player with a growth mindset',
  'Always hustling on and off the field',
  'Lover of data-driven training',
  'Chasing dreams one rep at a time',
  'Here to discover and develop talent',
  'Elite performance is built in the details',
  'Committed to excellence every day'
];

const positions: Record<string, string[]> = {
  Football: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Tennis: ['Singles', 'Doubles'],
  Cricket: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
  Swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'],
};

const postContents = [
  'Great training session today! 💪 Ready for the upcoming match.',
  'Just finished an intense workout. Feeling stronger every day!',
  'Game day highlights from last night. What a match!',
  'Breaking down film from this week. Always learning.',
  'Recovery day is just as important as training day.',
  'Proud of the team\'s performance this season!',
  'New personal record! Hard work pays off.',
  'Focused on fundamentals today. Back to basics.',
  'Amazing atmosphere at today\'s game. Thank you fans!',
  'Training camp update: Week 2 complete.',
  'Competition brings out the best in all of us.',
  'Behind the scenes of our training routine.',
  'Working on my weaknesses to make them strengths.',
  'Grateful for every opportunity to compete.',
  'Team bonding session. Chemistry matters.'
];

const imageUrls = [
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc',
  'https://images.unsplash.com/photo-1526676037777-05a232554f77',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a',
  'https://images.unsplash.com/photo-1517646630340-8e5f57bcd0d8',
  'https://images.unsplash.com/photo-1521417531039-9601a4fdc08e',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
  'https://images.unsplash.com/photo-1593349481020-5b884d931783'
].map(url => `${url}?w=800&auto=format&fit=crop`);

const videoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
];

const avatarUrls = [
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5',
  'https://images.unsplash.com/photo-1594381898411-846e7d193883',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
  'https://images.unsplash.com/photo-1595152772835-219674b2a8a6',
  'https://images.unsplash.com/photo-1546525848-3ce03ca516f6',
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7'
].map(url => `${url}?w=400&auto=format&fit=crop`);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@mockdata.test`;
}

export async function generateMockUsers(count: number = 100) {
  console.log(`🔄 Generating ${count} mock users...`);
  const roles: ('athlete' | 'coach' | 'scout' | 'team' | 'trainer')[] = ['athlete', 'coach', 'scout', 'team', 'trainer'];
  
  const users: any[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const role = i < count * 0.6 ? 'athlete' : pick(roles);
    const sport = pick(sports);
    const position = positions[sport] ? pick(positions[sport]) : 'Player';
    
    const user = {
      email: generateEmail(firstName, lastName, i),
      name: `${firstName} ${lastName}`,
      role,
      avatar: pick(avatarUrls),
      bio: pick(bios),
      location: `${pick(locations)}, ${pick(['India', 'UAE', 'UK', 'USA', 'Australia', 'Canada'])}`,
      verified: Math.random() > 0.7,
      sport,
      position,
      achievements: [],
      stats: role === 'athlete' ? {
        'Games Played': randomInt(10, 150),
        'Win Rate': `${randomInt(50, 85)}%`
      } : {},
      is_mock: true,
    };
    
    users.push(user);
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert(users)
    .select();

  if (error) {
    console.error('❌ Error creating mock users:', error);
    throw error;
  }

  console.log(`✅ Created ${data?.length || 0} mock users`);
  return data || [];
}

export async function generateMockPosts(count: number = 150) {
  console.log(`🔄 Generating ${count} mock posts...`);
  
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, name, avatar, role')
    .eq('is_mock', true)
    .limit(100);

  if (usersError || !users || users.length === 0) {
    console.error('❌ Error fetching users for posts:', usersError);
    throw new Error('No mock users found. Generate users first.');
  }

  const posts: any[] = [];
  const postsPerUser = Math.ceil(count / users.length);

  for (const user of users) {
    const userPostCount = Math.min(postsPerUser, randomInt(1, 5));
    
    for (let i = 0; i < userPostCount && posts.length < count; i++) {
      const hasMedia = Math.random() > 0.2;
      const isVideo = hasMedia && Math.random() > 0.6;
      
      const post = {
        user_id: user.id,
        title: `${pick(sports)} Update`,
        description: pick(postContents),
        type: pick(['highlight', 'training', 'match', 'achievement'] as const),
        image_url: hasMedia && !isVideo ? pick(imageUrls) : null,
        video_url: isVideo ? pick(videoUrls) : null,
        is_mock: true,
      };
      
      posts.push(post);
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(posts)
    .select();

  if (error) {
    console.error('❌ Error creating mock posts:', error);
    throw error;
  }

  console.log(`✅ Created ${data?.length || 0} mock posts`);
  return data || [];
}

export async function generateMockOpportunities(count: number = 100) {
  console.log(`🔄 Generating ${count} mock opportunities...`);
  
  const { data: teams, error: teamsError } = await supabase
    .from('profiles')
    .select('id, name, sport')
    .eq('is_mock', true)
    .in('role', ['coach', 'scout', 'team'])
    .limit(50);

  if (teamsError || !teams || teams.length === 0) {
    console.error('❌ Error fetching teams for opportunities:', teamsError);
    throw new Error('No mock teams found. Generate users first.');
  }

  const categories: ('tryouts' | 'tournaments' | 'sponsorships' | 'scholarships' | 'contracts')[] = ['tryouts', 'tournaments', 'sponsorships', 'scholarships', 'contracts'];
  const types = ['paid', 'unpaid', 'local', 'national', 'short-term', 'long-term'];
  
  const opportunities: any[] = [];
  const oppsPerTeam = Math.ceil(count / teams.length);

  for (const team of teams) {
    const teamOppCount = Math.min(oppsPerTeam, randomInt(1, 3));
    
    for (let i = 0; i < teamOppCount && opportunities.length < count; i++) {
      const category = pick(categories);
      const isPaid = Math.random() > 0.4;
      const deadline = new Date(Date.now() + randomInt(7, 90) * 24 * 3600 * 1000);
      
      const opp = {
        team_id: team.id,
        title: `${team.sport || pick(sports)} ${category} - ${pick(locations)}`,
        description: `Exciting ${category} opportunity for ${team.sport || pick(sports)} athletes. We're looking for talented individuals to join our program.`,
        category,
        type: [isPaid ? 'paid' : 'unpaid', pick(types.slice(2))],
        sport: team.sport || pick(sports),
        location: `${pick(locations)}, ${pick(['India', 'UAE', 'UK', 'USA'])}`,
        deadline: deadline.toISOString().split('T')[0],
        requirements: 'Dedicated athletes with proven track record',
        compensation: isPaid ? `$${randomInt(500, 5000)} per month` : 'Experience and exposure',
        contact_info: `contact@${team.name.toLowerCase().replace(/\s+/g, '')}.com`,
        paid: isPaid,
        is_mock: true,
      };
      
      opportunities.push(opp);
    }
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert(opportunities)
    .select();

  if (error) {
    console.error('❌ Error creating mock opportunities:', error);
    throw error;
  }

  console.log(`✅ Created ${data?.length || 0} mock opportunities`);
  return data || [];
}

export async function generateMockInteractions() {
  console.log('🔄 Generating mock interactions (follows, likes, comments)...');
  
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('is_mock', true);

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, user_id')
    .eq('is_mock', true);

  if (usersError || !users || postsError || !posts) {
    console.error('❌ Error fetching data for interactions');
    return;
  }

  const follows: any[] = [];
  for (const user of users) {
    const followCount = randomInt(5, 20);
    const targets = users
      .filter((u: any) => u.id !== user.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, followCount);
    
    for (const target of targets) {
      follows.push({
        follower_id: user.id,
        following_id: target.id,
      });
    }
  }

  const uniqueFollows = Array.from(
    new Map(follows.map((f: any) => [`${f.follower_id}-${f.following_id}`, f])).values()
  );

  const { error: followsError } = await supabase
    .from('follows')
    .insert(uniqueFollows);

  if (followsError) {
    console.error('❌ Error creating follows:', followsError);
  } else {
    console.log(`✅ Created ${uniqueFollows.length} follows`);
  }

  const likes: any[] = [];
  const comments: any[] = [];
  const commentTexts = [
    'Great work! Keep it up! 💪',
    'Inspiring performance!',
    'This is what dedication looks like',
    'Amazing! 🔥',
    'Keep grinding!',
    'Incredible talent on display',
    'Outstanding!',
    'Respect! 👏',
  ];

  for (const post of posts) {
    const likeCount = randomInt(5, 50);
    const likers = users
      .sort(() => 0.5 - Math.random())
      .slice(0, likeCount);
    
    for (const liker of likers) {
      likes.push({
        user_id: liker.id,
        post_id: post.id,
      });
    }

    const commentCount = randomInt(0, 8);
    const commenters = users
      .sort(() => 0.5 - Math.random())
      .slice(0, commentCount);
    
    for (const commenter of commenters) {
      comments.push({
        post_id: post.id,
        user_id: commenter.id,
        content: pick(commentTexts),
      });
    }
  }

  const { error: likesError } = await supabase
    .from('likes')
    .insert(likes);

  if (likesError) {
    console.error('❌ Error creating likes:', likesError);
  } else {
    console.log(`✅ Created ${likes.length} likes`);
  }

  const { error: commentsError } = await supabase
    .from('comments')
    .insert(comments);

  if (commentsError) {
    console.error('❌ Error creating comments:', commentsError);
  } else {
    console.log(`✅ Created ${comments.length} comments`);
  }
}

export async function generateAllMockData() {
  console.log('🚀 Starting mock data generation...');
  console.log('================================================');
  
  try {
    await generateMockUsers(100);
    await generateMockPosts(150);
    await generateMockOpportunities(100);
    await generateMockInteractions();
    
    console.log('================================================');
    console.log('✅ Mock data generation complete!');
    console.log('📊 Summary:');
    console.log('   - Users: 100');
    console.log('   - Posts: 150');
    console.log('   - Opportunities: 100');
    console.log('   - Interactions: Generated');
  } catch (error) {
    console.error('❌ Error during mock data generation:', error);
    throw error;
  }
}
