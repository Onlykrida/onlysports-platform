-- Fix notifications table RLS policy to allow authenticated users to create notifications for others
-- This is needed for features like "Scout expresses interest" where one user creates a notification for another

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

-- Recreate policies with correct permissions

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Allow ANY authenticated user to create notifications (for any user)
-- This is needed when a scout creates a notification for an athlete, etc.
CREATE POLICY "Authenticated users can create notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow users to update only their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid()::text = user_id::text);
