-- Fix missing applications/opportunity_applications table
-- This creates the applications table if it doesn't exist and fixes triggers

BEGIN;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS create_application_notification_trigger ON public.applications;
DROP TRIGGER IF EXISTS create_application_notification_trigger ON public.opportunity_applications;

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT applications_unique_application UNIQUE (opportunity_id, athlete_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_athlete_id ON public.applications(athlete_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Athletes can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Athletes can insert their own applications" ON public.applications;
DROP POLICY IF EXISTS "Athletes can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Team owners can view applications to their opportunities" ON public.applications;
DROP POLICY IF EXISTS "Team owners can update application status" ON public.applications;

-- Create RLS policies
CREATE POLICY "Athletes can view their own applications" ON public.applications
    FOR SELECT
    USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can insert their own applications" ON public.applications
    FOR INSERT
    WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update their own applications" ON public.applications
    FOR UPDATE
    USING (auth.uid() = athlete_id);

CREATE POLICY "Team owners can view applications to their opportunities" ON public.applications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.opportunities 
            WHERE id = applications.opportunity_id 
            AND team_id = auth.uid()
        )
    );

CREATE POLICY "Team owners can update application status" ON public.applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.opportunities 
            WHERE id = applications.opportunity_id 
            AND team_id = auth.uid()
        )
    );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create notification function if it doesn't exist with proper search path
CREATE OR REPLACE FUNCTION public.create_application_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  opportunity_owner_id UUID;
  opportunity_title TEXT;
  athlete_name TEXT;
BEGIN
  SELECT team_id, title INTO opportunity_owner_id, opportunity_title
  FROM public.opportunities
  WHERE id = NEW.opportunity_id;

  SELECT name INTO athlete_name
  FROM public.profiles
  WHERE id = NEW.athlete_id;

  IF opportunity_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, read)
    VALUES (
      opportunity_owner_id,
      'application',
      'New Application',
      COALESCE(athlete_name, 'Someone') || ' applied to your opportunity: ' || COALESCE(opportunity_title, 'Untitled'),
      jsonb_build_object(
        'applicationId', NEW.id,
        'opportunityId', NEW.opportunity_id,
        'athleteId', NEW.athlete_id
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for application notifications
DROP TRIGGER IF EXISTS create_application_notification_trigger ON public.applications;
CREATE TRIGGER create_application_notification_trigger
    AFTER INSERT ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.create_application_notification();

-- Add to realtime publication if not already added
DO $$
BEGIN
    -- Check if table is in publication, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'applications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Publication doesn't exist, skip
        NULL;
END $$;

COMMIT;

-- Display success message
SELECT 'Applications table setup completed successfully!' as status;
