# Scout Interests & Profile Views — Complete Implementation Guide

## 🎯 Overview

Your OnlySports app now has two powerful features to track user engagement:

1. **Scouts & Coaches Interested** — Shows athletes which scouts/coaches have marked them as "Interested"
2. **Profile Views (Viewed By)** — Shows users who viewed their profile

---

## 🗄️ Database Setup

### Step 1: Run the SQL Fix

Run this SQL file in your Supabase SQL Editor:

```
supabase-fix-scout-interests-policies.sql
```

This will:
- ✅ Create `scout_interests` table
- ✅ Create `profile_views` table
- ✅ Fix all policy conflicts
- ✅ Create necessary functions and triggers
- ✅ Set up proper indexes for performance

### Step 2: Verify Tables

After running the SQL, verify these tables exist in your Supabase dashboard:

1. `scout_interests` — Stores interest actions (view, bookmark, request, interested)
2. `profile_views` — Stores profile view records

---

## 📱 Features Implemented

### 1️⃣ Scouts & Coaches Interested Card

**Location:** Profile pages (both own profile & user profiles)

**For Athletes:**
- Shows list of scouts/coaches who marked them as "Interested"
- Displays scout name, organization, avatar, and actions taken
- Shows count badge
- Actions include: 👁️ Viewed, ⭐ Bookmarked, 📩 Requested, ❤️ Interested

**For Scouts/Coaches:**
- Can mark athletes as "Interested" with a button
- Button toggles between "Mark as Interested" and "Interested ❤️"
- Shows helpful hint text

**Component:** `components/ScoutInterestsCard.tsx`

**Usage:**
```tsx
<ScoutInterestsCard 
  userId={profileUser.id} 
  isOwnProfile={isOwnProfile} 
/>
```

---

### 2️⃣ Profile Views Card

**Location:** Profile pages (only visible on own profile)

**Features:**
- Shows latest 20 users who viewed the profile
- Displays viewer name, role, avatar, and timestamp
- Shows "time ago" format (e.g., "2h ago", "3d ago")
- Shows total unique viewer count in badge
- Shows view count per viewer (if multiple views)

**Component:** `components/ProfileViewersCard.tsx`

**Usage:**
```tsx
<ProfileViewersCard 
  userId={user.id} 
  isOwnProfile={true} 
/>
```

---

### 3️⃣ "Interested" Button

**Location:** User profile page (`app/user/[id].tsx`)

**Visibility:** Only shows when:
- Viewing another user's profile (not own profile)
- Current user is a Scout or Coach
- Profile being viewed is an Athlete

**Behavior:**
- Click to toggle interest status
- Shows loading state while processing
- Updates immediately
- Stores action in `scout_interests` table with action_type = 'interested'

---

### 4️⃣ Automatic Profile View Tracking

**Location:** User profile page (`app/user/[id].tsx`)

**Behavior:**
- Automatically tracks when someone views a profile
- Only tracks if viewer is not the profile owner
- Prevents duplicate views on same day (one per day per viewer)
- Runs silently in background

---

## 🔧 How It Works

### Scout Interests Flow

1. **Scout/Coach visits athlete profile**
   - Profile view is automatically tracked via `track_profile_view()`
   - Also stores in `scout_interests` table with action_type = 'view'

2. **Scout/Coach clicks "Mark as Interested" button**
   - Calls `trackInterested(athleteId)`
   - Stores record in `scout_interests` with action_type = 'interested'
   - Button changes to "Interested ❤️"

3. **Athlete views their own profile**
   - `ScoutInterestsCard` loads and displays all scouts who marked interest
   - Shows aggregated actions (view, bookmark, request, interested)
   - Shows latest 10 scouts, ordered by last interaction

### Profile Views Flow

1. **User A visits User B's profile**
   - Automatically calls `track_profile_view(profileId, viewerId)`
   - Record is inserted into `profile_views` table
   - Deduplication: One view per viewer per day

2. **User B views their own profile**
   - `ProfileViewersCard` loads and displays viewers
   - Shows latest 20 viewers with "time ago" timestamps
   - Badge shows total unique viewer count
   - Each viewer card shows how many times they viewed

---

## 🗂️ Database Schema

### `scout_interests` Table

```sql
CREATE TABLE scout_interests (
  id UUID PRIMARY KEY,
  scout_id UUID NOT NULL,           -- Scout or Coach
  athlete_id UUID NOT NULL,         -- Athlete being viewed
  action_type TEXT NOT NULL,        -- 'view', 'bookmark', 'request', 'interested'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  UNIQUE(scout_id, athlete_id, action_type)
);
```

### `profile_views` Table

```sql
CREATE TABLE profile_views (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL,         -- Profile being viewed
  viewer_id UUID NOT NULL,          -- Who viewed it
  created_at TIMESTAMPTZ,
  
  UNIQUE(profile_id, viewer_id, created_at::DATE)
);
```

---

## 📊 Database Functions

### `get_interested_scouts_for_athlete(athlete_id, limit)`

Returns scouts/coaches who showed interest in an athlete.

**Returns:**
```sql
{
  scout_id,
  scout_name,
  scout_avatar,
  scout_organization,
  last_interaction,
  actions[]  -- Array of action types
}
```

### `track_scout_interest(scout_id, athlete_id, action_type)`

Records a scout interest action. Uses UPSERT to prevent duplicates.

### `get_profile_viewers(profile_id, limit)`

Returns users who viewed a profile.

**Returns:**
```sql
{
  viewer_id,
  viewer_name,
  viewer_avatar,
  viewer_role,
  last_viewed,
  view_count
}
```

