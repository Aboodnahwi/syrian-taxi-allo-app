
import { useCallback } from "react";

/**
 * Hook: useManualPinConfirm
 * مسؤول عن تنفيذ تأكيد موقع الدبوس اليدوي (from/to) وتحديث الحالة وإظهار toast وتنفيذ calculateRoute إن وُجدت.
 */

interface UseManualPinConfirmProps {
  manualPinMode: "none" | "from" | "to";
  mapCenterRef: React.MutableRefObject<[number, number]>;
  locationHook: any;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  toast: (opts: any) => void;
  calculateRoute?: (from?: [number, number], to?: [number, number]) => Promise<void>;
  setManualPinMode: (mode: "none" | "from" | "to") => void;
  setManualConfirmKey: React.Dispatch<React.SetStateAction<number>>;
}

export function useManualPinConfirm({
  manualPinMode,
  mapCenterRef,
  locationHook,
  setMapCenter,
  setMapZoom,
  toast,
  calculateRoute,
  setManualPinMode,
  setManualConfirmKey,
}: UseManualPinConfirmProps) {
  // دالة لجلب العنوان من الإحداثيات
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // عند التأكيد، جلب إحداثيات منتصف الخريطة وقت الضغط وحفظها
  const onManualPinConfirm = useCallback(
    async () => {
      // دائماً نأخذ الإحداثيات من mapCenterRef وقت التأكيد
      if (!mapCenterRef.current) {
        toast({
          title: "خطأ",
          description: "تعذر الحصول على إحداثيات الدبوس",
          variant: "destructive",
        });
        return;
      }
      const [lat, lng] = mapCenterRef.current;
      const coords: [number, number] = [lat, lng];

      // سجل الإحداثيات بوضوح لحظة التأكيد
      console.log(`[useManualPinConfirm] تأكيد الدبوس اليدوي لـ ${manualPinMode}:`, coords);

      // جلب العنوان الحالي
      const addressText = await fetchAddress(lat, lng);

      if (manualPinMode === "from") {
        locationHook.setFromCoordinates(coords);
        locationHook.setFromLocation(addressText);
        toast({
          title: "تم تحديد نقطة الانطلاق يدويًا",
          description: addressText,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
        if (locationHook.toCoordinates) {
          try {
            if (locationHook.calculateRoute) {
              await locationHook.calculateRoute(coords, locationHook.toCoordinates);
            } else if (calculateRoute) {
              await calculateRoute(coords, locationHook.toCoordinates);
            }
          } catch (error) {
            console.error('[useManualPinConfirm] Error calculating route:', error);
          }
        }
      } else if (manualPinMode === "to") {
        locationHook.setToCoordinates(coords);
        locationHook.setToLocation(addressText);
        toast({
          title: "تم تحديد الوجهة يدويًا",
          description: addressText,
          className: "bg-orange-50 border-orange-200 text-orange-800",
        });
        if (locationHook.fromCoordinates) {
          try {
            if (locationHook.calculateRoute) {
              await locationHook.calculateRoute(locationHook.fromCoordinates, coords);
            } else if (calculateRoute) {
              await calculateRoute(locationHook.fromCoordinates, coords);
            }
          } catch (error) {
            console.error('[useManualPinConfirm] Error calculating route:', error);
          }
        }
      }
      // الخروج من وضع الدبوس اليدوي بعد التأكيد
      setTimeout(() => {
        setManualPinMode("none");
        setManualConfirmKey((k) => k + 1);
      }, 200);
    },
    [
      manualPinMode,
      mapCenterRef,
      locationHook,
      setMapCenter,
      setMapZoom,
      toast,
      calculateRoute,
      setManualPinMode,
      setManualConfirmKey,
      fetchAddress
    ]
  );

  return { onManualPinConfirm };
}
