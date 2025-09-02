import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Sport theme gradient colors

interface BackgroundGradientProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#003300', '#000000']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default BackgroundGradient;