import { Stack } from 'expo-router';

export default function TeamLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Team Management',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="roster" 
        options={{ 
          title: 'Team Roster',
        }} 
      />
      <Stack.Screen 
        name="attendance" 
        options={{ 
          title: 'Attendance Tracking',
        }} 
      />
      <Stack.Screen 
        name="matches" 
        options={{ 
          title: 'Match Records',
        }} 
      />
      <Stack.Screen 
        name="injuries" 
        options={{ 
          title: 'Injury Management',
        }} 
      />
      <Stack.Screen 
        name="announcements" 
        options={{ 
          title: 'Team Announcements',
        }} 
      />
      <Stack.Screen 
        name="invite" 
        options={{ 
          title: 'Invite Players',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}
