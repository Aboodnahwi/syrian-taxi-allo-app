
import { useCallback } from "react";

interface UseManualPinConfirmProps {
  manualPinMode: "none" | "from" | "to";
  mapCenterRef: React.MutableRefObject<[number, number]>;
  locationHook: any;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  toast: (opts: any) => void;
  calculateRoute: () => void;
  setManualPinMode: (mode: "none" | "from" | "to") => void;
  setManualConfirmKey: (k: number) => void;
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
  // جلب العنوان مباشرة بناءً على إحداثيات التثبيت
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const onManualPinConfirm = useCallback(
    async (lat: number, lng: number) => {
      if (manualPinMode === "none") return;
      // جلب العنوان
      const address = await fetchAddress(lat, lng);
      // تثبيت الدبوس وتحديث العنوان
      if (manualPinMode === "from") {
        locationHook.setFromCoordinates([lat, lng]);
        locationHook.setFromLocation(address);
        toast({
          title: "تم تثبيت نقطة الانطلاق",
          description: address,
          className: "bg-sky-50 border-sky-200 text-sky-800"
        });
      } else if (manualPinMode === "to") {
        locationHook.setToCoordinates([lat, lng]);
        locationHook.setToLocation(address);
        toast({
          title: "تم تثبيت الوجهة",
          description: address,
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
      }
      // إغلاق وضع الدبوس اليدوي
      setManualPinMode("none");
      setManualConfirmKey((k) => k + 1);
      // تكبير الخريطة إلى النقطة الجديدة
      setMapCenter([lat, lng]);
      setMapZoom(17);
      // حساب ورسم خط السير
      setTimeout(() => {
        calculateRoute();
      }, 200);
    },
    [
      manualPinMode,
      locationHook,
      setManualPinMode,
      setManualConfirmKey,
      setMapCenter,
      setMapZoom,
      toast,
      calculateRoute,
    ]
  );

  return {
    onManualPinConfirm,
  };
}
