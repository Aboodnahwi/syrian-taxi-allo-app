
import { useEffect } from "react";

interface UseAutoCenterOnUserParams {
  setMapCenter: (coords: [number, number]) => void;
  setFromCoordinates: (coords: [number, number]) => void;
  setFromLocation: (loc: string) => void;
  toast?: (opts: any) => void;
  zoomLevel?: number;
  setZoomLevel?: (z: number) => void;
}

/**
 * Hook to auto-center map to user's position on mount and set as 'from' location.
 */
export function useAutoCenterOnUser({
  setMapCenter,
  setFromCoordinates,
  setFromLocation,
  toast,
  zoomLevel,
  setZoomLevel
}: UseAutoCenterOnUserParams) {
  useEffect(() => {
    if (!navigator.geolocation) {
      toast?.({
        title: "خدمة الموقع غير مدعومة",
        description: "المتصفح لا يدعم خدمة المواقع.",
        variant: "destructive"
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        setFromCoordinates([lat, lng]);
        setFromLocation("موقعي الحالي");
        if (setZoomLevel) setZoomLevel(17); // اختياري، لو استخدمت
      },
      (error) => {
        toast?.({
          title: "تعذر تحديد موقعك",
          description: "يرجى السماح بالوصول لخدمات الموقع.",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true }
    );
    // eslint-disable-next-line
  }, []);
}
