import React from 'react';
import { Stack } from 'expo-router';
import TestWithMockData from '@/scripts/test-with-mock-data';

export default function MockDataTestScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Mock Data Testing',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
        }}
      />
      <TestWithMockData />
    </>
  );
}
