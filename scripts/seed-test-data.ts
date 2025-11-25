import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type Category = 'athlete' | 'scout' | 'coach';

type Env = {
  url: string;
  serviceRole: string;
  seedTag: string;
  total: number;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SEED_TAG = process.env.SEED_TAG || 'onlysports-seed';
const TOTAL_USERS = Number(process.env.SEED_TOTAL_USERS || 100);

const IMAGE_SOURCES: string[] = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1593349481020-5b884d931783?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517649414583-7dff02b23dfd?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521417531039-9601a4fdc08e?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527224857830-43a7acc852c6?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517646630340-8e5f57bcd0d8?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521417531513-5f7f18b874f8?q=80&w=1600&auto=format&fit=crop',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

const firstNames: string[] = ['Alex','Jordan','Taylor','Casey','Riley','Morgan','Parker','Quinn','Reese','Avery','Jamie','Cameron','Drew','Elliot','Harper','Kai','Logan','Mason','Noah','Owen','Peyton','Rowan','Sawyer','Skyler','Sage','Blake','Charlie','Dakota','Eden','Finley','Gray','Hayden','Indigo','Jules','Kennedy','Lane','Marley','North','Ocean','Phoenix','River','Scout','Shiloh','Taylor','Unity','Wyatt'];
const lastNames: string[] = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Martinez','Lopez','Wilson','Anderson','Thomas','Jackson','White','Harris','Clark','Lewis','Robinson','Walker','Lee','Kim','Patel','Chen','Silva','Kumar','Rodriguez','Nguyen','Thompson','Moore','Taylor','Martin','Young','Allen','King','Wright','Scott','Green','Adams','Baker'];
const bios: string[] = [
  'Passionate about sports and continuous improvement.',
  'Always hustling on and off the field.',
  'Team player with a growth mindset.',
  'Lover of data-driven training.',
  'Chasing dreams one rep at a time.',
  'Here to discover and develop talent.',
  'Let the work speak for itself.',
  'Elite performance is built in the details.',
  'Committed to excellence every single day.',
  'Train hard, compete harder.',
  'Building champions one day at a time.',
  'Focused on finding the next generation of talent.',
  'Performance analytics enthusiast.',
  'Dedicated to the craft and the grind.',
  'Professional mindset, amateur heart.',
  'Believer in hard work and smart training.',
  'Creating opportunities for rising stars.',
  'Every setback is a setup for a comeback.',
];
const sports: string[] = ['football','basketball','soccer','tennis','track','swimming','volleyball','baseball','hockey','rugby','cricket','golf','martial arts'];
const positions: Record<string,string[]> = {
  football: ['QB','WR','RB','LB','CB','S','DL','TE','OL','K'],
  basketball: ['PG','SG','SF','PF','C'],
  soccer: ['GK','DF','MF','FW'],
  tennis: ['Singles','Doubles'],
  track: ['Sprinter','Mid-distance','Long-distance','Hurdles','Field'],
  swimming: ['Freestyle','Backstroke','Breaststroke','Butterfly','IM'],
  volleyball: ['Setter','Outside','Middle','Opposite','Libero'],
  baseball: ['P','C','1B','2B','3B','SS','OF'],
  hockey: ['C','W','D','G'],
  rugby: ['Prop','Hooker','Lock','Flanker','Back'],
  cricket: ['Batsman','Bowler','All-rounder','Wicket-keeper'],
  golf: ['Professional','Amateur'],
  'martial arts': ['Striker','Grappler','All-around'],
};
const oppTypes = ['tryout','tournament','sponsorship','scholarship'] as const;
const postContents: string[] = [
  'Great training session today! Feeling stronger every day 💪',
  'Game day highlights from last night. What a match!',
  'Breaking down film from this week. Always learning.',
  'Recovery day is just as important as training day.',
  'Proud of the team\'s performance this season!',
  'New personal record! Hard work pays off.',
  'Focused on fundamentals today. Back to basics.',
  'Amazing atmosphere at today\'s game. Thank you fans!',
  'Training camp update: Week 2 complete.',
  'Big thanks to my coaches for pushing me to be better.',
  'Competition brings out the best in all of us.',
  'Excited to announce a new partnership!',
  'Behind the scenes of our training routine.',
  'Scouts in the building today. Time to shine!',
  'Team bonding session. Chemistry matters.',
  'Working on my weaknesses to make them strengths.',
  'Game film breakdown: What we did right and wrong.',
  'Recruiting update: Looking for dedicated athletes.',
  'Tournament prep is in full swing.',
  'Grateful for every opportunity to compete.',
];

function getEnv(): Env {
  return {
    url: SUPABASE_URL,
    serviceRole: SERVICE_ROLE_KEY,
    seedTag: SEED_TAG,
    total: TOTAL_USERS,
  };
}

async function ensureBucket(client: SupabaseClient, name: string) {
  const { data: list, error: listErr } = await client.storage.listBuckets();
  if (listErr) throw listErr;
  const exists = (list ?? []).some((b: any) => b.name === name);
  if (!exists) {
    const { error } = await client.storage.createBucket(name, { public: true });
    if (error) throw error;
  }
}

async function uploadImage(client: SupabaseClient, userId: string, index: number): Promise<string | null> {
  try {
    const src = pick(IMAGE_SOURCES);
    const res = await fetch(src);
    const buf = Buffer.from(await res.arrayBuffer());
    const path = `posts/${userId}/${Date.now()}_${index}.jpg`;
    const { error } = await client.storage.from('posts').upload(path, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) {
      console.error('upload error', error.message);
      return null;
    }
    const { data: pub } = client.storage.from('posts').getPublicUrl(path);
    return pub.publicUrl ?? null;
  } catch (e: any) {
    console.error('upload exception', e?.message ?? String(e));
    return null;
  }
}

function genEmail(username: string) { return `${username}@example.test`; }
function slugify(input: string) { return input.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,16); }

