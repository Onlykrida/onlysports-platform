import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  // Create waitlist table via SQL
  const { error } = await admin.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS waitlist (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow anonymous inserts" ON waitlist FOR INSERT WITH CHECK (true);
      CREATE POLICY "Allow service role reads" ON waitlist FOR SELECT USING (true);
    `,
  });

  if (error) {
    console.log('RPC not available, trying direct SQL via REST...');
    // Try using the Supabase SQL endpoint
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        sql: `CREATE TABLE IF NOT EXISTS waitlist (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ DEFAULT now());`,
      }),
    });
    console.log('Response:', res.status, await res.text());
    console.log(
      '\nYou may need to create the waitlist table manually in the Supabase dashboard SQL editor:',
    );
    console.log(`
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated reads" ON waitlist FOR SELECT USING (auth.role() = 'service_role');
    `);
  } else {
    console.log('Waitlist table created successfully!');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
