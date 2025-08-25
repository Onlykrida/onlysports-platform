-- Add messages table to existing schema
-- Run this after the main setup if messages table doesn't exist

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    post_id uuid NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY IF NOT EXISTS "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY IF NOT EXISTS "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY IF NOT EXISTS "Users can update messages they received" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger AS $$
DECLARE
    sender_name text;
BEGIN
    -- Get the sender name
    SELECT name INTO sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        NEW.receiver_id,
        'message',
        'New Message',
        sender_name || ' sent you a message',
        json_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create message notification
DROP TRIGGER IF EXISTS on_message_notification ON public.messages;
CREATE TRIGGER on_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.create_message_notification();