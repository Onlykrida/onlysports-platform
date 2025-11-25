-- OnlySports Analytics Seed Data
-- 100 users with realistic sports stats, ML features, and rankings
-- Run this in your Supabase SQL Editor after the main setup

DO $$
DECLARE
    user_ids uuid[];
    user_id uuid;
    i integer;
    
    -- Sport categories
    sports text[] := ARRAY['football', 'cricket', 'basketball', 'volleyball', 'athletics', 'badminton'];
    locations text[] := ARRAY['Hyderabad', 'Bengaluru', 'Kerala', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai'];
    
    -- Variables for stats
    sport text;
    age integer;
    location text;
    matches_played integer;
    primary_stat integer;
    assists integer;
    speed_score numeric;
    stamina_score numeric;
    technique_score numeric;
    consistency_score numeric;
    injury_risk_score numeric;
    performance_index numeric;
    growth_potential_score numeric;
    recommendation_ready boolean;
    stats_json jsonb;
    
    -- Names lists
    first_names text[] := ARRAY[
        'Arjun', 'Rohan', 'Virat', 'Rohit', 'Dhoni', 'Rahul', 'Priya', 'Ananya', 'Saina', 'PV',
        'Amit', 'Raj', 'Vijay', 'Krishna', 'Ravi', 'Suresh', 'Deepika', 'Sakshi', 'Neha', 'Pooja',
        'Aditya', 'Karan', 'Varun', 'Siddharth', 'Yash', 'Ishaan', 'Ritika', 'Shruti', 'Divya', 'Sneha',
        'Akash', 'Nikhil', 'Harsh', 'Manish', 'Gaurav', 'Vishal', 'Priyanka', 'Kavya', 'Tanya', 'Isha',
        'Dev', 'Aryan', 'Ayush', 'Kartik', 'Shiv', 'Om', 'Anushka', 'Kiara', 'Janhvi', 'Sara',
        'Kabir', 'Veer', 'Aarav', 'Reyansh', 'Atharv', 'Vivaan', 'Anvi', 'Anika', 'Myra', 'Pari',
        'Lakshmi', 'Ganesh', 'Surya', 'Chandra', 'Indra', 'Agni', 'Saraswati', 'Durga', 'Kali', 'Parvati',
        'Bharat', 'Ashok', 'Akbar', 'Chandragupta', 'Shivaji', 'Rani', 'Laxmibai', 'Jhansi', 'Pratap', 'Singh',
        'Arjuna', 'Bhima', 'Nakula', 'Sahadeva', 'Draupadi', 'Kunti', 'Karna', 'Abhimanyu', 'Ghatotkacha', 'Shakuni',
        'Tiger', 'Lion', 'Cheetah', 'Panther', 'Falcon', 'Eagle', 'Hawk', 'Phoenix', 'Dragon', 'Thunder'
    ];
    
    last_names text[] := ARRAY[
        'Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Khan', 'Ali',
        'Gupta', 'Agarwal', 'Jain', 'Mehta', 'Shah', 'Pandey', 'Mishra', 'Rao', 'Pillai', 'Menon',
        'Chopra', 'Kapoor', 'Malhotra', 'Khanna', 'Bhatia', 'Sethi', 'Bansal', 'Goel', 'Mittal', 'Jindal',
        'Das', 'Dutta', 'Roy', 'Ghosh', 'Mukherjee', 'Chatterjee', 'Bose', 'Sen', 'Saha', 'Pal',
        'Naidu', 'Raju', 'Prasad', 'Yadav', 'Thakur', 'Sinha', 'Jha', 'Choudhary', 'Saxena', 'Tiwari',
        'Desai', 'Trivedi', 'Kulkarni', 'Joshi', 'Deshpande', 'Bhatt', 'Rane', 'Kale', 'More', 'Patil',
        'Hegde', 'Bhat', 'Kamath', 'Kini', 'Rai', 'Shetty', 'Pai', 'Poojary', 'Acharya', 'Shastri',
        'Subramaniam', 'Krishnan', 'Raman', 'Swamy', 'Narayanan', 'Balaji', 'Venkat', 'Sundaram', 'Ravi', 'Ayyar',
        'Rahman', 'Ahmed', 'Malik', 'Hussain', 'Abbas', 'Raza', 'Mirza', 'Qureshi', 'Siddiqui', 'Ansari',
        'Fernandes', 'D\'Souza', 'Rodrigues', 'Pereira', 'Gomes', 'Dias', 'Silva', 'Costa', 'Braganza', 'Lobo'
    ];
    
    bios text[] := ARRAY[
        'Passionate athlete striving for excellence',
        'Dedicated to pushing my limits every day',
        'Sports is life, everything else is just details',
        'Rising star in the making',
        'Training hard, playing harder',
        'On a mission to inspire through sports',
        'Building legacy one game at a time',
        'Future champion, present warrior',
        'Believe in the grind, trust the process',
        'Performance speaks louder than words'
    ];
    
BEGIN
    -- Array to store all generated user IDs for later use
    user_ids := ARRAY[]::uuid[];
    
    -- Generate 100 users
    FOR i IN 1..100 LOOP
        user_id := gen_random_uuid();
        user_ids := array_append(user_ids, user_id);
        
        -- Random selections
        sport := sports[1 + floor(random() * array_length(sports, 1))::int];
        location := locations[1 + floor(random() * array_length(locations, 1))::int];
        age := 13 + floor(random() * 23)::int;
        
        -- Generate realistic stats based on sport
        matches_played := 10 + floor(random() * 150)::int;
        
        -- Core performance scores (0-100)
        speed_score := 40 + (random() * 60);
        stamina_score := 40 + (random() * 60);
        technique_score := 35 + (random() * 65);
        consistency_score := 30 + (random() * 70);
        
        -- Injury risk inversely correlated with stamina and age
        injury_risk_score := GREATEST(0.1, LEAST(1.0, 
            0.5 - (stamina_score / 200.0) + (age / 100.0) + (random() * 0.3)
        ));
        
        -- Calculate performance index (weighted)
        performance_index := (
            (speed_score * 0.25) +
            (stamina_score * 0.25) +
            (technique_score * 0.30) +
            (consistency_score * 0.20)
        );
        
        -- Growth potential correlated with consistency and youth
        growth_potential_score := LEAST(100, 
            consistency_score * 0.6 + 
            ((35 - age) * 2) + 
            (random() * 20)
        );
        
        -- Recommendation ready if performance index > 70
        recommendation_ready := performance_index > 70;
        
        -- Sport-specific primary stats
        IF sport = 'football' THEN
            primary_stat := floor(matches_played * (0.3 + random() * 0.7))::int;
            assists := floor(matches_played * (0.2 + random() * 0.5))::int;
            stats_json := jsonb_build_object(
                'matches_played', matches_played,
                'goals', primary_stat,
                'assists', assists,
                'speed_score', round(speed_score::numeric, 2),
                'stamina_score', round(stamina_score::numeric, 2),
                'technique_score', round(technique_score::numeric, 2),
                'consistency_score', round(consistency_score::numeric, 2),
                'injury_risk_score', round(injury_risk_score::numeric, 3),
                'performance_index', round(performance_index::numeric, 2),
                'growth_potential_score', round(growth_potential_score::numeric, 2),
                'recommendation_ready', recommendation_ready
            );
        ELSIF sport = 'cricket' THEN
            primary_stat := floor(matches_played * (25 + random() * 50))::int;
            assists := floor(matches_played * (0.5 + random() * 2))::int;
            stats_json := jsonb_build_object(
                'matches_played', matches_played,
                'runs', primary_stat,
                'wickets', assists,
                'speed_score', round(speed_score::numeric, 2),
                'stamina_score', round(stamina_score::numeric, 2),
                'technique_score', round(technique_score::numeric, 2),
                'consistency_score', round(consistency_score::numeric, 2),
                'injury_risk_score', round(injury_risk_score::numeric, 3),
                'performance_index', round(performance_index::numeric, 2),
                'growth_potential_score', round(growth_potential_score::numeric, 2),
                'recommendation_ready', recommendation_ready,
                'batting_average', round((primary_stat::numeric / NULLIF(matches_played, 0))::numeric, 2)
            );
        ELSIF sport = 'basketball' THEN
            primary_stat := floor(matches_played * (10 + random() * 25))::int;
            assists := floor(matches_played * (3 + random() * 8))::int;
            stats_json := jsonb_build_object(
                'matches_played', matches_played,
                'points', primary_stat,
                'assists', assists,
                'rebounds', floor(matches_played * (4 + random() * 8))::int,
                'speed_score', round(speed_score::numeric, 2),
                'stamina_score', round(stamina_score::numeric, 2),
                'technique_score', round(technique_score::numeric, 2),
                'consistency_score', round(consistency_score::numeric, 2),
                'injury_risk_score', round(injury_risk_score::numeric, 3),
                'performance_index', round(performance_index::numeric, 2),
                'growth_potential_score', round(growth_potential_score::numeric, 2),
                'recommendation_ready', recommendation_ready
            );
        ELSIF sport = 'volleyball' THEN
            primary_stat := floor(matches_played * (5 + random() * 15))::int;
            assists := floor(matches_played * (10 + random() * 20))::int;
            stats_json := jsonb_build_object(
                'matches_played', matches_played,
                'spikes', primary_stat,
                'blocks', floor(matches_played * (2 + random() * 8))::int,
                'serves', assists,
                'speed_score', round(speed_score::numeric, 2),
                'stamina_score', round(stamina_score::numeric, 2),
                'technique_score', round(technique_score::numeric, 2),
                'consistency_score', round(consistency_score::numeric, 2),
                'injury_risk_score', round(injury_risk_score::numeric, 3),
                'performance_index', round(performance_index::numeric, 2),
                'growth_potential_score', round(growth_potential_score::numeric, 2),
                'recommendation_ready', recommendation_ready
            );
        ELSIF sport = 'athletics' THEN
            primary_stat := floor(5 + random() * 15)::int;
            assists := 0;
            stats_json := jsonb_build_object(
                'matches_played', matches_played,
                'medals', primary_stat,
                'personal_best_100m', round((10.5 + random() * 2.5)::numeric, 2),
                'personal_best_long_jump', round((5.5 + random() * 2.5)::numeric, 2),
                'speed_score', round(speed_score::numeric, 2),
                'stamina_score', round(stamina_score::numeric, 2),
                'technique_score', round(technique_score::numeric, 2),
                'consistency_score', round(consistency_score::numeric, 2),
                'injury_risk_score', round(injury_risk_score::numeric, 3),
                'performance_index', round(performance_index::numeric, 2),
                'growth_potential_score', round(growth_potential_score::numeric, 2),
                'recommendation_ready', recommendation_ready
            );
        ELSE -- badminton
            primary_stat := floor(5 + random() * 20)::int;
            assists := 0;
            stats_json := jsonb_build_object(
                'matches_played', matches_played,
                'tournaments_won', primary_stat,
                'win_percentage', round((50 + random() * 45)::numeric, 2),
                'speed_score', round(speed_score::numeric, 2),
                'stamina_score', round(stamina_score::numeric, 2),
                'technique_score', round(technique_score::numeric, 2),
                'consistency_score', round(consistency_score::numeric, 2),
                'injury_risk_score', round(injury_risk_score::numeric, 3),
                'performance_index', round(performance_index::numeric, 2),
                'growth_potential_score', round(growth_potential_score::numeric, 2),
                'recommendation_ready', recommendation_ready
            );
        END IF;
        
        -- Insert user profile
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            avatar,
            bio,
            location,
            verified,
            sport,
            position,
            stats,
            created_at
        ) VALUES (
            user_id,
            'athlete' || i || '@onlysports.test',
            first_names[1 + floor(random() * array_length(first_names, 1))::int] || ' ' ||
            last_names[1 + floor(random() * array_length(last_names, 1))::int],
            'athlete',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || i,
            bios[1 + floor(random() * array_length(bios, 1))::int],
            location,
            CASE WHEN random() > 0.7 THEN true ELSE false END,
            sport,
            CASE sport
                WHEN 'football' THEN (ARRAY['Forward', 'Midfielder', 'Defender', 'Goalkeeper'])[1 + floor(random() * 4)::int]
                WHEN 'cricket' THEN (ARRAY['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'])[1 + floor(random() * 4)::int]
                WHEN 'basketball' THEN (ARRAY['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'])[1 + floor(random() * 5)::int]
                WHEN 'volleyball' THEN (ARRAY['Setter', 'Outside Hitter', 'Middle Blocker', 'Libero'])[1 + floor(random() * 4)::int]
                WHEN 'athletics' THEN (ARRAY['Sprinter', 'Long Distance', 'Jumper', 'Thrower'])[1 + floor(random() * 4)::int]
                WHEN 'badminton' THEN (ARRAY['Singles', 'Doubles', 'Mixed Doubles'])[1 + floor(random() * 3)::int]
            END,
            stats_json,
            now() - (random() * interval '365 days')
        );
        
    END LOOP;
    
    -- Now create posts for random users (200-300 posts total)
    DECLARE
        post_count integer := 250;
        random_user_id uuid;
        post_types text[] := ARRAY['highlight', 'training', 'match', 'achievement'];
        post_type text;
        post_titles text[] := ARRAY[
            'Amazing training session today!',
            'Great team practice',
            'New personal best!',
            'Championship game highlights',
            'Working on my technique',
            'Match day vibes',
            'Training hard for the big game',
            'Proud of my progress',
            'Team victory!',
            'Never give up attitude'
        ];
        post_images text[] := ARRAY[
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
            'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a',
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc',
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
            'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff',
            'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0',
            'https://images.unsplash.com/photo-1517649763962-0c623066013b'
        ];
    BEGIN
        FOR i IN 1..post_count LOOP
            random_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
            post_type := post_types[1 + floor(random() * array_length(post_types, 1))::int];
            
            INSERT INTO public.posts (
                user_id,
                title,
                description,
                type,
                image_url,
                likes_count,
                comments_count,
                views_count,
                created_at
            ) VALUES (
                random_user_id,
                post_titles[1 + floor(random() * array_length(post_titles, 1))::int],
                'Pushing my limits and achieving new milestones. Every practice session counts! #dedication #sports #training',
                post_type,
                post_images[1 + floor(random() * array_length(post_images, 1))::int],
                floor(random() * 150)::int,
                floor(random() * 50)::int,
                floor(random() * 500)::int,
                now() - (random() * interval '90 days')
            );
        END LOOP;
    END;
    
    -- Create follow relationships (each user follows 5-20 random others)
    DECLARE
        follower_id uuid;
        following_id uuid;
        follow_count integer;
    BEGIN
        FOREACH follower_id IN ARRAY user_ids LOOP
            follow_count := 5 + floor(random() * 16)::int;
            
            FOR i IN 1..follow_count LOOP
                following_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
                
                -- Avoid self-follow and duplicates
                IF follower_id != following_id THEN
                    INSERT INTO public.follows (follower_id, following_id)
                    VALUES (follower_id, following_id)
                    ON CONFLICT (follower_id, following_id) DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
    END;
    
    -- Add some scouts and coaches (10 of each)
    DECLARE
        scout_coach_id uuid;
    BEGIN
        -- Create 10 scouts
        FOR i IN 1..10 LOOP
            scout_coach_id := gen_random_uuid();
            
            INSERT INTO public.profiles (
                id,
                email,
                name,
                role,
                avatar,
                bio,
                location,
                verified,
                sport,
                created_at
            ) VALUES (
                scout_coach_id,
                'scout' || i || '@onlysports.test',
                first_names[1 + floor(random() * array_length(first_names, 1))::int] || ' ' ||
                last_names[1 + floor(random() * array_length(last_names, 1))::int],
                'scout',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=scout' || i,
                'Professional talent scout looking for the next sports stars',
                locations[1 + floor(random() * array_length(locations, 1))::int],
                true,
                sports[1 + floor(random() * array_length(sports, 1))::int],
                now() - (random() * interval '365 days')
            );
        END LOOP;
        
        -- Create 10 coaches
        FOR i IN 1..10 LOOP
            scout_coach_id := gen_random_uuid();
            
            INSERT INTO public.profiles (
                id,
                email,
                name,
                role,
                avatar,
                bio,
                location,
                verified,
                sport,
                created_at
            ) VALUES (
                scout_coach_id,
                'coach' || i || '@onlysports.test',
                first_names[1 + floor(random() * array_length(first_names, 1))::int] || ' ' ||
                last_names[1 + floor(random() * array_length(last_names, 1))::int],
                'coach',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=coach' || i,
                'Experienced coach dedicated to developing young talent',
                locations[1 + floor(random() * array_length(locations, 1))::int],
                true,
                sports[1 + floor(random() * array_length(sports, 1))::int],
                now() - (random() * interval '365 days')
            );
        END LOOP;
    END;
    
