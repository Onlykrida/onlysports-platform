import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-context';
import AthleteHome from '@/components/home/AthleteHome';
import ScoutHome from '@/components/home/ScoutHome';
import CoachHome from '@/components/home/CoachHome';
import BrandHome from '@/components/home/BrandHome';
import TeamHome from '@/components/home/TeamHome';
import FanHome from '@/components/home/FanHome';

export default function HomeScreen() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || 'fan';

  const homeComponent = (() => {
    switch (role) {
      case 'athlete':
        return <AthleteHome />;
      case 'scout':
        return <ScoutHome />;
      case 'coach':
      case 'trainer':
        return <CoachHome />;
      case 'brand':
        return <BrandHome />;
      case 'team':
      case 'academy':
      case 'gym':
        return <TeamHome />;
      case 'fan':
      default:
        return <FanHome />;
    }
  })();

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      {homeComponent}

      {/* AI Assistant FAB */}
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => router.push('/ai-assistant' as any)}
        activeOpacity={0.8}
      >
        <Sparkles size={22} color="#0a0a0a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  aiFab: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#30D158',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    zIndex: 999,
  },
});
