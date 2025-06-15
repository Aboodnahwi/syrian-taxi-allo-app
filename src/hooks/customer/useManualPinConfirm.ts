
/**
 * Hook: useManualPinConfirm
 * مسؤول عن تنفيذ تأكيد موقع الدبوس اليدوي (from/to) وتحديث الحالة وإظهار toast وتنفيذ calculateRoute إن وُجدت.
 */

import { useCallback } from "react";

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
  // توليد نص عنوان الإحداثيات بشكل مباشر
  const getManualAddress = (lat: number, lng: number) =>
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // عند التأكيد، حدّد الإحداثيات وانقل الدالة للمكان المناسب، وأظهر toast، وفعّل حساب المسار
  const onManualPinConfirm = useCallback(
    async () => {
      const [lat, lng] = mapCenterRef.current;
      const manualCoords: [number, number] = [lat, lng];
      const addressText = getManualAddress(lat, lng);
      if (manualPinMode === "from") {
        locationHook.setFromCoordinates(manualCoords);
        locationHook.setFromLocation(addressText);

        setMapCenter(manualCoords);
        setMapZoom(17);
        toast({
          title: "تم تحديد نقطة الانطلاق يدويًا",
          description: addressText,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
        if (locationHook.toCoordinates) {
          await calculateRoute?.(manualCoords, locationHook.toCoordinates);
        }
      } else if (manualPinMode === "to") {
        locationHook.setToCoordinates(manualCoords);
        locationHook.setToLocation(addressText);

        setMapCenter(manualCoords);
        setMapZoom(17);
        toast({
          title: "تم تحديد الوجهة يدويًا",
          description: addressText,
          className: "bg-orange-50 border-orange-200 text-orange-800",
        });
        if (locationHook.fromCoordinates) {
          await calculateRoute?.(locationHook.fromCoordinates, manualCoords);
        }
      }
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
      setManualConfirmKey
    ]
  );
  return { onManualPinConfirm };
}

