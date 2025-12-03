import { supabaseAdmin } from '@/constants/supabase';

export async function cleanupMockData() {
  console.log('🧹 Starting cleanup of mock data...');
  console.log('================================================');
  
  if (!supabaseAdmin) {
    throw new Error('Admin client not available. Please add EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your .env file');
  }
  
  try {
    const { data: mockProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_mock', true);

    const mockUserIds = mockProfiles?.map((p: any) => p.id) || [];
    
    if (mockUserIds.length === 0) {
      console.log('ℹ️  No mock data found to clean up');
      return;
    }

    console.log(`🔄 Found ${mockUserIds.length} mock users to clean up...`);

    console.log('🔄 Deleting comments...');
    const { error: commentsError } = await supabaseAdmin
      .from('comments')
      .delete()
      .in('user_id', mockUserIds);
    if (commentsError) console.error('❌ Error deleting comments:', commentsError);

    console.log('🔄 Deleting likes...');
    const { error: likesError } = await supabaseAdmin
      .from('likes')
      .delete()
      .in('user_id', mockUserIds);
    if (likesError) console.error('❌ Error deleting likes:', likesError);

    console.log('🔄 Deleting messages...');
    const { error: messagesError1 } = await supabaseAdmin
      .from('messages')
      .delete()
      .in('sender_id', mockUserIds);
    const { error: messagesError2 } = await supabaseAdmin
      .from('messages')
      .delete()
      .in('receiver_id', mockUserIds);
    if (messagesError1) console.error('❌ Error deleting messages (sender):', messagesError1);
    if (messagesError2) console.error('❌ Error deleting messages (receiver):', messagesError2);

    console.log('🔄 Deleting notifications...');
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .in('user_id', mockUserIds);
    if (notificationsError) console.error('❌ Error deleting notifications:', notificationsError);

    console.log('🔄 Deleting applications...');
    const { error: applicationsError } = await supabaseAdmin
      .from('applications')
      .delete()
      .in('athlete_id', mockUserIds);
    if (applicationsError) console.error('❌ Error deleting applications:', applicationsError);

    console.log('🔄 Deleting posts...');
    const { error: postsError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('is_mock', true);
    if (postsError) console.error('❌ Error deleting posts:', postsError);

    console.log('🔄 Deleting opportunities...');
    const { error: opportunitiesError } = await supabaseAdmin
      .from('opportunities')
      .delete()
      .eq('is_mock', true);
    if (opportunitiesError) console.error('❌ Error deleting opportunities:', opportunitiesError);

    console.log('🔄 Deleting follows...');
    const { error: followsError1 } = await supabaseAdmin
      .from('follows')
      .delete()
      .in('follower_id', mockUserIds);
    const { error: followsError2 } = await supabaseAdmin
      .from('follows')
      .delete()
      .in('following_id', mockUserIds);
    if (followsError1) console.error('❌ Error deleting follows (follower):', followsError1);
    if (followsError2) console.error('❌ Error deleting follows (following):', followsError2);

    console.log('🔄 Deleting profiles...');
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('is_mock', true);
    if (profilesError) console.error('❌ Error deleting profiles:', profilesError);

    console.log('================================================');
    console.log('✅ Mock data cleanup complete!');
    console.log(`📊 Cleaned up ${mockUserIds.length} mock users and related data`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

export async function cleanupSpecificMockData(type: 'users' | 'posts' | 'opportunities' | 'all') {
  console.log(`🧹 Cleaning up mock ${type}...`);
  
  if (!supabaseAdmin) {
    throw new Error('Admin client not available. Please add EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your .env file');
  }
  
  try {
    if (type === 'users' || type === 'all') {
      await cleanupMockData();
    } else if (type === 'posts') {
      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('is_mock', true);
      if (error) throw error;
      console.log('✅ Deleted mock posts');
    } else if (type === 'opportunities') {
      const { error } = await supabaseAdmin
        .from('opportunities')
        .delete()
        .eq('is_mock', true);
      if (error) throw error;
      console.log('✅ Deleted mock opportunities');
    }
  } catch (error) {
    console.error(`❌ Error cleaning up mock ${type}:`, error);
    throw error;
  }
}
