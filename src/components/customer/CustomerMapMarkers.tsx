
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
  draggable,
}: {
  id: "from" | "to";
  position: [number, number];
  popup: string;
  color: string;
  draggable: boolean;
}) {
  return {
    id,
    position,
    popup,
    draggable: draggable,
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

  const markers = [];
  
  // Show 'from' marker if it exists and we are not currently setting it manually
  if (fromCoordinates && manualPinMode !== 'from') {
    markers.push(
      getMarker({
        id: "from",
        position: fromCoordinates,
        popup: fromLocation || "نقطة الانطلاق",
        color: "#0ea5e9",
        draggable: manualPinMode === 'none',
      })
    );
  }

  // Show 'to' marker if it exists and we are not currently setting it manually
  if (toCoordinates && manualPinMode !== 'to') {
    markers.push(
      getMarker({
        id: "to",
        position: toCoordinates,
        popup: toLocation || "الوجهة",
        color: "#f59e42",
        draggable: manualPinMode === 'none',
      })
    );
  }
  
  return markers;
};

export default useCustomerMapMarkers;