### `track_profile_view(profile_id, viewer_id)`

Records a profile view. Automatically prevents:
- Self-views (viewer = profile owner)
- Duplicate views on same day

### `get_profile_views_count(profile_id)`

Returns total unique viewer count for a profile.

---

## 🔐 Row Level Security (RLS)

### Scout Interests Policies

✅ **Read:** Users can view interests if they are the scout OR the athlete  
✅ **Insert:** Only scouts/coaches can create interest records for themselves  
✅ **Update:** Scouts/coaches can only update their own interests  
✅ **Delete:** Scouts/coaches can only delete their own interests  

### Profile Views Policies

✅ **Read:** Users can only see who viewed THEIR profile  
✅ **Insert:** Authenticated users can record views for others (not self)  

---

## 🚀 API Usage (React Native)

### Track Interest

```typescript
import { useScouting } from '@/hooks/scouting-context';

const { trackInterested, isInterested, removeInterest } = useScouting();

// Check if already interested
const interested = await isInterested(athleteId);

// Mark as interested
await trackInterested(athleteId);

// Remove interest
await removeInterest(athleteId);
```

### Get Interested Scouts

```typescript
const { getInterestedScoutsForAthlete } = useScouting();

const scouts = await getInterestedScoutsForAthlete(athleteId);
// Returns: { scout_id, scout_name, scout_avatar, scout_organization, actions[] }[]
```

### Track Profile View (Automatic)

Profile views are tracked automatically when viewing a user profile. No manual call needed.

---

## 📲 UI Components

### ScoutInterestsCard

Shows scouts/coaches interested in an athlete.

**Props:**
- `userId: string` — The athlete's user ID
- `isOwnProfile?: boolean` — Whether viewing own profile

**Displays:**
- Card header with heart icon
- Count badge showing number of interested scouts
- List of scouts with avatar, name, organization
- Action badges showing what they did (view, bookmark, interested)
- Empty state if no scouts
- Loading state while fetching

### ProfileViewersCard

Shows who viewed a profile.

**Props:**
- `userId: string` — The profile owner's user ID
- `isOwnProfile?: boolean` — Whether viewing own profile (only shows if true)

**Displays:**
- Card header with eye icon
- Count badge showing total views
- List of viewers with avatar, name, role
- "Time ago" timestamps
- View count per viewer
- Empty state if no views
- Loading state while fetching

---

## 🎨 Design

- **Clean cards** with rounded corners and subtle borders
- **Badge indicators** showing counts
- **Time ago** formatting for timestamps
- **Avatar images** with role-based border colors
- **Action badges** with emojis and color coding
- **Empty states** with helpful messages
- **Loading states** with spinners

---

## ⚡ Performance Optimizations

✅ **Database Indexes** — Fast queries on athlete_id, scout_id, profile_id  
✅ **Unique Constraints** — Prevent duplicate records  
✅ **Date-based Deduplication** — One profile view per day per viewer  
✅ **Batch Loading** — Load multiple records in single query  
✅ **Caching** — Client-side state management  
✅ **Limit Queries** — Fetch only recent/relevant records  

---

## 🧪 Testing

### Test Scout Interests

1. **Create a Scout account** and an Athlete account
2. **Login as Scout**
3. **Visit athlete profile**
4. **Click "Mark as Interested" button**
5. **Login as Athlete**
6. **View own profile**
7. **Verify scout appears in "Scouts & Coaches Interested" card**

### Test Profile Views

1. **Create two accounts** (any roles)
2. **Login as User A**
3. **Visit User B's profile**
4. **Login as User B**
5. **View own profile**
6. **Verify User A appears in "Profile Views" card**

---

## 🐛 Troubleshooting

### "Policy already exists" error

**Solution:** Run `supabase-fix-scout-interests-policies.sql` — it drops all existing policies first.

### No scouts showing in card

**Possible causes:**
- Scout hasn't clicked "Interested" button
- Database not configured
- RLS policies blocking access

**Solution:**
- Verify SQL was run
- Check Supabase logs
- Test with different user roles

### Profile views not recording

**Possible causes:**
- Viewing own profile (prevented by design)
- Already viewed today (one per day limit)
- Database function error

**Solution:**
- View from different account
- Check Supabase function logs
- Verify `profile_views` table exists

---

## 📈 Future Enhancements

Potential improvements you could add:

- 🔔 Push notifications when scout marks interest
- 📊 Analytics dashboard for scouts
- 🔍 Filter scouts by organization or region
- 💬 Direct message button on interest cards
- ⭐ Scout ratings/reviews
- 📅 Track interest over time (graphs)
- 🏆 "Most viewed athlete" leaderboard
- 🔔 Weekly summary of profile views

---

## ✅ Summary

You now have a complete implementation of:

1. ✅ **Scout/Coach interest tracking** with toggle button
2. ✅ **Profile view tracking** with automatic recording
3. ✅ **Two beautiful UI cards** showing interests and views
4. ✅ **Complete database schema** with RLS and indexes
5. ✅ **Production-ready code** with error handling
6. ✅ **Performance optimizations** for scale

**Next steps:**
1. Run the SQL file in Supabase
2. Test with different user roles
3. Verify cards appear on profiles
4. Monitor usage and performance

---

## 🤝 Support

If you encounter issues:

1. Check Supabase logs for errors
2. Verify tables exist in Supabase dashboard
3. Test RLS policies with different users
4. Review console logs in app for errors

---

**Enjoy your new engagement tracking features! 🎉**
