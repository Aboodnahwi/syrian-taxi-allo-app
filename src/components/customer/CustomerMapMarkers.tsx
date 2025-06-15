
import React from 'react';

interface CustomerMapMarkersProps {
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  fromLocation: string;
  toLocation: string;
  manualPinMode?: "none" | "from" | "to";
  mapCenter?: [number, number];
}

// Helper: get marker data for "from" or "to"
function getMarker({
  id,
  position,
  popup,
  color,
}: {
  id: "from" | "to";
  position: [number, number];
  popup: string;
  color: string;
}) {
  return {
    id,
    position,
    popup,
    draggable: true,
    icon: {
      html: `<div style="background:${color};width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;cursor:pointer;">${id === "from" ? "📍" : "🎯"}</div>`,
      iconSize: [32, 42] as [number, number],
      iconAnchor: [16, 40] as [number, number]
    },
  };
}

const useCustomerMapMarkers = ({
  fromCoordinates,
  toCoordinates,
  fromLocation,
  toLocation,
  manualPinMode,
}: CustomerMapMarkersProps) => {

  // في وضع التحديد اليدوي: لا نرسم أي دبوس عادي على الخريطة (يظهر الدبوس فقط Overlay في منتصف الشاشة)
  if (manualPinMode === "from" || manualPinMode === "to") {
    return [];
  }
  
  // الوضع العادي: دبابيس قابلة للسحب حسب الإحداثيات
  return [
    ...(fromCoordinates ? [
      getMarker({
        id: "from",
        position: fromCoordinates,
        popup: fromLocation || "نقطة الانطلاق",
        color: "#0ea5e9",
      })
    ] : []),
    ...(toCoordinates ? [
      getMarker({
        id: "to",
        position: toCoordinates,
        popup: toLocation || "الوجهة",
        color: "#f59e42",
      })
    ] : []),
  ];
};

export default useCustomerMapMarkers;
