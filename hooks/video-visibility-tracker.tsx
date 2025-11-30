import { useCallback, useRef, useState } from 'react';
import { ViewToken } from 'react-native';

export interface VisibilityState {
  visibleVideoId: string | null;
}

export function useVideoVisibilityTracker() {
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
    minimumViewTime: 100,
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    console.log('[VisibilityTracker] Viewable items changed:', viewableItems.length);
    
    const visibleVideoPosts = viewableItems.filter(
      (item) => item.isViewable && item.item?.media?.type === 'video'
    );

    if (visibleVideoPosts.length > 0) {
      const firstVisibleVideo = visibleVideoPosts[0].item.id;
      console.log('[VisibilityTracker] Setting visible video:', firstVisibleVideo);
      setVisibleVideoId(firstVisibleVideo);
    } else {
      console.log('[VisibilityTracker] No videos visible');
      setVisibleVideoId(null);
    }
  }, []);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: viewabilityConfig.current,
      onViewableItemsChanged,
    },
  ]);

  return {
    visibleVideoId,
    viewabilityConfigCallbackPairs: viewabilityConfigCallbackPairs.current,
  };
}
