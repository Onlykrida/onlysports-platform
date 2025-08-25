-- OnlySports Complete Database Setup
-- This script sets up the entire database schema for the OnlySports app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (base authentication table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (extended user information)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('athlete', 'scout', 'fan')) DEFAULT 'fan',
    sport TEXT,
    position TEXT,
    team TEXT,
    location TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follows table
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id),
    CHECK(participant1_id != participant2_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for updating counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_profile_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_profile_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating counts
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_profile_followers_count
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_profile_followers_count();

CREATE TRIGGER trigger_update_profile_posts_count
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_profile_posts_count();

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON likes
    FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON follows
    FOR ALL USING (auth.uid() = follower_id);

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Insert sample data

-- Sample users (these would normally be created by Supabase Auth)
INSERT INTO users (id, email) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'john.athlete@example.com'),
    ('550e8400-e29b-41d4-a716-446655440002', 'sarah.scout@example.com'),
    ('550e8400-e29b-41d4-a716-446655440003', 'mike.fan@example.com'),
    ('550e8400-e29b-41d4-a716-446655440004', 'emma.athlete@example.com'),
    ('550e8400-e29b-41d4-a716-446655440005', 'david.scout@example.com');

-- Sample profiles
INSERT INTO profiles (id, username, full_name, bio, role, sport, position, team, location, verified) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'john_athlete', 'John Smith', 'Professional basketball player. Always pushing limits! 🏀', 'athlete', 'Basketball', 'Point Guard', 'Lakers', 'Los Angeles, CA', true),
    ('550e8400-e29b-41d4-a716-446655440002', 'sarah_scout', 'Sarah Johnson', 'Talent scout for college basketball. Looking for the next stars! ⭐', 'scout', 'Basketball', null, 'UCLA', 'Los Angeles, CA', true),
    ('550e8400-e29b-41d4-a716-446655440003', 'mike_fan', 'Mike Wilson', 'Die-hard Lakers fan since 1985! 💜💛', 'fan', 'Basketball', null, null, 'Los Angeles, CA', false),
    ('550e8400-e29b-41d4-a716-446655440004', 'emma_runner', 'Emma Davis', 'Marathon runner and fitness enthusiast. Boston qualifier! 🏃‍♀️', 'athlete', 'Running', 'Distance', 'Nike Running Club', 'Boston, MA', false),
    ('550e8400-e29b-41d4-a716-446655440005', 'david_scout', 'David Brown', 'Football scout for NFL teams. Always on the lookout for talent! 🏈', 'scout', 'Football', null, 'NFL Scouting', 'Dallas, TX', true);

-- Sample posts
INSERT INTO posts (user_id, content, media_type) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Just finished an amazing training session! Ready for the playoffs 💪 #Lakers #Basketball', 'image'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Game highlights from last night. What a match! 🔥', 'video'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Morning run complete! 10 miles in 65 minutes. Feeling strong 🏃‍♀️', 'image'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Scouting some incredible talent at the college championships. The future of basketball is bright! ⭐', null),
    ('550e8400-e29b-41d4-a716-446655440003', 'Lakers looking unstoppable this season! Championship bound 💜💛 #LakeShow', null);

-- Sample follows
INSERT INTO follows (follower_id, following_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004');

-- Sample likes
INSERT INTO likes (user_id, post_id) 
SELECT '550e8400-e29b-41d4-a716-446655440003', id FROM posts WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 2;

INSERT INTO likes (user_id, post_id) 
SELECT '550e8400-e29b-41d4-a716-446655440002', id FROM posts WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1;

-- Sample comments
INSERT INTO comments (user_id, post_id, content) 
SELECT '550e8400-e29b-41d4-a716-446655440003', id, 'Amazing performance! Keep it up! 🔥' 
FROM posts WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1;

INSERT INTO comments (user_id, post_id, content) 
SELECT '550e8400-e29b-41d4-a716-446655440002', id, 'Impressive skills! Would love to discuss opportunities.' 
FROM posts WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1;

-- Sample conversations
INSERT INTO conversations (participant1_id, participant2_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003');

-- Sample messages
INSERT INTO messages (conversation_id, sender_id, content) 
SELECT id, '550e8400-e29b-41d4-a716-446655440002', 'Hi John! I saw your recent performance and I''m impressed. Would you be interested in discussing some opportunities?' 
FROM conversations WHERE participant1_id = '550e8400-e29b-41d4-a716-446655440001' AND participant2_id = '550e8400-e29b-41d4-a716-446655440002';

INSERT INTO messages (conversation_id, sender_id, content) 
SELECT id, '550e8400-e29b-41d4-a716-446655440001', 'Hi Sarah! Thanks for reaching out. I''d definitely be interested in hearing more about what you have in mind.' 
FROM conversations WHERE participant1_id = '550e8400-e29b-41d4-a716-446655440001' AND participant2_id = '550e8400-e29b-41d4-a716-446655440002';

INSERT INTO messages (conversation_id, sender_id, content) 
SELECT id, '550e8400-e29b-41d4-a716-446655440003', 'Dude, that last game was incredible! You''re on fire this season! 🔥' 
FROM conversations WHERE participant1_id = '550e8400-e29b-41d4-a716-446655440001' AND participant2_id = '550e8400-e29b-41d4-a716-446655440003';

-- Create helpful views
CREATE VIEW user_stats AS
SELECT 
    p.id,
    p.username,
    p.full_name,
    p.followers_count,
    p.following_count,
    p.posts_count,
    COUNT(DISTINCT posts.id) as actual_posts_count,
    COUNT(DISTINCT likes.id) as total_likes_received
FROM profiles p
LEFT JOIN posts ON posts.user_id = p.id
LEFT JOIN likes ON likes.post_id = posts.id
GROUP BY p.id, p.username, p.full_name, p.followers_count, p.following_count, p.posts_count;

CREATE VIEW post_details AS
SELECT 
    p.*,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.verified
FROM posts p
JOIN profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'OnlySports database setup completed successfully!' as status;