async function seed() {
  const env = getEnv();
  console.log('seed:start', env);
  if (!env.url || !env.serviceRole) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const admin = createClient(env.url, env.serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

  await ensureBucket(admin, 'posts');

  const categories: Category[] = [];
  const athleteCount = Math.floor(env.total * 0.60);
  const scoutCount = Math.floor(env.total * 0.20);
  const coachCount = env.total - athleteCount - scoutCount;
  
  for (let i=0;i<athleteCount;i++) categories.push('athlete');
  for (let i=0;i<scoutCount;i++) categories.push('scout');
  for (let i=0;i<coachCount;i++) categories.push('coach');

  const users: { id: string; email: string; full_name: string; username: string; category: Category; sport: string; position: string }[] = [];

  for (let i=0;i<env.total;i++) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    const full = `${fn} ${ln}`;
    const base = slugify(`${fn}${ln}${randomInt(10,99)}`);
    const username = `${base}`;
    const email = genEmail(username);
    const category = categories[i];
    const sport = pick(sports);
    const pos = pick(positions[sport]);
    const password = 'Password123!';

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full, category, sport, position: pos, seed: true, seed_tag: env.seedTag },
    });
    if (createErr) {
      console.error('createUser error', email, createErr.message);
      continue;
    }
    const userId = created.user?.id ?? randomUUID();
    users.push({ id: userId, email, full_name: full, username, category, sport, position: pos });
  }

  const profileRows = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.full_name,
    role: u.category,
    avatar: null as unknown as string | undefined,
    bio: pick(bios),
    location: 'Global',
    verified: Math.random() > 0.85,
    sport: u.sport,
    position: u.position,
    achievements: [],
    stats: {},
  }));

  if (profileRows.length) {
    const { error: profileErr } = await admin.from('profiles').upsert(profileRows, { onConflict: 'id' });
    if (profileErr) console.error('profiles upsert error', profileErr.message);
  }

  const postsRows: any[] = [];
  const postTypes: ('highlight' | 'training' | 'match' | 'achievement')[] = ['highlight', 'training', 'match', 'achievement'];
  
  for (const u of users) {
    const count = randomInt(2, 8);
    for (let j=0;j<count;j++) {
      const withImage = Math.random() > 0.35;
      let imageUrl: string | null = null;
      if (withImage) imageUrl = await uploadImage(admin, u.id, j);
      
      const type = pick(postTypes);
      const content = pick(postContents);
      
      postsRows.push({
        user_id: u.id,
        title: `${u.sport} - ${type}`,
        description: content.replace('@username', `@${u.username}`),
        type,
        image_url: imageUrl,
        video_url: null,
      });
    }
  }

  if (postsRows.length) {
    const { error: postsErr } = await admin.from('posts').insert(postsRows);
    if (postsErr) console.error('posts insert error', postsErr.message);
  }

  const oppRows: any[] = [];
  for (const u of users.filter(x => x.category !== 'athlete')) {
    const count = Math.random() > 0.6 ? 2 : 1;
    for (let k=0;k<count;k++) {
      const type = pick([...oppTypes]);
      const deadline = new Date(Date.now() + randomInt(7,60) * 24 * 3600 * 1000).toISOString();
      oppRows.push({
        team_id: u.id,
        title: `${u.sport} ${type} opportunity`,
        description: `Open ${type} for ${u.sport}. Apply now.`,
        type,
        sport: u.sport,
        location: 'Online / On-site',
        deadline,
        requirements: ['Committed attitude','Recent highlights','Coach reference'],
      });
    }
  }

  if (oppRows.length) {
    const { error: oppErr } = await admin.from('opportunities').insert(oppRows);
    if (oppErr) console.error('opportunities insert error', oppErr.message);
  }

  const athletes = users.filter(u => u.category === 'athlete');
  const staff = users.filter(u => u.category !== 'athlete');
  const followRows: any[] = [];
  
  for (const a of athletes) {
    const staffSample = [...staff].sort(() => 0.5 - Math.random()).slice(0, randomInt(3,8));
    for (const s of staffSample) {
      followRows.push({ follower_id: a.id, following_id: s.id });
      if (Math.random() > 0.4) followRows.push({ follower_id: s.id, following_id: a.id });
    }
    
    const athleteSample = athletes.filter(x => x.id !== a.id).sort(() => 0.5 - Math.random()).slice(0, randomInt(5,15));
    for (const other of athleteSample) {
      followRows.push({ follower_id: a.id, following_id: other.id });
    }
  }
  
  for (const s of staff) {
    const athleteSample = athletes.sort(() => 0.5 - Math.random()).slice(0, randomInt(10,30));
    for (const a of athleteSample) {
      followRows.push({ follower_id: s.id, following_id: a.id });
    }
  }

  const uniqueFollows = Array.from(
    new Map(followRows.map(f => [`${f.follower_id}-${f.following_id}`, f])).values()
  );
  
  if (uniqueFollows.length) {
    const { error: folErr } = await admin.from('follows').insert(uniqueFollows);
    if (folErr) console.error('follows insert error', folErr.message);
  }

  const { data: allPosts } = await admin.from('posts').select('id, user_id');
  const likesRows: any[] = [];
  const commentsRows: any[] = [];
  
  if (allPosts && allPosts.length > 0) {
    for (const post of allPosts) {
      const likeCount = randomInt(0, Math.min(30, users.length));
      const likersPool = [...users].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < likeCount && i < likersPool.length; i++) {
        const liker = likersPool[i];
        if (liker.id !== post.user_id || Math.random() > 0.9) {
          likesRows.push({
            user_id: liker.id,
            post_id: post.id,
          });
        }
      }
      
      const commentCount = randomInt(0, Math.min(8, users.length / 3));
      const commentersPool = [...users].sort(() => 0.5 - Math.random());
      const commentTexts = [
        'Great work! Keep it up! 💪',
        'Inspiring performance!',
        'This is what dedication looks like',
        'Amazing! 🔥',
        'Keep grinding!',
        'Incredible talent on display',
        'This is elite level stuff',
        'You make it look easy!',
        'Hard work pays off',
        'Respect! 👏',
        'Can\'t wait to see what\'s next',
        'Outstanding!',
        'That\'s how it\'s done',
        'Pure excellence',
        'So proud of this team',
      ];
      
      for (let i = 0; i < commentCount && i < commentersPool.length; i++) {
        const commenter = commentersPool[i];
        commentsRows.push({
          post_id: post.id,
          user_id: commenter.id,
          content: pick(commentTexts),
        });
      }
    }
  }
  
  if (likesRows.length) {
    const { error: likesErr } = await admin.from('likes').insert(likesRows);
    if (likesErr) console.error('likes insert error', likesErr.message);
  }
  
  if (commentsRows.length) {
    const { error: commentsErr } = await admin.from('comments').insert(commentsRows);
    if (commentsErr) console.error('comments insert error', commentsErr.message);
  }
  
  const { data: allOpportunities } = await admin.from('opportunities').select('id, team_id');
  const applicationsRows: any[] = [];
  
  if (allOpportunities && allOpportunities.length > 0) {
    for (const opp of allOpportunities) {
      const applicantCount = randomInt(5, Math.min(25, athletes.length));
      const applicantsPool = [...athletes].sort(() => 0.5 - Math.random()).slice(0, applicantCount);
      
      for (const applicant of applicantsPool) {
        const weights = [0.6, 0.2, 0.2];
        const rand = Math.random();
        let status: 'pending' | 'accepted' | 'rejected';
        
        if (rand < weights[0]) status = 'pending';
        else if (rand < weights[0] + weights[1]) status = 'accepted';
        else status = 'rejected';
        
        applicationsRows.push({
          opportunity_id: opp.id,
          athlete_id: applicant.id,
          status,
          cover_letter: `I am very interested in this opportunity. My experience in ${applicant.sport} as a ${applicant.position} makes me a great fit.`,
        });
      }
    }
  }
  
  if (applicationsRows.length) {
    const { error: appsErr } = await admin.from('applications').insert(applicationsRows);
    if (appsErr) console.error('applications insert error', appsErr.message);
  }

  console.log('seed:done', { 
    users: users.length, 
    posts: postsRows.length, 
    opportunities: oppRows.length, 
    follows: uniqueFollows.length,
    likes: likesRows.length,
    comments: commentsRows.length,
    applications: applicationsRows.length,
  });
}

