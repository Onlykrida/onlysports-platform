import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signup-athlete" />
      <Stack.Screen name="signup-coach" />
      <Stack.Screen name="signup-scout" />
      <Stack.Screen name="signup-trainer" />
      <Stack.Screen name="signup-team" />
      <Stack.Screen name="role-selection" />
    </Stack>
  );
}