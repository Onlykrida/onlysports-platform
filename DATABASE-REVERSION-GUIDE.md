# OnlySports Database Reversion Guide

## 🎯 Goal
Revert your OnlySports database to the clean stable version defined in `supabase-ultimate-clean-setup.sql`

---

## ⚠️ BEFORE YOU START

### Option A: Backup Current Data (Recommended if you want to preserve data)

If you want to export your current data before reverting, run these queries in Supabase SQL Editor:

```sql
-- Export profiles (save the output)
SELECT * FROM public.profiles;

-- Export posts (save the output)
SELECT * FROM public.posts;

-- Export opportunities (save the output)
SELECT * FROM public.opportunities;

-- Export follows (save the output)
SELECT * FROM public.follows;

-- Export likes (save the output)
SELECT * FROM public.likes;

-- Export comments (save the output)
SELECT * FROM public.comments;

-- Export messages (save the output)
SELECT * FROM public.messages;

-- Export notifications (save the output)
SELECT * FROM public.notifications;
```

### Option B: Clean Start (Recommended for fixing issues)

If you want a completely fresh start with sample data only, skip the backup step above.

---

## 📋 STEP-BY-STEP REVERSION PROCESS

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run the Clean Setup Script

1. Open the file `supabase-ultimate-clean-setup.sql` in your code editor
2. Copy the **ENTIRE** contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

**Expected Result:** You should see a success message at the bottom:
```
OnlySports database setup completed successfully! All tables, policies, functions, and triggers have been created.
```

### Step 3: Verify Old Users Are Removed

If you still see old users in your auth users after deleting them:

1. Go to **Authentication** > **Users** in Supabase Dashboard
2. Manually delete any remaining test/old users
3. The profiles table will auto-clean due to CASCADE delete

### Step 4: Verify the Database Structure

Run this verification query in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Output (9 tables):**
- comment_likes
- comments
- follows
- likes
- messages
- notifications
- opportunities
- posts
- profiles

### Step 5: Verify Functions

```sql
-- Check all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected Output (9 functions):**
- create_comment_notification
- create_follow_notification
- create_like_notification
- create_message_notification
- handle_new_user
- update_comment_likes_count
- update_follow_counts
- update_post_comments_count
- update_post_likes_count
- update_posts_count

### Step 6: Verify Triggers

```sql
-- Check all triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

**Expected Output (10 triggers):**
- on_auth_user_created (on auth.users)
- on_comment_change (on comments)
- on_comment_like_change (on comment_likes)
- on_comment_notification (on comments)
- on_follow_change (on follows)
- on_follow_notification (on follows)
- on_like_change (on likes)
- on_like_notification (on likes)
- on_message_notification (on messages)
- on_post_change (on posts)

### Step 7: Verify RLS Policies

```sql
-- Check all RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Output (26 policies):** Each table should have appropriate SELECT, INSERT, UPDATE, DELETE policies.

### Step 8: Test Sample Data

```sql
-- Check sample profiles
SELECT id, name, role, sport FROM public.profiles ORDER BY name;

-- Check sample posts
SELECT id, title, type FROM public.posts ORDER BY created_at DESC;

-- Check sample opportunities
SELECT id, title, type, sport FROM public.opportunities ORDER BY created_at DESC;
```

**Expected Output:**
- 3 sample profiles (Anirudh, Sample Coach, Sample Scout)
- 3 sample posts
- 2 sample opportunities

---

## ✅ VERIFICATION CHECKLIST

After running the script, verify:

### Tables (9 total)
- [ ] profiles
- [ ] posts
- [ ] opportunities
- [ ] follows
- [ ] likes
- [ ] comments
- [ ] comment_likes
- [ ] messages
- [ ] notifications

### Functions (9 total)
- [ ] handle_new_user
- [ ] update_post_likes_count
- [ ] update_post_comments_count
- [ ] update_follow_counts
- [ ] update_posts_count
- [ ] update_comment_likes_count
- [ ] create_like_notification
- [ ] create_follow_notification
- [ ] create_comment_notification
- [ ] create_message_notification

### Triggers (10 total)
- [ ] on_auth_user_created
- [ ] on_like_change
- [ ] on_comment_change
- [ ] on_follow_change
- [ ] on_post_change
- [ ] on_comment_like_change
- [ ] on_like_notification
- [ ] on_follow_notification
- [ ] on_comment_notification
- [ ] on_message_notification

### RLS Enabled
- [ ] All 9 tables have RLS enabled
- [ ] Each table has appropriate policies (check with verification query)

### Sample Data
- [ ] 3 sample profiles created
- [ ] 3 sample posts created
- [ ] 2 sample opportunities created

### Indexes
- [ ] All performance indexes created (16 total)

---

## 🧪 TEST THE APP

After reversion, test these features in your app:

1. **Sign Up**: Create a new account → Profile should auto-create
2. **View Profiles**: Navigate to Discovery page → See sample profiles
3. **View Posts**: Check home feed → See sample posts
4. **Click Profile**: Click on a profile → Should open without errors
5. **Create Post**: Make a new post → Should appear in feed
6. **Like Post**: Like a post → Counter should increment
7. **Follow User**: Follow someone → Follower count should update
8. **Opportunities**: Check opportunities tab → Should see sample opportunities

---

## 🐛 TROUBLESHOOTING

### Issue: "relation 'profiles' does not exist"
**Solution:** The script didn't run completely. Re-run the entire script again.

### Issue: Old users still appear
**Solution:** 
1. Go to Authentication > Users in Supabase
2. Manually delete all old users
3. Only new signups will create proper profiles

### Issue: Functions not working
**Solution:** Check if triggers are active using Step 6 verification query.

### Issue: Can't create posts/opportunities
**Solution:** Verify RLS policies exist using Step 7 verification query.

### Issue: Sample data not appearing
**Solution:** The INSERT statements at the end may have failed. Check auth.users table - if those UUIDs don't exist in auth.users, the inserts will fail. This is expected and okay - sample data is optional.

---

## 🔄 RE-IMPORTING YOUR BACKED UP DATA

If you backed up data in "Before You Start" section:

**⚠️ WARNING:** Only do this if your backed-up data matches the new schema exactly.

```sql
-- Example: Re-import backed up posts
-- (Adjust columns to match your backup)
INSERT INTO public.posts (id, user_id, title, description, type, video_url, image_url, likes_count, comments_count, views_count, created_at)
VALUES 
  ('your-uuid', 'user-uuid', 'Title', 'Description', 'highlight', null, 'url', 0, 0, 0, now());

-- Repeat for each backed up record
```

---

## 📞 NEED HELP?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify each step was completed
3. Check browser console for frontend errors
4. Check Supabase logs for backend errors

---

## ✨ SUCCESS!

Once all checks pass, your database is reverted to the clean stable version!

Your app should now:
- Load profiles without errors
- Display sample data
- Allow new user signups with auto-profile creation
- Handle likes, follows, comments, and messages properly
- Show opportunities in the opportunities tab
