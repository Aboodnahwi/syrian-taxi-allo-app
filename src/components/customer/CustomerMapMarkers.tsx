
import React from 'react';

interface CustomerMapMarkersProps {
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  fromLocation: string;
  toLocation: string;
  manualPinMode?: "none" | "from" | "to";
  mapCenter?: [number, number]; // إضافة mapCenter هنا
}

// دائما شغّل جميع الهوكات بدون إرجاع مبكر
const useCustomerMapMarkers = ({
  fromCoordinates,
  toCoordinates,
  fromLocation,
  toLocation,
  manualPinMode,
  mapCenter
}: CustomerMapMarkersProps) => {
  const markers = React.useMemo(() => {
    // في وضع تحديد الدبوس اليدوي، يجب أن يكون الدبوس دائماً في مركز الخريطة
    if (manualPinMode === "from" && mapCenter) {
      return [{
        id: "from" as const,
        position: mapCenter, // مركز الخريطة فور كل تصيير
        popup: fromLocation || "نقطة الانطلاق",
        draggable: true,
        icon: {
          html: '<div style="background:#0ea5e9;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">📍</div>',
          iconSize: [32, 42] as [number, number],
          iconAnchor: [16, 40] as [number, number]
        }
      }];
    }

    if (manualPinMode === "to" && mapCenter) {
      return [{
        id: "to" as const,
        position: mapCenter, // مركز الخريطة فور كل تصيير
        popup: toLocation || "الوجهة",
        draggable: true,
        icon: {
          html: '<div style="background:#f59e42;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">🎯</div>',
          iconSize: [32, 42] as [number, number],
          iconAnchor: [16, 40] as [number, number]
        }
      }];
    }

    // الوضع العادي: أظهر كل الدبابيس (ولا أي واحد قابل للسحب!)
    return [
      ...(fromCoordinates ? [{
        id: "from" as const,
        position: fromCoordinates,
        popup: fromLocation || "نقطة الانطلاق",
        draggable: false,
        icon: {
          html: '<div style="background:#0ea5e9;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">📍</div>',
          iconSize: [32, 42] as [number, number],
          iconAnchor: [16, 40] as [number, number]
        }
      }] : []),
      ...(toCoordinates ? [{
        id: "to" as const,
        position: toCoordinates,
        popup: toLocation || "الوجهة",
        draggable: false,
        icon: {
          html: '<div style="background:#f59e42;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">🎯</div>',
          iconSize: [32, 42] as [number, number],
          iconAnchor: [16, 40] as [number, number]
        }
      }] : []),
    ];
  }, [fromCoordinates, toCoordinates, fromLocation, toLocation, manualPinMode, mapCenter]);

  return markers;
};

export default useCustomerMapMarkers;
