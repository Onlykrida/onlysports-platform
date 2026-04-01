import { Platform } from 'react-native';

/**
 * Shared FlatList performance props.
 * Spread these into any FlatList to get optimized rendering.
 *
 * Usage: <FlatList {...FLATLIST_PERF_PROPS} data={...} renderItem={...} />
 */
export const FLATLIST_PERF_PROPS = {
  maxToRenderPerBatch: 8,
  windowSize: 5,
  initialNumToRender: 10,
  removeClippedSubviews: Platform.OS === 'android',
  updateCellsBatchingPeriod: 50,
} as const;

/**
 * For chat/message lists that scroll to bottom
 */
export const CHAT_FLATLIST_PROPS = {
  maxToRenderPerBatch: 15,
  windowSize: 10,
  initialNumToRender: 20,
  removeClippedSubviews: Platform.OS === 'android',
  inverted: false,
} as const;
