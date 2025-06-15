
import { useCallback, useEffect } from 'react';

interface UseGlobalMarkerDragHandlerProps {
  locationHook: any;
  toast: (options: any) => void;
}

export const useGlobalMarkerDragHandler = ({ locationHook, toast }: UseGlobalMarkerDragHandlerProps) => {
  // معالج سحب الدبابيس - محسن لضمان التحديث الفوري
  const handleMarkerDrag = useCallback(async (type: "from" | "to", lat: number, lng: number, address: string) => {
    console.log(`[useGlobalMarkerDragHandler] Marker ${type} dragged to:`, lat, lng, address);
    
    const newCoordinates: [number, number] = [lat, lng];
    
    if (type === "from") {
      console.log(`[useGlobalMarkerDragHandler] Updating FROM coordinates to:`, newCoordinates);
      locationHook.setFromCoordinates(newCoordinates);
      locationHook.setFromLocation(address);
      
      // إظهار toast لتأكيد التحديث
      toast({
        title: "تم تحديث نقطة الانطلاق",
        description: address,
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
      
      // حساب المسار إذا كانت الوجهة موجودة
      if (locationHook.toCoordinates) {
        console.log(`[useGlobalMarkerDragHandler] Calculating route from ${newCoordinates} to ${locationHook.toCoordinates}`);
        try {
          await locationHook.calculateRoute(newCoordinates, locationHook.toCoordinates);
        } catch (error) {
          console.error(`[useGlobalMarkerDragHandler] Error calculating route:`, error);
        }
      }
    } else if (type === "to") {
      console.log(`[useGlobalMarkerDragHandler] Updating TO coordinates to:`, newCoordinates);
      locationHook.setToCoordinates(newCoordinates);
      locationHook.setToLocation(address);
      
      // إظهار toast لتأكيد التحديث
      toast({
        title: "تم تحديث الوجهة",
        description: address,
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });
      
      // حساب المسار إذا كانت نقطة الانطلاق موجودة
      if (locationHook.fromCoordinates) {
        console.log(`[useGlobalMarkerDragHandler] Calculating route from ${locationHook.fromCoordinates} to ${newCoordinates}`);
        try {
          await locationHook.calculateRoute(locationHook.fromCoordinates, newCoordinates);
        } catch (error) {
          console.error(`[useGlobalMarkerDragHandler] Error calculating route:`, error);
        }
      }
    }
  }, [locationHook, toast]);

  // تعيين معالج السحب في النافذة العامة ليتمكن useMapMarkers من الوصول إليه
  useEffect(() => {
    console.log("[useGlobalMarkerDragHandler] Setting window.handleMarkerDrag");
    (window as any).handleMarkerDrag = handleMarkerDrag;
    return () => {
      console.log("[useGlobalMarkerDragHandler] Cleaning up window.handleMarkerDrag");
      delete (window as any).handleMarkerDrag;
    };
  }, [handleMarkerDrag]);

  return { handleMarkerDrag };
};
