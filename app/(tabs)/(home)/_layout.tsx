import { Stack, router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { theme } from '@/constants/theme';

function HeaderTitle() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 32,
            height: 32,
            marginRight: 8,
            borderRadius: 6,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.white, fontWeight: 'bold', fontSize: 16 }}>OK</Text>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.primary,
          }}
        >
          OnlyKrida
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            marginLeft: 8,
          }}
        >
          • Feed
        </Text>
      </View>
      <TouchableOpacity
        style={{ position: 'relative', padding: 8 }}
        onPress={() => router.push('/(tabs)/notifications' as any)}
      >
        <Bell size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.bold,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle />,
          headerTitleAlign: 'left',
        }}
      />
    </Stack>
  );
}
