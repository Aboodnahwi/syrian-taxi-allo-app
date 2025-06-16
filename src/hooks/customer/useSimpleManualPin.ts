
import { useState, useCallback } from 'react';

interface UseSimpleManualPinProps {
  onConfirm: (lat: number, lng: number, address: string) => void;
  toast: (opts: any) => void;
}

export const useSimpleManualPin = ({ onConfirm, toast }: UseSimpleManualPinProps) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [currentCoordinates, setCurrentCoordinates] = useState<[number, number] | null>(null);

  // جلب العنوان مع عرض الإحداثيات
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const address = data.display_name || coordinates;
      return { address, coordinates };
    } catch {
      const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      return { address: coordinates, coordinates };
    }
  };

  // بدء وضع الدبوس اليدوي
  const startManualMode = useCallback((type: 'from' | 'to') => {
    setIsManualMode(true);
    setCurrentAddress("");
    setCurrentCoordinates(null);
    toast({
      title: type === 'from' ? "حدد نقطة الانطلاق" : "حدد الوجهة",
      description: "حرك الخريطة للموقع المطلوب ثم اضغط تأكيد",
      className: type === 'from' ? "bg-sky-50 border-sky-200 text-sky-800" : "bg-orange-50 border-orange-200 text-orange-800"
    });
  }, [toast]);

  // تحديث العنوان والإحداثيات أثناء تحريك الخريطة
  const updateAddress = useCallback(async (lat: number, lng: number) => {
    if (!isManualMode) return;
    
    // تحديث الإحداثيات فوراً للاستجابة السريعة
    setCurrentCoordinates([lat, lng]);
    
    // جلب العنوان مع الإحداثيات
    const { address, coordinates } = await fetchAddress(lat, lng);
    setCurrentAddress(`${address}\n📍 ${coordinates}`);
  }, [isManualMode]);

  // تأكيد الموقع وحفظ الإحداثيات في مربع البحث
  const confirmLocation = useCallback(async (lat: number, lng: number) => {
    if (!isManualMode || !currentCoordinates) return;
    
    const { address } = await fetchAddress(lat, lng);
    
    // إرسال العنوان مع الإحداثيات للتأكيد
    onConfirm(lat, lng, address);
    
    toast({
      title: "تم حفظ الموقع",
      description: `الإحداثيات: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
    
    setIsManualMode(false);
    setCurrentAddress("");
    setCurrentCoordinates(null);
  }, [isManualMode, currentCoordinates, onConfirm, toast]);

  // إلغاء الوضع اليدوي
  const cancelManualMode = useCallback(() => {
    setIsManualMode(false);
    setCurrentAddress("");
    setCurrentCoordinates(null);
  }, []);

  return {
    isManualMode,
    currentAddress,
    currentCoordinates,
    startManualMode,
    updateAddress,
    confirmLocation,
    cancelManualMode
  };
};
