
import React from 'react';

interface CustomerMapMarkersProps {
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  fromLocation: string;
  toLocation: string;
  manualPinMode?: "none" | "from" | "to";
  mapCenter?: [number, number]; // مركز الخريطة الحالي
  onMarkerClick?: (type: "from" | "to") => void;
}

// ترجّع فقط بيانات الدبابيس ولا تعرض أي jsx

const useCustomerMapMarkers = ({
  fromCoordinates,
  toCoordinates,
  fromLocation,
  toLocation,
  manualPinMode,
  mapCenter,
  onMarkerClick
}: CustomerMapMarkersProps) => {
  if (manualPinMode === "from" && mapCenter) {
    return [{
      id: "from" as const,
      position: mapCenter,
      popup: fromLocation || "نقطة الانطلاق",
      draggable: false,
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
      position: mapCenter,
      popup: toLocation || "الوجهة",
      draggable: false,
      icon: {
        html: '<div style="background:#f59e42;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">🎯</div>',
        iconSize: [32, 42] as [number, number],
        iconAnchor: [16, 40] as [number, number]
      }
    }];
  }
  // الوضع العادي: إحداثيات ثابتة لا تقبل السحب، لكن سيتم التعامل مع onMarkerClick في CustomerMapPanel
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
};

export default useCustomerMapMarkers;
