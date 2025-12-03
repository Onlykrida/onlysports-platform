# OnlySports Enhanced Profile System - Implementation Guide

## Overview
This document describes the enhanced profile system implementation for OnlySports, which includes comprehensive role-specific profile schemas for all user types: ATHLETE, COACH, SCOUT, GYM TRAINER, TEAM/CLUB, and FAN.

## What's Included

### 1. Database Schema (`supabase-setup-v2.sql`)
Complete PostgreSQL schema with:
- Enhanced profiles table with role-specific JSONB fields
- Location fields (city, state, country, geo coordinates)
- Profile metadata (completion score, visibility, verification status)
- Automatic profile completion scoring function
- Optimized indexes for performance

**To apply the new schema:**
1. Navigate to your Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase-setup-v2.sql`
4. Execute the script

**Important:** This will DROP and recreate all tables. Backup your data first if needed.

### 2. TypeScript Types (`types/index.ts`)
Comprehensive type definitions including:
- Role-specific data interfaces (AthleteData, CoachData, etc.)
- Supporting types (Certification, HighlightVideo, InjuryRecord, etc.)
- Enhanced User interface with all new fields
- Legacy compatibility maintained

### 3. Validation Schemas (`constants/validation.ts`)
Zod validation schemas for:
- Each role type (athlete, coach, scout, trainer, team, fan)
- Signup flows with role-specific requirements
- Nested data structures
- All using proper Zod syntax

### 4. Profile Completion System (`constants/profile-completion.ts`)
Helper utilities for:
- Calculating profile completion scores (0-100)
- Getting completion messages and colors
- Identifying missing profile fields
- Role-specific scoring logic

## Profile Schema by Role

### ATHLETE
**Core Required:**
- Full name, email, password
- Sport, position
- Bio

**High-Value Optional:**
- Date of birth, gender
- Height (cm), weight (kg)
- Current team
- Preferred foot/dominant hand
- Dominant playing style (tags)
- Achievements list
- Sport-specific stats (JSON)
- Highlight videos (URLs with thumbnails)
- Injury history
- Training frequency
- Career aspirations
- Consent to be contacted by scouts

**Database Field:** `athlete_data` (JSONB)

### COACH
**Required:**
- Full name, email, password
- Sport(s) coached
- Bio

**Optional:**
- Years of experience
- Certifications (with file uploads)
- Availability
- Training programs (structured list)
- Testimonials
- Coaching philosophy
- Team history

**Database Field:** `coach_data` (JSONB)

### SCOUT
**Required:**
- Full name, email, password
- Organization name
- Bio

**Optional:**
- Scouting regions (multi-select)
- Sports interested in (multi-select)
- Age groups recruiting (multi-select)
- Position preferences (multi-select)
- Saved search filters (JSON)
- Preferred contact method
- Athlete levels (high school, college, professional)
- Looking for description

**Database Field:** `scout_data` (JSONB)

### TRAINER / PHYSIO
**Required:**
- Full name, email, password
- Bio

**Optional:**
- Certifications (required with file uploads for pro trainers)
- Specialties
- Services offered
- Pricing packages (list with details)
- Availability calendar
- Facility photos

**Database Field:** `trainer_data` (JSONB)

### TEAM / CLUB
**Required:**
- Full name, email, password
- Bio

**Optional:**
- Organization name
- Organization type
- Sport(s)
- Location
- League
- Founded date
- Home venue
- Roster info (JSON)
- Trials/opportunities list
- Facilities photos
- Admin contacts (name, role, email, phone)

**Database Field:** `team_data` (JSONB)

### FAN
**Required:**
- Full name, email, password

**Optional:**
- Favorite sports
- Favorite teams
- Favorite athletes
- Notification preferences

**Database Field:** `fan_data` (JSONB)

## Global Profile Metadata (All Roles)

### Verification
- `verified` (boolean)
- `verified_at` (timestamp)
- `verified_metadata` (JSONB) - stores verification type, verifier, etc.

### Profile Completion
- `profile_completion_score` (integer 0-100)
- Calculated automatically based on filled fields
- Different weights for different roles

### Visibility Control
- `public_visibility` (enum: 'public', 'scouts-only', 'private')
- **public**: Visible to everyone
- **scouts-only**: Only visible to verified scouts
- **private**: Only visible to connections

### Location
- `location_city` (text)
- `location_state` (text)
- `location_country` (text)
- `location_geo` (point) - lat/lng for geo queries

### Activity Tracking
- `last_active_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Profile Completion Scoring

### Base Score (30 points)
- Name: 5 points
- Bio: 5 points
- Avatar: 5 points
- City: 5 points
- Country: 5 points
- Sport: 5 points

### Role-Specific Score (70 points)
Different roles have different high-value fields:

**Athlete Example:**
- DOB: 10 points
- Height/Weight: 5 points each
- Position: 10 points
- Current Team: 5 points
- Achievements: 10 points
- Highlight Videos: 15 points (highest value!)
- Aspirations: 10 points

**Scout Example:**
- Organization: 20 points (required field, high value)
- Regions: 15 points
- Sports Interested: 15 points
- Age Groups: 10 points
- Looking For: 10 points

## Implementation Steps

### Step 1: Apply Database Schema
```bash
# Run supabase-setup-v2.sql in your Supabase SQL Editor
```

### Step 2: Update Auth Context
The auth context has been updated to:
- Map new database fields to User object
- Support both new structured fields and legacy roleSpecificData
- Calculate profile completion on profile load

