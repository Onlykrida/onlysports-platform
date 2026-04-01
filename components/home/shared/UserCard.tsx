import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CachedImage from '@/components/CachedImage';
import { theme } from '@/constants/theme';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  onPress: (userId: string) => void;
  variant?: 'compact' | 'full';
}

const UserCard: React.FC<UserCardProps> = ({ user, onPress, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => onPress(user.id)}
        activeOpacity={0.7}
      >
        <CachedImage source={user.avatar} size={32} placeholder="avatar" />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.compactMeta} numberOfLines={1} ellipsizeMode="tail">
            {user.sport || 'Athlete'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.fullCard} onPress={() => onPress(user.id)} activeOpacity={0.7}>
      <CachedImage source={user.avatar} size={48} placeholder="avatar" />
      <Text style={styles.fullName} numberOfLines={1}>
        {user.name}
      </Text>
      <Text style={styles.fullRole} numberOfLines={1} ellipsizeMode="tail">
        {user.role?.toUpperCase()}
      </Text>
      {user.sport && (
        <Text style={styles.fullSport} numberOfLines={1} ellipsizeMode="tail">
          {user.sport}
        </Text>
      )}
      <TouchableOpacity style={styles.viewProfileBtn} onPress={() => onPress(user.id)}>
        <Text style={styles.viewProfileText}>VIEW PROFILE</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact variant (horizontal chip)
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    paddingRight: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
    width: 160,
    gap: theme.spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  compactMeta: {
    fontSize: 9,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },

  // Full variant (vertical card)
  fullCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: 130,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
  },
  fullName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  fullRole: {
    fontSize: 9,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.warning,
    letterSpacing: 1,
    marginBottom: 2,
  },
  fullSport: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  viewProfileBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  viewProfileText: {
    fontSize: 8,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
});

export default React.memo(UserCard);
