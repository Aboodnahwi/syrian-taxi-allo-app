
import { useCallback } from "react";

interface UseManualPinConfirmProps {
  manualPinMode: "none" | "from" | "to";
  mapCenterRef: React.MutableRefObject<[number, number]>;
  setFromCoordinates: (coords: [number, number]) => void;
  setFromLocation: (location: string) => void;
  setToCoordinates: (coords: [number, number]) => void;
  setToLocation: (location: string) => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  toast: (opts: any) => void;
  setManualPinMode: (mode: "none" | "from" | "to") => void;
  setManualConfirmKey: (k: number) => void;
}

export function useManualPinConfirm({
  manualPinMode,
  mapCenterRef,
  setFromCoordinates,
  setFromLocation,
  setToCoordinates,
  setToLocation,
  setMapCenter,
  setMapZoom,
  toast,
  setManualPinMode,
  setManualConfirmKey,
}: UseManualPinConfirmProps) {
  // جلب العنوان بناءً على إحداثيات الدبوس
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

  // تأكيد الموقع الجديد وتحديث الحالات الرئيسية مباشرة
  const onManualPinConfirm = useCallback(
    async (lat: number, lng: number) => {
      if (manualPinMode === "none") return;
      const address = await fetchAddress(lat, lng);

      if (manualPinMode === "from") {
        setFromCoordinates([lat, lng]);
        setFromLocation(address); // يحدث مربع البحث مباشرة
        toast({
          title: "تم تثبيت نقطة الانطلاق",
          description: address,
          className: "bg-sky-50 border-sky-200 text-sky-800"
        });
      } else if (manualPinMode === "to") {
        setToCoordinates([lat, lng]);
        setToLocation(address); // يحدث مربع البحث مباشرة
        toast({
          title: "تم تثبيت الوجهة",
          description: address,
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
      }

      setManualPinMode("none"); // إخفاء وضع الدبوس اليدوي
      setManualConfirmKey(Date.now()); // لإعادة تحفيز useEffect في الأعلى
      setMapCenter([lat, lng]);
      setMapZoom(17);
      // سيتم إعادة رسم المسار تلقائياً إذا كانت الاحداثيات موجودة للجهتين
    },
    [
      manualPinMode,
      setFromCoordinates,
      setFromLocation,
      setToCoordinates,
      setToLocation,
      setManualPinMode,
      setManualConfirmKey,
      setMapCenter,
      setMapZoom,
      toast,
    ]
  );

  return {
    onManualPinConfirm,
  };
}
