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
const SEED_TAG = process.env.SEED_TAG || 'onlykrida-seed';
const TOTAL_USERS = Number(process.env.SEED_TOTAL_USERS || 50);

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

const firstNames: string[] = ['Alex','Jordan','Taylor','Casey','Riley','Morgan','Parker','Quinn','Reese','Avery','Jamie','Cameron','Drew','Elliot','Harper','Kai','Logan','Mason','Noah','Owen','Peyton','Rowan','Sawyer','Skyler','Sage'];
const lastNames: string[] = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Martinez','Lopez','Wilson','Anderson','Thomas','Jackson','White','Harris','Clark','Lewis','Robinson','Walker'];
const bios: string[] = [
  'Passionate about sports and continuous improvement.',
  'Always hustling on and off the field.',
  'Team player with a growth mindset.',
  'Lover of data-driven training.',
  'Chasing dreams one rep at a time.',
  'Here to discover and develop talent.',
  'Let the work speak for itself.',
];
const sports: string[] = ['football','basketball','soccer','tennis','track','swimming','volleyball'];
const positions: Record<string,string[]> = {
  football: ['QB','WR','RB','LB','CB','S','DL'],
  basketball: ['PG','SG','SF','PF','C'],
  soccer: ['GK','DF','MF','FW'],
  tennis: ['Singles','Doubles'],
  track: ['Sprinter','Mid-distance','Long-distance','Hurdles','Field'],
  swimming: ['Freestyle','Backstroke','Breaststroke','Butterfly','IM'],
  volleyball: ['Setter','Outside','Middle','Opposite','Libero'],
};
const oppTypes = ['tryout','tournament','sponsorship','scholarship'] as const;

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
  const counts = { athlete: 28, scout: 11, coach: 11 };
  for (let i=0;i<counts.athlete;i++) categories.push('athlete');
  for (let i=0;i<counts.scout;i++) categories.push('scout');
  for (let i=0;i<counts.coach;i++) categories.push('coach');
  while (categories.length < env.total) categories.push('athlete');

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
  for (const u of users) {
    const count = randomInt(1,3);
    for (let j=0;j<count;j++) {
      const withImage = Math.random() > 0.4;
      let imageUrl: string | null = null;
      if (withImage) imageUrl = await uploadImage(admin, u.id, j);
      postsRows.push({
        user_id: u.id,
        title: withImage ? `${u.sport} ${u.position} highlights` : `${u.sport} training log`,
        description: withImage ? `Game day recap by @${u.username}` : `Focused session on ${u.sport}.`,
        type: withImage ? 'highlight' : 'training',
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
    const sample = [...staff].sort(() => 0.5 - Math.random()).slice(0, randomInt(2,4));
    for (const s of sample) {
      followRows.push({ follower_id: a.id, following_id: s.id });
      if (Math.random() > 0.5) followRows.push({ follower_id: s.id, following_id: a.id });
    }
  }

  if (followRows.length) {
    const { error: folErr } = await admin.from('follows').insert(followRows);
    if (folErr) console.error('follows insert error', folErr.message);
  }

  console.log('seed:done', { users: users.length, posts: postsRows.length, opportunities: oppRows.length, follows: followRows.length });
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
