
import { useState, useCallback } from 'react';

interface UseSimpleManualPinProps {
  onConfirm: (lat: number, lng: number, address: string) => void;
  toast: (opts: any) => void;
}

export const useSimpleManualPin = ({ onConfirm, toast }: UseSimpleManualPinProps) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  // جلب العنوان
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

  // بدء وضع الدبوس اليدوي
  const startManualMode = useCallback((type: 'from' | 'to') => {
    setIsManualMode(true);
    setCurrentAddress("");
    toast({
      title: type === 'from' ? "حدد نقطة الانطلاق" : "حدد الوجهة",
      description: "حرك الخريطة للموقع المطلوب ثم اضغط تأكيد",
      className: type === 'from' ? "bg-sky-50 border-sky-200 text-sky-800" : "bg-orange-50 border-orange-200 text-orange-800"
    });
  }, [toast]);

  // تحديث العنوان أثناء تحريك الخريطة
  const updateAddress = useCallback(async (lat: number, lng: number) => {
    if (!isManualMode) return;
    const address = await fetchAddress(lat, lng);
    setCurrentAddress(address);
  }, [isManualMode]);

  // تأكيد الموقع
  const confirmLocation = useCallback(async (lat: number, lng: number) => {
    if (!isManualMode) return;
    const address = await fetchAddress(lat, lng);
    onConfirm(lat, lng, address);
    setIsManualMode(false);
    setCurrentAddress("");
  }, [isManualMode, onConfirm]);

  // إلغاء الوضع اليدوي
  const cancelManualMode = useCallback(() => {
    setIsManualMode(false);
    setCurrentAddress("");
  }, []);

  return {
    isManualMode,
    currentAddress,
    startManualMode,
    updateAddress,
    confirmLocation,
    cancelManualMode
  };
};