END $$;

-- Create a view for talent rankings
CREATE OR REPLACE VIEW public.athlete_rankings AS
SELECT 
    id,
    name,
    email,
    sport,
    location,
    avatar,
    (stats->>'performance_index')::numeric as performance_index,
    (stats->>'growth_potential_score')::numeric as growth_potential_score,
    (stats->>'speed_score')::numeric as speed_score,
    (stats->>'stamina_score')::numeric as stamina_score,
    (stats->>'technique_score')::numeric as technique_score,
    (stats->>'consistency_score')::numeric as consistency_score,
    (stats->>'injury_risk_score')::numeric as injury_risk_score,
    (stats->>'recommendation_ready')::boolean as recommendation_ready,
    (stats->>'matches_played')::integer as matches_played,
    ROW_NUMBER() OVER (ORDER BY (stats->>'performance_index')::numeric DESC) as talent_rank,
    ROW_NUMBER() OVER (PARTITION BY sport ORDER BY (stats->>'performance_index')::numeric DESC) as sport_rank
FROM public.profiles
WHERE role = 'athlete' AND stats IS NOT NULL
ORDER BY (stats->>'performance_index')::numeric DESC;

-- Create index for performance-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_stats_performance 
ON public.profiles USING gin (stats);

-- Grant access to view
GRANT SELECT ON public.athlete_rankings TO authenticated;
GRANT SELECT ON public.athlete_rankings TO anon;

-- Success message
SELECT 
    'Seed data generated successfully!' as status,
    COUNT(*) FILTER (WHERE role = 'athlete') as athletes,
    COUNT(*) FILTER (WHERE role = 'scout') as scouts,
    COUNT(*) FILTER (WHERE role = 'coach') as coaches,
    (SELECT COUNT(*) FROM public.posts) as posts,
    (SELECT COUNT(*) FROM public.follows) as follows
FROM public.profiles;
