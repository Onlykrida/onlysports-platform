import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export function useNetworkErrorHandler() {
  useEffect(() => {
    // Handle app state changes to recover from network errors
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[NetworkErrorHandler] App became active, checking connectivity');
        // When app becomes active, errors will be caught by ErrorBoundary
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: any) => {
      const error = event.reason || event.error || event;
      
      if (typeof error === 'object' && error !== null) {
        const errorMessage = error.message || error.toString();
        
        // Check for update-related errors
        if (errorMessage.includes('Remote update request not successful') ||
            errorMessage.includes('java.io.IOException') ||
            errorMessage.includes('Network request failed')) {
          console.log('[NetworkErrorHandler] Caught network/update error, ignoring:', errorMessage);
          
          // Prevent the error from bubbling up
          if (event.preventDefault) {
            event.preventDefault();
          }
          return;
        }
      }
      
      console.error('[NetworkErrorHandler] Unhandled rejection:', error);
    };

    // Add global error handlers
    if (Platform.OS === 'web') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    } else {
      // For React Native - use try-catch since ErrorUtils might not be available
      try {
        const globalAny = global as any;
        const originalHandler = globalAny.ErrorUtils?.getGlobalHandler?.();
        
        if (globalAny.ErrorUtils?.setGlobalHandler) {
          globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
            const errorMessage = error?.message || error?.toString() || '';
            
            // Ignore update-related errors
            if (errorMessage.includes('Remote update request not successful') ||
                errorMessage.includes('java.io.IOException')) {
              console.log('[NetworkErrorHandler] Ignoring update error:', errorMessage);
              return;
            }
            
            // Call original handler for other errors
            if (originalHandler) {
              originalHandler(error, isFatal);
            }
          });
        }
      } catch (e) {
        console.log('[NetworkErrorHandler] ErrorUtils not available');
      }
    }

    return () => {
      subscription.remove();
      
      if (Platform.OS === 'web') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);
}