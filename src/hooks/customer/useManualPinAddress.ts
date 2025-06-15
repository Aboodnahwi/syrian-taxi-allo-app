
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseManualPinAddressProps {
  mapCenter: [number, number];
  manualPinMode?: "none" | "from" | "to";
}

export const useManualPinAddress = ({ mapCenter, manualPinMode }: UseManualPinAddressProps) => {
  const [manualPinAddress, setManualPinAddress] = useState<string>("");
  const [manualPinCoordinates, setManualPinCoordinates] = useState<[number, number] | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastFetchedRef = useRef<string>("");

  // Debounced address fetching function
  const debouncedFetchAddress = useCallback(
    (lat: number, lng: number) => {
      const coordsKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      
      // تجنب الجلب المتكرر لنفس الإحداثيات
      if (lastFetchedRef.current === coordsKey) return;
      
      // إلغاء الطلب السابق
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // تحديث الإحداثيات فوراً
      setManualPinCoordinates([lat, lng]);
      
      // debounce address fetching لتقليل استهلاك API
      debounceRef.current = setTimeout(async () => {
        try {
          lastFetchedRef.current = coordsKey;
          console.log(`[useManualPinAddress] Fetching address for: ${lat}, ${lng}`);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setManualPinAddress(data.display_name);
          } else {
            setManualPinAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch (error) {
          console.error('[useManualPinAddress] Error fetching address:', error);
          setManualPinAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      }, 300); // 300ms debounce delay
    },
    []
  );

  useEffect(() => {
    if (!manualPinMode || manualPinMode === "none") {
      setManualPinAddress("");
      setManualPinCoordinates(null);
      lastFetchedRef.current = "";
      return;
    }

    const [lat, lng] = mapCenter;
    
    // تحديث الإحداثيات فوراً لضمان استجابة سريعة
    setManualPinCoordinates([lat, lng]);
    
    // جلب العنوان مع debouncing
    debouncedFetchAddress(lat, lng);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [mapCenter, manualPinMode, debouncedFetchAddress]);

  // تنظيف timeout عند انتهاء الكومبوننت
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { manualPinAddress, manualPinCoordinates };
};
