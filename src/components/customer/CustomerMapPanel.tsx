
import React from "react";
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
  manualPinMode?: "none" | "from" | "to";
  onManualPinConfirm?: (lat: number, lng: number) => void;
  // جديد
  onMarkerClick?: (type: "from" | "to") => void;
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
  onMarkerClick
}) => {
  React.useEffect(() => {
    console.log("[CustomerMapPanel] Incoming markers:", markers);
    console.log("[CustomerMapPanel] Incoming route:", route);
  }, [markers, route]);

  // رسم أزرار خفية فوق الدبابيس في الوضع "العادي"
  const markerButtons = (!manualPinMode || manualPinMode === "none")
    ? markers.map(marker => (
        <button
          key={marker.id}
          type="button"
          aria-label={`اختر تحريك دبوس ${marker.id === "from" ? "الانطلاق" : "الوجهة"}`}
          className="absolute z-[1100] bg-transparent border-none p-0 m-0"
          style={{
            left: `calc(${((marker.position[1] - mapCenter[1]) * 150 + 50)}vw)`, // (تقريبا، أي فقط placeholder: يحتاج mapping geocoord to px for real map)
            top: `calc(${((marker.position[0] - mapCenter[0]) * -200 + 50)}vh)`,
            width: 32, height: 42,
            transform: "translate(-50%, -100%)",
            cursor: "pointer",
            pointerEvents: "auto",
            opacity: 0
          }}
          tabIndex={0}
          onClick={() => {
            if (onMarkerClick) onMarkerClick(marker.id as "from"|"to");
          }}
        />
      ))
    : null;

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
      {markerButtons}
      {/* دبوس وزر عائم دائما فوق كل شيء عند اختيار الموقع يدويًا */}
      {manualPinMode !== "none" && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1050] -translate-x-1/2 -translate-y-full transition-all select-none">
            {manualPinMode === "from" ? (
              <span style={{ fontSize: 54, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.28))' }}>📍</span>
            ) : (
              <span style={{ fontSize: 54, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.28))' }}>🎯</span>
            )}
          </div>
          <div className="absolute left-1/2 top-[56%] z-[1060] -translate-x-1/2 mt-4 flex items-center">
            <button
              onClick={() => {
                if (onManualPinConfirm) onManualPinConfirm(mapCenter[0], mapCenter[1]);
              }}
              className="bg-slate-900/95 text-white px-5 py-2 rounded-xl shadow-md font-bold hover:bg-slate-800 transition focus:outline-none"
              style={{
                minWidth: 160,
                fontSize: 18,
                zIndex: 1070,
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              }}
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
