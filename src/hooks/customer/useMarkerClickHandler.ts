
import { useCallback } from 'react';

interface UseMarkerClickHandlerProps {
  locationHandlers: {
    handleMarkerDrag?: (type: 'from' | 'to') => void;
  } | null;
}

export const useMarkerClickHandler = ({ locationHandlers }: UseMarkerClickHandlerProps) => {
  const handleMapMarkerClick = useCallback((type: "from" | "to") => {
    console.log(`[useMarkerClickHandler] Marker ${type} clicked, activating manual mode`);
    
    if (locationHandlers?.handleMarkerDrag) {
      locationHandlers.handleMarkerDrag(type);
    } else {
      console.log("[useMarkerClickHandler] locationHandlers.handleMarkerDrag not ready, will retry");
      // إعادة المحاولة بعد فترة قصيرة إذا لم تكن الـ handlers جاهزة
      setTimeout(() => {
        if (locationHandlers?.handleMarkerDrag) {
          locationHandlers.handleMarkerDrag(type);
        }
      }, 100);
    }
  }, [locationHandlers]);

  return { handleMapMarkerClick };
};
