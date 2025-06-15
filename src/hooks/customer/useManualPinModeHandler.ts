
/**
 * Hook: useManualPinModeHandler
 * للتحكم في نمط "تحديد الدبوس يدويًا" وتحديث حالة الخريطة + إظهار toast مناسب
 */

import { useCallback } from "react";

interface UseManualPinModeHandlerProps {
  setManualPinMode: (mode: "none" | "from" | "to") => void;
  setFromCoordinates: (coords: [number, number]) => void;
  setToCoordinates: (coords: [number, number]) => void;
  setFromLocation: (location: string) => void;
  setToLocation: (location: string) => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  showToast: (opts: any) => void;
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  mapCenter: [number, number];
}

export function useManualPinModeHandler({
  setManualPinMode,
  setFromCoordinates,
  setToCoordinates,
  setFromLocation,
  setToLocation,
  setMapCenter,
  setMapZoom,
  showToast,
  fromCoordinates,
  toCoordinates,
  mapCenter,
}: UseManualPinModeHandlerProps) {
  // التعامل مع وضع الدبوس للانطلاق
  const handleManualFromPin = useCallback(() => {
    setManualPinMode("from");
    if (fromCoordinates) {
      setMapCenter(fromCoordinates);
      setMapZoom(17);
    }
    showToast({
      title: "حدد نقطة الانطلاق يدويًا",
      description: "حرك الخريطة حتى النقطة المطلوبة ثم أكد",
      className: "bg-blue-50 border-blue-200 text-blue-800",
    });
  }, [setManualPinMode, setMapCenter, setMapZoom, showToast, fromCoordinates]);

  // التعامل مع وضع الدبوس للوجهة
  const handleManualToPin = useCallback(() => {
    setManualPinMode("to");
    if (toCoordinates) {
      setMapCenter(toCoordinates);
      setMapZoom(17);
    }
    showToast({
      title: "حدد الوجهة يدويًا",
      description: "حرك الخريطة حتى الوجهة المطلوبة ثم أكد",
      className: "bg-orange-50 border-orange-200 text-orange-800",
    });
  }, [setManualPinMode, setMapCenter, setMapZoom, showToast, toCoordinates]);

  return { handleManualFromPin, handleManualToPin };
}

