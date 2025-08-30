-- Real-time messaging, opportunities, and applications setup
-- This script sets up the complete sync system for OnlySports

-- =============================================
-- MESSAGES TABLE SETUP
-- =============================================

-- Drop existing messages table if it exists
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table with proper structure
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);

-- =============================================
-- OPPORTUNITIES TABLE SETUP
-- =============================================

-- Drop existing opportunities table if it exists
DROP TABLE IF EXISTS public.opportunities CASCADE;

-- Create opportunities table
CREATE TABLE public.opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship')),
    sport TEXT NOT NULL,
    location TEXT NOT NULL,
    deadline DATE NOT NULL,
    requirements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for opportunities
CREATE INDEX idx_opportunities_team_id ON public.opportunities(team_id);
CREATE INDEX idx_opportunities_type ON public.opportunities(type);
CREATE INDEX idx_opportunities_sport ON public.opportunities(sport);
CREATE INDEX idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX idx_opportunities_created_at ON public.opportunities(created_at DESC);

-- =============================================
-- APPLICATIONS TABLE SETUP
-- =============================================

-- Drop existing applications table if it exists
DROP TABLE IF EXISTS public.applications CASCADE;

-- Create applications table
CREATE TABLE public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(opportunity_id, athlete_id) -- Prevent duplicate applications
);

-- Create indexes for applications
CREATE INDEX idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX idx_applications_athlete_id ON public.applications(athlete_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);

-- =============================================
-- UPDATE NOTIFICATIONS TABLE
-- =============================================

-- Update notifications table to support new types
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('follow', 'like', 'comment', 'post', 'opportunity', 'message', 'connection_request', 'connection_accepted', 'profile_view', 'mention', 'system'));

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Opportunities policies
CREATE POLICY "Everyone can view opportunities" ON public.opportunities
    FOR SELECT USING (true);

CREATE POLICY "Teams/coaches/scouts can create opportunities" ON public.opportunities
    FOR INSERT WITH CHECK (
        auth.uid() = team_id AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('team', 'coach', 'scout')
        )
    );

CREATE POLICY "Team owners can update their opportunities" ON public.opportunities
    FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Team owners can delete their opportunities" ON public.opportunities
    FOR DELETE USING (auth.uid() = team_id);

-- Applications policies
CREATE POLICY "Athletes can view their own applications" ON public.applications
    FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Team owners can view applications to their opportunities" ON public.applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.opportunities 
            WHERE id = opportunity_id AND team_id = auth.uid()
        )
    );

CREATE POLICY "Athletes can create applications" ON public.applications
    FOR INSERT WITH CHECK (
        auth.uid() = athlete_id AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'athlete'
        )
    );

CREATE POLICY "Team owners can update application status" ON public.applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.opportunities 
            WHERE id = opportunity_id AND team_id = auth.uid()
        )
    );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON public.opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON public.applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- NOTIFICATION TRIGGERS
-- =============================================

-- Function to create follow notification
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, read)
    SELECT 
        NEW.following_id,
        'follow',
        'New Follower!',
        (SELECT name FROM public.profiles WHERE id = NEW.follower_id) || ' started following you',
        json_build_object('followerId', NEW.follower_id),
        false
    WHERE NEW.follower_id != NEW.following_id; -- Don't notify self-follows
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create message notification
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, read)
    SELECT 
        NEW.receiver_id,
        'message',
        'New Message',
        (SELECT name FROM public.profiles WHERE id = NEW.sender_id) || ' sent you a message',
        json_build_object('senderId', NEW.sender_id, 'messageId', NEW.id),
        false
    WHERE NEW.sender_id != NEW.receiver_id; -- Don't notify self-messages
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create application notification
CREATE OR REPLACE FUNCTION create_application_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify team when athlete applies
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.notifications (user_id, type, title, message, data, read)
        SELECT 
            o.team_id,
            'opportunity',
            'New Application',
            (SELECT name FROM public.profiles WHERE id = NEW.athlete_id) || ' applied to ' || o.title,
            json_build_object('opportunityId', NEW.opportunity_id, 'athleteId', NEW.athlete_id, 'applicationId', NEW.id),
            false
        FROM public.opportunities o
        WHERE o.id = NEW.opportunity_id;
    END IF;
    
    -- Notify athlete when status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO public.notifications (user_id, type, title, message, data, read)
        SELECT 
            NEW.athlete_id,
            'opportunity',
            'Application ' || CASE 
                WHEN NEW.status = 'accepted' THEN 'Accepted'
                WHEN NEW.status = 'rejected' THEN 'Rejected'
                ELSE 'Updated'
            END,
            'Your application to ' || o.title || ' has been ' || NEW.status,
            json_build_object('opportunityId', NEW.opportunity_id, 'applicationId', NEW.id, 'status', NEW.status),
            false
        FROM public.opportunities o
        WHERE o.id = NEW.opportunity_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification triggers
DROP TRIGGER IF EXISTS follow_notification_trigger ON public.follows;
CREATE TRIGGER follow_notification_trigger
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

DROP TRIGGER IF EXISTS message_notification_trigger ON public.messages;
CREATE TRIGGER message_notification_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION create_message_notification();

DROP TRIGGER IF EXISTS application_notification_trigger ON public.applications;
CREATE TRIGGER application_notification_trigger
    AFTER INSERT OR UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION create_application_notification();

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample opportunities (only if profiles exist)
INSERT INTO public.opportunities (team_id, title, description, type, sport, location, deadline, requirements)
SELECT 
    p.id,
    'Youth Soccer Tryouts',
    'Join our competitive youth soccer team. We are looking for dedicated players aged 16-18 with strong technical skills and team spirit.',
    'tryout',
    'Soccer',
    'Los Angeles, CA',
    CURRENT_DATE + INTERVAL '30 days',
    ARRAY['Age 16-18', 'Previous team experience', 'Good physical condition']
FROM public.profiles p
WHERE p.role IN ('team', 'coach', 'scout')
LIMIT 1;

INSERT INTO public.opportunities (team_id, title, description, type, sport, location, deadline, requirements)
SELECT 
    p.id,
    'Basketball Summer Camp Scholarship',
    'Full scholarship available for talented young basketball players. Includes training, accommodation, and meals.',
    'scholarship',
    'Basketball',
    'New York, NY',
    CURRENT_DATE + INTERVAL '45 days',
    ARRAY['Age 14-17', 'Minimum 3.0 GPA', 'Financial need demonstration']
FROM public.profiles p
WHERE p.role IN ('team', 'coach', 'scout')
LIMIT 1;

-- =============================================
-- FUNCTIONS FOR STATS AND COUNTS
-- =============================================

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.messages
        WHERE receiver_id = user_id AND status != 'read'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get application count for an opportunity
CREATE OR REPLACE FUNCTION get_application_count(opportunity_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.applications
        WHERE opportunity_id = get_application_count.opportunity_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Real-time messaging, opportunities, and applications setup completed successfully!';
    RAISE NOTICE '📱 Features enabled:';
    RAISE NOTICE '   • Real-time messaging with media support';
    RAISE NOTICE '   • Opportunities posting and applications';
    RAISE NOTICE '   • Automatic notifications for follows, messages, and applications';
    RAISE NOTICE '   • Proper RLS policies for data security';
    RAISE NOTICE '   • Realtime subscriptions for live updates';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next steps:';
    RAISE NOTICE '   1. Test messaging between users';
    RAISE NOTICE '   2. Create opportunities as coach/scout/team';
    RAISE NOTICE '   3. Apply to opportunities as athlete';
    RAISE NOTICE '   4. Verify real-time notifications work';
END $$;