### Step 3: Update Signup Flows
Each signup screen should:
1. Collect minimum required fields first (Step 1)
2. Show optional high-value fields (Step 2)
3. Allow skip for lowest priority fields
4. Display progress bar
5. Validate with Zod schemas

Example structure:
```typescript
// Step 1: Core Info
- Email, Password, Name
- Bio

// Step 2: Role-Specific Essentials
- For Athlete: Sport, Position
- For Scout: Organization
- etc.

// Step 3: High-Value Optional
- For Athlete: Height, Weight, DOB, Current Team
- For Scout: Regions, Sports, Looking For
- etc.

// Step 4: Profile Enhancement
- Photos/Videos
- Additional details
```

### Step 4: Update Profile Edit Screen
The edit screen should:
- Show dynamic fields based on user role
- Display profile completion score and progress bar
- Highlight missing high-value fields
- Group fields logically
- Allow inline editing

### Step 5: Add Profile Completion Widget
Create a reusable component:
```typescript
<ProfileCompletionCard
  score={user.profileCompletionScore}
  missingFields={getMissingProfileFields(user)}
  onCompleteProfile={() => router.push('/edit-profile')}
/>
```

## Database Field Mapping

### Old Structure → New Structure
```
roleSpecificData.height → athleteData.heightCm
roleSpecificData.weight → athleteData.weightKg
roleSpecificData.organization → scoutData.organization
roleSpecificData.experience → coachData.yearsExperience
location → locationCity + locationCountry
```

### Backward Compatibility
The system maintains `roleSpecificData` for backward compatibility. When reading profiles:
1. Try to read structured data first (e.g., `athlete_data`)
2. Fall back to `role_specific_data` if structured data is empty
3. When updating, write to both for gradual migration

## Testing the Implementation

### 1. Test Profile Creation
- Create profiles for each role type
- Verify data is stored in correct JSONB fields
- Check profile completion scores

### 2. Test Profile Completion
```sql
-- Test the completion function
SELECT id, name, role, calculate_profile_completion(id) as score
FROM profiles
ORDER BY score DESC;
```

### 3. Test Visibility Controls
- Create profiles with different visibility settings
- Verify non-scouts can't see 'scouts-only' profiles
- Verify private profiles are hidden

### 4. Test Validation
- Try submitting invalid data (should fail)
- Try submitting without required fields (should fail)
- Verify Zod error messages appear

## Performance Considerations

### Indexes Created
- Role-based queries: `profiles_role_idx`
- Sport filtering: `profiles_sport_idx`
- Location searches: `profiles_location_country_idx`, `profiles_location_city_idx`
- Verification filters: `profiles_verified_idx`
- Discovery features: `profiles_completion_idx`, `profiles_last_active_idx`

### JSONB Query Examples
```sql
-- Find athletes with highlight videos
SELECT * FROM profiles
WHERE role = 'athlete'
AND athlete_data ? 'highlightVideos'
AND jsonb_array_length(athlete_data->'highlightVideos') > 0;

-- Find scouts from specific organization
SELECT * FROM profiles
WHERE role = 'scout'
AND scout_data->>'organization' = 'FIFA';

-- Find coaches with certifications
SELECT * FROM profiles
WHERE role = 'coach'
AND coach_data ? 'certifications'
AND jsonb_array_length(coach_data->'certifications') > 0;
```

## Next Steps

### Phase 1: Core Implementation ✅
- [x] Database schema
- [x] TypeScript types
- [x] Validation schemas
- [x] Profile completion calculation

### Phase 2: UI Updates (In Progress)
- [ ] Enhanced signup flows with step-by-step onboarding
- [ ] Dynamic profile edit screen
- [ ] Profile completion widget
- [ ] Visibility controls UI

### Phase 3: Advanced Features
- [ ] Profile verification workflow
- [ ] Advanced search filters using JSONB queries
- [ ] Profile recommendations based on completion
- [ ] Scout-athlete matching algorithm
- [ ] Export profile to PDF (resume generation)

## Troubleshooting

### Issue: Profile completion score is 0
**Solution:** Run the calculation function manually:
```sql
UPDATE profiles
SET profile_completion_score = calculate_profile_completion(id);
```

### Issue: Old profiles have empty JSONB fields
**Solution:** Migrate legacy data:
```sql
-- Example: Migrate athlete height/weight
UPDATE profiles
SET athlete_data = jsonb_build_object(
  'heightCm', (role_specific_data->>'height')::numeric,
  'weightKg', (role_specific_data->>'weight')::numeric
)
WHERE role = 'athlete'
AND role_specific_data ? 'height';
```

### Issue: Validation errors in signup
**Solution:** Check Zod schema matches your form data structure. Common issues:
- Numbers passed as strings (parse them first)
- Missing required nested fields
- Array fields passed as comma-separated strings

## Migration Guide for Existing Data

If you have existing profiles in the database:

```sql
-- Backup first!
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Option 1: Keep data, add new columns
ALTER TABLE profiles ADD COLUMN athlete_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN coach_data JSONB DEFAULT '{}'::jsonb;
-- ... add all new columns ...

-- Option 2: Fresh start (recommended for development)
-- Use supabase-setup-v2.sql to recreate tables
```

## Support

For issues or questions:
1. Check this documentation first
2. Review the code comments in implementation files
3. Test with the provided SQL queries
4. Check Supabase logs for errors

---

**Last Updated:** 2025-12-03
**Version:** 2.0
**Status:** Implementation Complete - UI Updates In Progress
