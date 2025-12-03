# Mock Data Testing - Quick Fix Summary

## ✅ Problem Solved

The **"new row violates row-level security policy for table 'profiles'"** error has been fixed.

### What Was the Issue?

The mock data generation was trying to insert data using the regular Supabase client (anon key), which is restricted by Row-Level Security (RLS) policies. Since we're creating profiles without authentication, RLS was blocking the inserts.

### The Solution

Created a separate Supabase **admin client** that uses the **service role key**, which bypasses RLS policies. This is safe for development/testing purposes.

---

## 🚀 Quick Setup (3 Steps)

### 1. Get Service Role Key

Go to [Supabase Dashboard](https://supabase.com/dashboard):
- **Settings** → **API** → **service_role** key
- Copy the key (click eye icon to reveal)

### 2. Add to `.env` File

Create `.env` in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Restart Dev Server

After adding the key, **restart your Expo dev server**.

---

## 📱 Using Mock Data

### Generate Data

1. Navigate to `/mock-data-test` in your app
2. Click **"🚀 Generate All"**
3. Wait for completion (~30-60 seconds)

**Creates:**
- 100 users (athletes, coaches, scouts, teams)
- 150 posts (images + videos)
- 100 opportunities
- Interactions (follows, likes, comments)

### Clean Up Data

1. Navigate to `/mock-data-test`
2. Click **"🗑️ Delete All Mock Data"**
3. Confirm

⚠️ **Permanent deletion** - cannot be undone!

---

## 📚 Full Documentation

- **MOCK_DATA_COMPLETE_GUIDE.md** - Complete guide with troubleshooting
- **MOCK_DATA_SETUP.md** - Detailed setup instructions
- **MOCK_DATA_QUICKSTART.md** - Quick reference

---

## 🔒 Security Notes

**The service role key:**
- ⚠️ Bypasses ALL security policies
- ⚠️ Should NEVER be in production
- ⚠️ Should NEVER be committed to git (it's in `.gitignore`)
- ✅ Only use for development/testing

---

## 🐛 If It Still Doesn't Work

1. **Check the key**: Make sure you copied the **service_role** key, not the anon key
2. **Check the file**: Ensure `.env` is in the **project root**, not in a subfolder
3. **Restart**: You MUST restart the dev server after adding environment variables
4. **Check console**: Look for the log "✅ Supabase admin client initialized successfully"

If you see "⚠️ Service role key not found", the key is not loaded properly.

---

## 🎯 Key Changes Made

### Files Modified:
1. ✅ `constants/supabase.ts` - Added admin client with service role key
2. ✅ `scripts/generate-mock-data.ts` - Now uses admin client
3. ✅ `scripts/cleanup-mock-data.ts` - Now uses admin client

### Files Created:
1. ✅ `.env.example` - Template for environment variables
2. ✅ `.gitignore` - Protects `.env` from being committed
3. ✅ `MOCK_DATA_COMPLETE_GUIDE.md` - Complete documentation
4. ✅ `MOCK_DATA_SETUP.md` - Detailed setup guide
5. ✅ This README!

---

## ✨ You're All Set!

The error is fixed. Just add your service role key to `.env`, restart, and you're ready to generate mock data! 🎉
