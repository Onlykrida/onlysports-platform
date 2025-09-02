import { Stack } from "expo-router";
import React from "react";
import { theme } from "@/constants/theme";

export default function OpportunitiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="create"
        options={{
          title: "Create Opportunity",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}