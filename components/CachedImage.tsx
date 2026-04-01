import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { User, ImageIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface CachedImageProps {
  source: string | null | undefined;
  style?: ImageStyle;
  size?: number;
  placeholder?: 'avatar' | 'post' | 'cover';
  borderRadius?: number;
}

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export default function CachedImage({
  source,
  style,
  size,
  placeholder = 'avatar',
  borderRadius,
}: CachedImageProps) {
  const [hasError, setHasError] = useState(false);

  const imageSize = size || (style as any)?.width || 48;
  const radius = borderRadius ?? (placeholder === 'avatar' ? imageSize / 2 : theme.borderRadius.md);

  const containerStyle = {
    width: imageSize,
    height: placeholder === 'cover' ? imageSize * 0.4 : imageSize,
    borderRadius: radius,
    overflow: 'hidden' as const,
    backgroundColor: theme.colors.surface,
  };

  if (!source || hasError) {
    return (
      <View style={[styles.placeholder, containerStyle, style as any]}>
        {placeholder === 'avatar' ? (
          <User size={imageSize * 0.4} color={theme.colors.textMuted} />
        ) : (
          <ImageIcon size={imageSize * 0.3} color={theme.colors.textMuted} />
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: source }}
      style={[containerStyle, style]}
      contentFit={placeholder === 'cover' ? 'cover' : 'cover'}
      placeholder={{ blurhash }}
      transition={200}
      cachePolicy="memory-disk"
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
