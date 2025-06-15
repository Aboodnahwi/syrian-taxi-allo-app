
/**
 * Hook: useLocationSelectHandler
 * مسؤول عن التعامل مع اختيار الموقع من الاقتراحات (suggestions) وتحديث الحالة وتكبير الخريطة للموضع المحدد.
 */

import { useCallback } from "react";

interface UseLocationSelectHandlerProps {
  locationHook: any;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  mapZoomToFromRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef: React.MutableRefObject<(() => void) | undefined>;
  toast: (opts: any) => void;
}

export function useLocationSelectHandler({
  locationHook,
  setMapCenter,
  setMapZoom,
  mapZoomToFromRef,
  mapZoomToToRef,
  toast,
}: UseLocationSelectHandlerProps) {
  const selectLocation = useCallback(
    (suggestion: any, type: "from" | "to") => {
      console.log(
        "[LocationSelectionHandler] Selecting location:",
        suggestion.name,
        "for",
        type
      );
      if (type === "from") {
        locationHook.setFromLocation(suggestion.name);
        locationHook.setFromCoordinates([suggestion.lat, suggestion.lon]);
        locationHook.setShowFromSuggestions(false);
        setMapCenter([suggestion.lat, suggestion.lon]);
        setMapZoom(17);
        locationHook.setUserLocated(true);
        setTimeout(() => {
          mapZoomToFromRef.current?.();
        }, 250);
      } else {
        locationHook.setToLocation(suggestion.name);
        locationHook.setToCoordinates([suggestion.lat, suggestion.lon]);
        locationHook.setShowToSuggestions(false);
        setMapCenter([suggestion.lat, suggestion.lon]);
        setMapZoom(17);
        setTimeout(() => {
          mapZoomToToRef.current?.();
        }, 250);
        toast({
          title: "تم تحديد الوجهة",
          description: suggestion.name.substring(0, 50) + "...",
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
      }
    },
    [
      locationHook,
      setMapCenter,
      setMapZoom,
      mapZoomToFromRef,
      mapZoomToToRef,
      toast
    ]
  );

  return { selectLocation };
}

