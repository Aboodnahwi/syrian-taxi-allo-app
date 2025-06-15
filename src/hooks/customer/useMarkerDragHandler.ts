
import { useCallback } from "react";

interface UseMarkerDragHandlerProps {
  locationHook: any;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  toast: (opts: any) => void;
  calculateRoute?: (from?: [number, number], to?: [number, number]) => Promise<void>;
  setManualPinMode: (mode: "none" | "from" | "to") => void;
}

export function useMarkerDragHandler({
  locationHook,
  setMapCenter,
  setMapZoom,
  toast,
  calculateRoute,
  setManualPinMode
}: UseMarkerDragHandlerProps) {
  const handleMarkerDrag = useCallback(
    (type: "from" | "to", lat: number, lng: number, address: string) => {
      const locationText = address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (type === "from") {
        locationHook.setFromCoordinates([lat, lng]);
        locationHook.setFromLocation(locationText);
        setMapCenter([lat, lng]);
        setMapZoom(17);
        toast({
          title: "تم تحديث نقطة الانطلاق بواسطة السحب",
          description: locationText,
          className: "bg-blue-50 border-blue-200 text-blue-800"
        });
        if (locationHook.toCoordinates) {
          calculateRoute?.([lat, lng], locationHook.toCoordinates);
        }
      } else if (type === "to") {
        locationHook.setToCoordinates([lat, lng]);
        locationHook.setToLocation(locationText);
        setMapCenter([lat, lng]);
        setMapZoom(17);
        toast({
          title: "تم تحديث الوجهة بواسطة السحب",
          description: locationText,
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
        if (locationHook.fromCoordinates) {
          calculateRoute?.(locationHook.fromCoordinates, [lat, lng]);
        }
      }
      setTimeout(() => {
        setManualPinMode("none");
      }, 300);
    },
    [
      locationHook,
      setMapCenter,
      setMapZoom,
      toast,
      calculateRoute,
      setManualPinMode
    ]
  );

  return { handleMarkerDrag };
}
