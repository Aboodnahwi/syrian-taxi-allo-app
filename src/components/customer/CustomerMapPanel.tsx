
import React, { useRef, useEffect } from "react";
import Map from "@/components/map/Map";

interface Marker {
  id: string;
  position: [number, number];
  popup: string;
  draggable: boolean;
  icon: {
    html: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  };
}

interface CustomerMapPanelProps {
  mapCenter: [number, number];
  mapZoom: number;
  markers: Marker[];
  route: Array<[number, number]>;
  toast: (opts: any) => void;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onMarkerDrag: (
    type: "from" | "to",
    lat: number,
    lng: number,
    address: string
  ) => void;
  mapZoomToFromRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef: React.MutableRefObject<(() => void) | undefined>;
  // جديد
  manualPinMode?: "none" | "from" | "to";
  onManualPinConfirm?: (lat: number, lng: number) => void;
}

const CustomerMapPanel: React.FC<CustomerMapPanelProps> = ({
  mapCenter,
  mapZoom,
  markers,
  route,
  toast,
  onLocationSelect,
  onMarkerDrag,
  mapZoomToFromRef,
  mapZoomToToRef,
  mapZoomToRouteRef,
  manualPinMode,
  onManualPinConfirm,
}) => {
  // مراقبة التغيرات لأغراض التصحيح
  useEffect(() => {
    console.log("[CustomerMapPanel] Incoming markers:", markers);
    console.log("[CustomerMapPanel] Incoming route:", route);
  }, [markers, route]);

  return (
    <div className="fixed inset-0 z-0">
      <Map
        className="w-full h-full min-h-screen"
        center={mapCenter}
        zoom={mapZoom}
        markers={markers}
        route={route}
        toast={toast}
        onLocationSelect={onLocationSelect}
        onMarkerDrag={onMarkerDrag}
        mapZoomToFromRef={mapZoomToFromRef}
        mapZoomToToRef={mapZoomToToRef}
        mapZoomToRouteRef={mapZoomToRouteRef}
      />
      {/* دبوس ثابت في المنتصف */}
      {manualPinMode !== "none" && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-full transition-all select-none">
            {manualPinMode === "from" ? (
              <span style={{ fontSize: 44 }} className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)]">📍</span>
            ) : (
              <span style={{ fontSize: 44 }} className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)]">🎯</span>
            )}
          </div>
          <div className="absolute left-1/2 top-[55%] z-50 -translate-x-1/2 mt-4">
            <button
              onClick={() => {
                if (onManualPinConfirm) onManualPinConfirm(mapCenter[0], mapCenter[1]);
              }}
              className={`bg-slate-900/90 text-white px-5 py-2 rounded-xl shadow-md font-bold hover:bg-slate-800 transition`}
            >
              تأكيد الموقع الحالي
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerMapPanel;

