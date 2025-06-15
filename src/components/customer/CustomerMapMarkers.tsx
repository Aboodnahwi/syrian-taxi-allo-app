
import React from 'react';

interface CustomerMapMarkersProps {
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  fromLocation: string;
  toLocation: string;
  manualPinMode?: "none" | "from" | "to";
  mapCenter?: [number, number];
  onMarkerClick?: (type: "from" | "to") => void;
}

// Helper: get marker data for "from" or "to"
function getMarker({
  id,
  position,
  popup,
  color,
  onMarkerClick,
}: {
  id: "from" | "to";
  position: [number, number];
  popup: string;
  color: string;
  onMarkerClick?: (type: "from" | "to") => void;
}) {
  return {
    id,
    position,
    popup,
    draggable: false,
    icon: {
      html: `<div style="background:${color};width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">${id === "from" ? "📍" : "🎯"}</div>`,
      iconSize: [32, 42] as [number, number],
      iconAnchor: [16, 40] as [number, number]
    },
    onClick: () => {
      console.log(`[CustomerMapMarkers] Pin ${id} clicked`);
      if (onMarkerClick) {
        onMarkerClick(id);
      }
    }
  };
}

const useCustomerMapMarkers = ({
  fromCoordinates,
  toCoordinates,
  fromLocation,
  toLocation,
  manualPinMode,
  mapCenter,
  onMarkerClick
}: CustomerMapMarkersProps) => {

  // في وضع التحديد اليدوي: لا نرسم أي دبوس عادي على الخريطة (يظهر الدبوس فقط Overlay في منتصف الشاشة)
  if (manualPinMode === "from" || manualPinMode === "to") {
    return [];
  }
  
  // الوضع العادي: دبابيس ثابتة فقط حسب الإحداثيات
  return [
    ...(fromCoordinates ? [
      getMarker({
        id: "from",
        position: fromCoordinates,
        popup: fromLocation || "نقطة الانطلاق",
        color: "#0ea5e9",
        onMarkerClick
      })
    ] : []),
    ...(toCoordinates ? [
      getMarker({
        id: "to",
        position: toCoordinates,
        popup: toLocation || "الوجهة",
        color: "#f59e42",
        onMarkerClick
      })
    ] : []),
  ];
};

export default useCustomerMapMarkers;
