# Quick Start: Mock Data Testing

## Step 1: Add Database Field (One-time setup)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Open SQL Editor
3. Copy and run the SQL from `supabase-add-is-mock-field.sql`

## Step 2: Access Mock Data Screen
Navigate to: `/mock-data-test` in your app

## Step 3: Generate Data
Click "🚀 Generate All" button to create:
- 100 mock users
- 150 mock posts  
- 100 mock opportunities
- Follows, likes, and comments

## Step 4: Test Your App
Refresh your app to see the mock data in:
- Home feed
- Discover page
- Opportunities page
- User profiles

## Step 5: Clean Up
When done, click "🗑️ Delete All Mock Data" to remove everything

---

## Quick Commands

### Generate everything:
```tsx
import { generateAllMockData } from '@/scripts/generate-mock-data';
await generateAllMockData();
```

### Clean everything:
```tsx
import { cleanupMockData } from '@/scripts/cleanup-mock-data';
await cleanupMockData();
```

### Filter out mock data:
```tsx
// In your queries
.eq('is_mock', false)  // Exclude mock data
```

---

## Files Created

1. **scripts/generate-mock-data.ts** - Data generation functions
2. **scripts/cleanup-mock-data.ts** - Cleanup functions  
3. **scripts/test-with-mock-data.tsx** - UI component for testing
4. **app/mock-data-test.tsx** - Test screen route
5. **supabase-add-is-mock-field.sql** - Database migration
6. **MOCK_DATA_GUIDE.md** - Complete documentation

---

## Notes

- All mock users have `@mockdata.test` emails
- All data is tagged with `is_mock: true`
- Cleanup is permanent - use carefully!
- Takes 30-60 seconds to generate all data
- Refresh app after generating data
