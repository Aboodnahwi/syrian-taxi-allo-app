
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
  // دالة جلب العنوان من الإحداثيات
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // عند التأكيد، حدّد الإحداثيات وانقل الدالة للمكان المناسب، وأظهر toast، وفعّل حساب المسار
  const onManualPinConfirm = useCallback(
    async (lat: number, lng: number) => {
      console.log(`[useManualPinConfirm] Confirming position: ${lat}, ${lng} for ${manualPinMode}`);
      
      const manualCoords: [number, number] = [lat, lng];
      const addressText = await fetchAddress(lat, lng);
      
      if (manualPinMode === "from") {
        console.log(`[useManualPinConfirm] Setting FROM coordinates:`, manualCoords);
        
        // تحديث الإحداثيات والعنوان
        locationHook.setFromCoordinates(manualCoords);
        locationHook.setFromLocation(addressText);

        toast({
          title: "تم تحديد نقطة الانطلاق يدويًا",
          description: addressText,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
        
        // حساب المسار فوراً إذا كانت الوجهة موجودة
        if (locationHook.toCoordinates) {
          console.log(`[useManualPinConfirm] Calculating route immediately from ${manualCoords} to ${locationHook.toCoordinates}`);
          try {
            // استخدام calculateRoute مباشرة مع الإحداثيات الجديدة
            if (locationHook.calculateRoute) {
              await locationHook.calculateRoute(manualCoords, locationHook.toCoordinates);
            } else if (calculateRoute) {
              await calculateRoute(manualCoords, locationHook.toCoordinates);
            }
          } catch (error) {
            console.error('[useManualPinConfirm] Error calculating route:', error);
          }
        }
        
      } else if (manualPinMode === "to") {
        console.log(`[useManualPinConfirm] Setting TO coordinates:`, manualCoords);
        
        // تحديث الإحداثيات والعنوان
        locationHook.setToCoordinates(manualCoords);
        locationHook.setToLocation(addressText);

        toast({
          title: "تم تحديد الوجهة يدويًا",
          description: addressText,
          className: "bg-orange-50 border-orange-200 text-orange-800",
        });
        
        // حساب المسار فوراً إذا كانت نقطة الانطلاق موجودة
        if (locationHook.fromCoordinates) {
          console.log(`[useManualPinConfirm] Calculating route immediately from ${locationHook.fromCoordinates} to ${manualCoords}`);
          try {
            // استخدام calculateRoute مباشرة مع الإحداثيات الجديدة
            if (locationHook.calculateRoute) {
              await locationHook.calculateRoute(locationHook.fromCoordinates, manualCoords);
            } else if (calculateRoute) {
              await calculateRoute(locationHook.fromCoordinates, manualCoords);
            }
          } catch (error) {
            console.error('[useManualPinConfirm] Error calculating route:', error);
          }
        }
      }
      
      // الخروج من وضع التحديد اليدوي مع تأخير قصير
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
