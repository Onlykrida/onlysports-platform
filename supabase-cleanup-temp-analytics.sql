-- OnlySports - Cleanup Temporary Analytics Tables
-- This script removes the temporary analytics tables and data
-- Run this in your Supabase SQL Editor to revert to working state

-- Drop temporary analytics tables
DROP TABLE IF EXISTS public.analytics_rankings CASCADE;
DROP TABLE IF EXISTS public.athlete_stats CASCADE;

-- Drop the temporary users table (since it conflicts with your actual profiles table)
DROP TABLE IF EXISTS public.users CASCADE;

-- Success message
SELECT 'Temporary analytics tables have been cleaned up successfully! Your database is back to its working state.' as status;