async function listSeedUserIds(admin: SupabaseClient, seedTag: string): Promise<{ ids: string[]; emails: string[]; }>{
  const ids: string[] = [];
  const emails: string[] = [];
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = (data?.users ?? []).filter(u => {
      const md: any = u.user_metadata ?? {};
      const seeded = md.seed === true || md.seed_tag === seedTag;
      const emailSeed = (u.email ?? '').endsWith('@example.test');
      return seeded || emailSeed;
    });
    batch.forEach(u => { if (u.id) ids.push(u.id); if (u.email) emails.push(u.email); });
    const count = data?.users?.length ?? 0;
    if (count < perPage) break;
    page += 1;
  }
  return { ids, emails };
}

async function deleteStorageForUsers(client: SupabaseClient, ids: string[]) {
  for (const id of ids) {
    try {
      const list = await client.storage.from('posts').list(`posts/${id}`);
      const files = (list.data ?? []).map((f: any) => `posts/${id}/${f.name}`);
      if (files.length) await client.storage.from('posts').remove(files);
    } catch (e: any) {
      console.error('storage cleanup error', id, e?.message ?? String(e));
    }
  }
}

async function cleanup() {
  const env = getEnv();
  console.log('cleanup:start', { url: env.url, seedTag: env.seedTag });
  if (!env.url || !env.serviceRole) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const admin = createClient(env.url, env.serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

  const { ids, emails } = await listSeedUserIds(admin, env.seedTag);
  console.log('cleanup:users-found', { count: ids.length });
  if (!ids.length) {
    console.log('No seed users found');
    return;
  }

  await deleteStorageForUsers(admin, ids);

  const chunk = <T,>(arr: T[], size: number) => arr.reduce<T[][]>((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

  for (const group of chunk(ids, 1000)) {
    await admin.from('comments').delete().in('user_id', group);
    await admin.from('likes').delete().in('user_id', group);
    await admin.from('messages').delete().or(`sender_id.in.(${group.join(',')}),receiver_id.in.(${group.join(',')})`);
    await admin.from('notifications').delete().in('user_id', group);
    await admin.from('applications').delete().in('athlete_id', group);
    await admin.from('posts').delete().in('user_id', group);
    await admin.from('opportunities').delete().in('team_id', group);
    await admin.from('follows').delete().or(`follower_id.in.(${group.join(',')}),following_id.in.(${group.join(',')})`);
    await admin.from('profiles').delete().in('id', group);
  }

  for (const id of ids) {
    try {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) console.error('deleteUser error', id, error.message);
    } catch (e: any) {
      console.error('deleteUser exception', id, e?.message ?? String(e));
    }
  }

  console.log('cleanup:done', { usersDeleted: ids.length, emailsSample: emails.slice(0,3) });
}

async function main() {
  const argv = process.argv.slice(2);
  const isCleanup = argv.includes('--cleanup');
  const isSeed = !isCleanup;
  if (isSeed) {
    await seed();
  } else {
    await cleanup();
  }
}

main().catch((e) => { console.error('fatal', e?.message ?? String(e)); process.exit(1); });
