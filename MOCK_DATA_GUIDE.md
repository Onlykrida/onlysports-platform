# Mock Data Generation Guide

This guide explains how to generate and manage mock data for testing the OnlySports app.

## Overview

The mock data system allows you to:
- Generate 100 mock users (athletes, coaches, scouts, trainers, teams)
- Generate 150 mock posts with images and videos
- Generate 100 mock opportunities
- Generate interactions (follows, likes, comments)
- Easily clean up all mock data

## Quick Start

### 1. Add `is_mock` field to database

First, run the SQL migration to add the `is_mock` field to your database tables:

```sql
-- Execute this in your Supabase SQL editor
-- File: supabase-add-is-mock-field.sql
```

Go to your Supabase dashboard:
1. Navigate to SQL Editor
2. Copy the contents of `supabase-add-is-mock-field.sql`
3. Execute the SQL

### 2. Access the Mock Data Testing Screen

Navigate to `/mock-data-test` in your app:

```
http://localhost:8081/mock-data-test
```

Or add a button in your app to navigate:

```tsx
import { router } from 'expo-router';

<Button 
  title="Test with Mock Data" 
  onPress={() => router.push('/mock-data-test')} 
/>
```

### 3. Generate Mock Data

On the Mock Data Testing screen, you can:

1. **Generate All**: Creates 100 users, 150 posts, 100 opportunities, and interactions
2. **Generate Users Only**: Creates just the mock users
3. **Generate Posts Only**: Creates posts (requires users first)
4. **Generate Opportunities Only**: Creates opportunities (requires users first)
5. **Generate Interactions**: Creates follows, likes, and comments

### 4. Clean Up Mock Data

When you're done testing, click **Delete All Mock Data** to remove all mock data from your database.

## Mock Data Details

### Users
- 100 users total
- 60% athletes, 40% other roles (coaches, scouts, trainers, teams)
- Email format: `firstname.lastname.number@mockdata.test`
- Random avatars from Unsplash
- Random bios and locations
- 30% verified users
- All tagged with `is_mock: true`

### Posts
- 150 posts distributed across mock users
- 80% have media (images or videos)
- 40% of media posts have videos
- Random content from predefined templates
- All tagged with `is_mock: true`

### Opportunities
- 100 opportunities
- Created by coaches, scouts, and teams
- Mix of tryouts, tournaments, sponsorships, scholarships, contracts
- 60% paid opportunities
- Random deadlines (7-90 days from now)
- All tagged with `is_mock: true`

### Interactions
- 5-20 follows per user
- 5-50 likes per post
- 0-8 comments per post
- Realistic distribution across users

## Data Cleanup

The cleanup process:
1. Identifies all profiles with `is_mock: true`
2. Deletes all related data:
   - Comments
   - Likes
   - Messages
   - Notifications
   - Applications
   - Posts
   - Opportunities
   - Follows
3. Deletes the mock profiles

**Note**: Cleanup is permanent and cannot be undone!

## Using Mock Data Programmatically

You can also generate mock data programmatically:

```tsx
import { generateAllMockData, cleanupMockData } from '@/scripts/generate-mock-data';

// Generate all mock data
await generateAllMockData();

// Generate specific types
await generateMockUsers(100);
await generateMockPosts(150);
await generateMockOpportunities(100);
await generateMockInteractions();

// Clean up
await cleanupMockData();
```

## Filtering Mock Data

To exclude mock data from your queries:

```tsx
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('is_mock', false); // Exclude mock data

// Or include only mock data
const { data: mockData } = await supabase
  .from('profiles')
  .select('*')
  .eq('is_mock', true); // Only mock data
```

## Best Practices

1. **Always clean up**: Remove mock data after testing
2. **Use separate environments**: Generate mock data in development, not production
3. **Refresh after generation**: Restart your app or refresh feeds after generating data
4. **Monitor database size**: 100 users with posts can add significant data
5. **Test incrementally**: Start with users, then add posts, then interactions

## Troubleshooting

### "No mock users found" error
- Generate users first before generating posts or opportunities
- Check if `is_mock` field exists in your database

### Posts/Opportunities not showing up
- Refresh your app after generating data
- Check your feed filters to ensure mock data is included
- Verify the data was created in Supabase dashboard

### Cleanup not working
- Check if `is_mock` field is properly indexed
- Verify foreign key constraints aren't blocking deletion
- Check Supabase logs for errors

## Database Schema

The `is_mock` field is added to these tables:
- `profiles` - Marks mock user profiles
- `posts` - Marks mock posts
- `opportunities` - Marks mock opportunities

Related data (likes, comments, follows) is deleted based on foreign keys to these tables.

## Performance Notes

- Generating 100 users + 150 posts takes ~30-60 seconds
- Cleanup takes ~10-20 seconds depending on data volume
- Uses batch operations for efficiency
- Indexes on `is_mock` field for fast queries
