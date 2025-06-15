
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
  onMarkerClick?: (type: "from" | "to") => void;
  manualPinAddress?: string;
  manualPinCoordinates?: [number, number] | null; // أضفت هذا الحقل
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
  onMarkerClick,
  manualPinAddress,
  manualPinCoordinates
}) => {
  React.useEffect(() => {
    console.log("[CustomerMapPanel] Incoming markers:", markers);
    console.log("[CustomerMapPanel] Incoming route:", route);
    console.log("[CustomerMapPanel] onMarkerClick:", onMarkerClick);
  }, [markers, route, onMarkerClick]);

  // تمرير onMarkerClick للدبابيس
  const markersWithClick = markers.map(marker => ({
    ...marker,
    onClick: () => onMarkerClick?.(marker.id as "from" | "to")
  }));

  // Overlay دبوس ثابت في منتصف الشاشة في manualPinMode فقط
  const overlayPin = (manualPinMode && manualPinMode !== "none") ? (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[1200] transition-transform duration-200"
      style={{
        transform: "translate(-50%, -100%)",
        width: 32, height: 42,
        filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.3))"
      }}
    >
      <div
        className={`flex items-center justify-center font-bold text-lg rounded-b-[20px]`}
        style={{
          width: 32,
          height: 42,
          borderRadius: "16px 16px 20px 20px",
          background: manualPinMode === "from" ? "#0ea5e9" : "#f59e42",
          color: "#fff"
        }}
      >
        {manualPinMode === "from" ? "📍" : "🎯"}
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-0">
      {/* نرسم الخريطة بالدبابيس العادية القابلة للسحب إذا لم نكن في manualPinMode */}
      <Map
        className="w-full h-full min-h-screen"
        center={mapCenter}
        zoom={mapZoom}
        markers={manualPinMode !== "none" ? [] : markersWithClick}
        route={route}
        toast={toast}
        onLocationSelect={onLocationSelect}
        onMarkerDrag={onMarkerDrag}
        mapZoomToFromRef={mapZoomToFromRef}
        mapZoomToToRef={mapZoomToToRef}
        mapZoomToRouteRef={mapZoomToRouteRef}
      />

      {/* دبوس ثابت في منتصف الشاشة عند وضع التحديد اليدوي (Overlay فقط) */}
      {overlayPin}

      {/* عرض العنوان الحالي تحت الدبوس في التحديد اليدوي */}
      {manualPinMode !== "none" && (
        <div className="absolute left-1/2 top-[54%] z-[1061] -translate-x-1/2 flex flex-col items-center w-[98vw] max-w-sm mb-1 px-2 text-center">
          <div className="rounded bg-white/90 px-3 py-2 text-slate-700 text-xs shadow font-medium border border-slate-200 max-w-full truncate" title={manualPinAddress || ""}>
            {manualPinAddress ? manualPinAddress : "جاري جلب العنوان..."}
          </div>
          {/* إحداثيات الموقع مباشرة تحت العنوان */}
          {manualPinCoordinates && (
            <div className="rounded bg-slate-50 px-3 py-1 mt-1 text-slate-700 text-[11px] shadow border border-slate-200 max-w-full">
              {`الإحداثيات: ${manualPinCoordinates[0].toFixed(6)}, ${manualPinCoordinates[1].toFixed(6)}`}
            </div>
          )}
        </div>
      )}

      {/* زر تأكيد الموقع في وضع التحديد اليدوي */}
      {manualPinMode !== "none" && (
        <div className="absolute left-1/2 top-[56%] z-[1060] -translate-x-1/2 mt-4 flex items-center">
          <button
            onClick={() => {
              // استخدم دائماً أحدث mapCenter عند الضغط
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
      )}
    </div>
  );
};

export default CustomerMapPanel;

