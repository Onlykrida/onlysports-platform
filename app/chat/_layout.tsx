import { Stack } from 'expo-router';
import React from 'react';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-group"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
