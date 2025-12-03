# Mock Data Testing - Complete Guide

## ✅ Fixed Issues

The RLS (Row-Level Security) policy error has been **fixed**. The mock data generation now uses a Supabase admin client with the service role key, which bypasses RLS policies.

---

## 🚀 Setup Instructions

### 1. Get Service Role Key (Required)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate: **Settings** → **API**
4. Find **service_role** key in "Project API keys"
5. Click the eye icon to reveal and copy it

### 2. Add to Environment Variables

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **IMPORTANT**: 
- Never commit this `.env` file to git (it's in `.gitignore`)
- The service role key bypasses ALL security - keep it secret!

### 3. Restart Dev Server

After adding the service role key, **restart your Expo dev server** to load the environment variable.

### 4. Run Database Migration (One-time)

In Supabase SQL Editor, run `supabase-add-is-mock-field.sql` to add the `is_mock` field to all tables.

---

## 📱 Using the Mock Data Tool

### Generate Data

1. Navigate to `/mock-data-test` in your app
2. Click **"🚀 Generate All"**
3. Wait 30-60 seconds

**What gets created:**
- 100 mock users (athletes, coaches, scouts, teams, trainers)
- 150 mock posts (with images and videos)
- 100 mock opportunities (various categories)
- Mock interactions (follows, likes, comments)

### Test Your App

After generation, refresh your app. Mock data will appear in:
- Home feed
- Discover page  
- Opportunities page
- User profiles
- Messages (if applicable)

### Clean Up Mock Data

1. Navigate to `/mock-data-test`
2. Click **"🗑️ Delete All Mock Data"**
3. Confirm deletion

⚠️ This is **permanent** - all mock data will be deleted!

---

## 🔧 Programmatic Usage

### Generate Data

```typescript
import { generateAllMockData } from '@/scripts/generate-mock-data';

// Generate everything
await generateAllMockData();
```

### Clean Up Data

```typescript
import { cleanupMockData } from '@/scripts/cleanup-mock-data';

// Delete all mock data
await cleanupMockData();
```

### Filter Mock Data in Queries

```typescript
// Exclude mock data (production)
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('is_mock', false);

// Include only mock data (testing)
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('is_mock', true);
```

---

## 🐛 Troubleshooting

### Error: "Admin client not available"

**Cause**: Service role key is missing or not loaded.

**Solution**:
1. Add `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to `.env`
2. Restart the dev server
3. Try again

### Error: "new row violates row-level security policy"

**Cause**: The admin client is not properly configured.

**Solution**:
1. Verify the service role key is correct
2. Make sure the `.env` file is in the project root (not in a subfolder)
3. Restart the dev server
4. Clear the app cache and reload

### Mock Data Not Showing Up

**Cause**: Queries might be filtering out mock data or app needs refresh.

**Solution**:
1. Check your queries don't have `.eq('is_mock', false)`
2. Refresh/restart the app after generating data
3. Check the console for generation errors

### Error: "No mock users found"

**Cause**: Trying to generate posts/opportunities before users.

**Solution**: Always generate users first:
```typescript
await generateMockUsers(100);
await generateMockPosts(150);
await generateMockOpportunities(100);
```

---

## 📚 Documentation Files

- **MOCK_DATA_SETUP.md** - Detailed setup and usage guide
- **MOCK_DATA_QUICKSTART.md** - Quick reference for testing
- **MOCK_DATA_GUIDE.md** - Complete documentation with examples
- **.env.example** - Template for environment variables

---

## 🎯 Key Points

1. ✅ Service role key is **required** for mock data generation
2. ⚠️ Never commit the `.env` file or expose the service role key
3. 🔄 Always restart the dev server after adding environment variables
4. 🗑️ Clean up mock data after testing
5. 🔍 Use `.eq('is_mock', false)` in production queries to exclude test data

---

## 🚨 Security Notes

The service role key:
- **Bypasses all RLS policies**
- **Should NEVER be in production code**
- **Should NEVER be committed to git**
- **Is only for development/testing**

Always keep it in `.env` which is gitignored!

---

## 📝 Summary

You're now ready to:
1. ✅ Generate realistic mock data for testing
2. ✅ Clean up all test data easily
3. ✅ Filter mock vs. real data in queries
4. ✅ Test your app with 100+ users and posts

Happy testing! 🎉
