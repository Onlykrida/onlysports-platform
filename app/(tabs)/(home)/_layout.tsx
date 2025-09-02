import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import BackgroundGradient from '@/components/BackgroundGradient';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useNotifications } from '@/hooks/notifications-context';

function HeaderTitle() {
  const { unreadCount } = useNotifications();
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image 
          source={{ uri: 'https://r2-pub.rork.com/generated-images/ad75ea0e-6774-4791-b63d-3c24452a4a85.png' }}
          style={{ 
            width: 32, 
            height: 32, 
            marginRight: 8,
            borderRadius: 6
          }}
          resizeMode="contain"
        />
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: theme.colors.primary
        }}>OnlySports</Text>
        <Text style={{ 
          fontSize: 16, 
          color: theme.colors.textSecondary,
          marginLeft: 8 
        }}>• Feed</Text>
      </View>
      <TouchableOpacity 
        style={{ position: 'relative', padding: 8 }}
        onPress={() => router.push('/notifications')}
      >
        <Bell size={24} color={theme.colors.text} />
        {unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            top: 2,
            right: 2,
            backgroundColor: theme.colors.danger,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}>
            <Text style={{
              color: theme.colors.white,
              fontSize: 10,
              fontWeight: 'bold',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
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