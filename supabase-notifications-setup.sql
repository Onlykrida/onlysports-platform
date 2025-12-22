-- Notifications table setup
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'post', 'opportunity', 'message', 'connection_request', 'connection_accepted', 'profile_view', 'mention', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  related_id UUID, -- Can reference posts, messages, users, etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create duplicate notifications for the same action within 5 minutes
  IF EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = p_user_id 
      AND type = p_type 
      AND related_id = p_related_id 
      AND created_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, title, message, data, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_data, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for post likes
CREATE OR REPLACE FUNCTION notify_post_like() RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_content TEXT;
  liker_name TEXT;
BEGIN
  -- Get post author and content
  SELECT user_id, COALESCE(description, title, '') INTO post_author_id, post_content
  FROM posts WHERE id = NEW.post_id;
  
  -- Get liker's name
  SELECT COALESCE(name, email) INTO liker_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if user likes their own post
  IF post_author_id != NEW.user_id THEN
    PERFORM create_notification(
      post_author_id,
      'like',
      'New Like!',
      COALESCE(liker_name, 'Someone') || ' liked your post: "' || 
      CASE 
        WHEN LENGTH(post_content) > 50 THEN LEFT(post_content, 50) || '...'
        ELSE post_content
      END || '"',
      jsonb_build_object(
        'postId', NEW.post_id,
        'likedBy', NEW.user_id,
        'likedByName', liker_name
      ),
      NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for follows
CREATE OR REPLACE FUNCTION notify_follow() RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's name
  SELECT COALESCE(name, email) INTO follower_name
  FROM profiles WHERE id = NEW.follower_id;
  
  -- Create follow notification
  PERFORM create_notification(
    NEW.following_id,
    'follow',
    'New Follower!',
    COALESCE(follower_name, 'Someone') || ' started following you',
    jsonb_build_object(
      'followerId', NEW.follower_id,
      'followerName', follower_name
    ),
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for messages
CREATE OR REPLACE FUNCTION notify_message() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT COALESCE(name, email) INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;
  
  -- Create message notification
  PERFORM create_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    COALESCE(sender_name, 'Someone') || ': ' || 
    CASE 
      WHEN LENGTH(NEW.content) > 80 THEN LEFT(NEW.content, 80) || '...'
      ELSE NEW.content
    END,
    jsonb_build_object(
      'senderId', NEW.sender_id,
      'senderName', sender_name,
      'messageId', NEW.id
    ),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_post_like ON likes;
CREATE TRIGGER trigger_notify_post_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

DROP TRIGGER IF EXISTS trigger_notify_follow ON follows;
CREATE TRIGGER trigger_notify_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_follow();

DROP TRIGGER IF EXISTS trigger_notify_message ON messages;
CREATE TRIGGER trigger_notify_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message();

-- Function to clean up old notifications (optional, can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON notifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO anon, authenticated;