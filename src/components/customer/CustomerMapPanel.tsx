
import React, { useRef, useEffect } from "react";
import Map from "@/components/map/Map";
import { useToast } from "@/hooks/use-toast";

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
    </div>
  );
};

export default CustomerMapPanel;

