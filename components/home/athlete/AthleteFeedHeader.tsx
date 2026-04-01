import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import SectionHeader from '@/components/home/shared/SectionHeader';

const AthleteFeedHeader = React.memo(function AthleteFeedHeader() {
  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="YOUR FEED" />
    </View>
  );
});

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});

export default AthleteFeedHeader;
