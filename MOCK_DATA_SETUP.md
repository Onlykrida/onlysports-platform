# Mock Data Setup Guide

## 🔑 Getting Your Supabase Service Role Key

The mock data generation requires a **Service Role Key** to bypass Row-Level Security (RLS) policies when creating test data.

### Step 1: Get Service Role Key from Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** (gear icon in left sidebar)
4. Click **API**
5. Scroll down to **Project API keys** section
6. Find the **service_role** key
7. Click the eye icon to reveal it
8. Copy the key

⚠️ **IMPORTANT**: Never commit this key to git or expose it publicly. It bypasses all RLS policies.

### Step 2: Add to Environment Variables

Create or update your `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Restart Your App

After adding the service role key, restart your development server to load the new environment variable.

---

## 🗄️ Database Setup (One-time)

Before generating mock data, run this SQL in your Supabase SQL Editor:

### Run the Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Open `supabase-add-is-mock-field.sql` from your project
3. Copy and paste the SQL into the editor
4. Click **Run**

This adds the `is_mock` boolean field to all tables, allowing you to filter and delete test data easily.

---

## 🚀 Generating Mock Data

### Method 1: Using the UI

1. Navigate to `/mock-data-test` in your app
2. Click "🚀 Generate All" button
3. Wait 30-60 seconds for completion

### Method 2: Using Code

```typescript
import { generateAllMockData } from '@/scripts/generate-mock-data';

// Generate everything
await generateAllMockData();

// Or generate specific data
import { 
  generateMockUsers,
  generateMockPosts,
  generateMockOpportunities,
  generateMockInteractions
} from '@/scripts/generate-mock-data';

await generateMockUsers(50);
await generateMockPosts(100);
await generateMockOpportunities(50);
await generateMockInteractions();
```

### What Gets Generated

- **100 Mock Users**
  - 60% athletes
  - 40% coaches, scouts, teams, trainers
  - Random sports, positions, stats
  - Realistic avatars from Unsplash

- **150 Mock Posts**
  - Mix of images and videos
  - Various post types (highlights, training, matches, achievements)
  - Distributed across mock users

- **100 Mock Opportunities**
  - Different categories (tryouts, tournaments, sponsorships, etc.)
  - Created by mock coaches, scouts, and teams
  - Realistic deadlines and requirements

- **Mock Interactions**
  - 5-20 follows per user
  - 5-50 likes per post
  - 0-8 comments per post

---

## 🧹 Cleaning Up Mock Data

### Method 1: Using the UI

1. Navigate to `/mock-data-test`
2. Click "🗑️ Delete All Mock Data"
3. Confirm deletion

### Method 2: Using Code

```typescript
import { cleanupMockData, cleanupSpecificMockData } from '@/scripts/cleanup-mock-data';

// Delete all mock data
await cleanupMockData();

// Delete specific types
await cleanupSpecificMockData('posts');
await cleanupSpecificMockData('opportunities');
await cleanupSpecificMockData('users'); // Also deletes all related data
```

### Cleanup Order

The cleanup happens in this order to respect database constraints:
1. Comments
2. Likes
3. Messages
4. Notifications
5. Applications
6. Posts
7. Opportunities
8. Follows
9. Profiles (users)

⚠️ **WARNING**: Cleanup is permanent and cannot be undone!

---

## 🔍 Filtering Mock Data

### Exclude Mock Data from Queries

```typescript
// In your Supabase queries
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('is_mock', false); // Only real data

// Or include only mock data
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('is_mock', true); // Only test data
```

### Identify Mock Users

All mock users have email addresses ending with `@mockdata.test`.

---

## 🐛 Troubleshooting

### Error: "Admin client not available"

**Solution**: Add `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to your `.env` file and restart the dev server.

### Error: "new row violates row-level security policy"

**Solution**: This means the service role key is not properly configured. Double-check:
1. The key is correctly copied from Supabase
2. The `.env` file is in the project root
3. You've restarted the dev server after adding the key

### Error: "No mock users found"

**Solution**: Generate users first before generating posts or opportunities:
```typescript
await generateMockUsers(100);
await generateMockPosts(150);
```

### Mock Data Not Showing Up

**Solution**: 
1. Make sure your queries don't filter by `is_mock: false`
2. Refresh the app after generating data
3. Check the console for generation errors

---

## 📝 Best Practices

1. **Testing**: Generate mock data, test your features, then clean up
2. **Development**: Keep mock data separate with the `is_mock` flag
3. **Production**: Never deploy with mock data or the service role key
4. **Queries**: Default to filtering out mock data in production queries
5. **Cleanup**: Always clean up after testing is complete

---

## 🎯 Quick Commands Reference

```typescript
// Generate all data
import { generateAllMockData } from '@/scripts/generate-mock-data';
await generateAllMockData();

// Clean up all data
import { cleanupMockData } from '@/scripts/cleanup-mock-data';
await cleanupMockData();

// Filter in queries
.eq('is_mock', false)  // Exclude mock
.eq('is_mock', true)   // Only mock
```
