
import React from "react";
import Map from "@/components/map/Map";
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  manualPinAddress?: string;
  manualPinCoordinates?: [number, number] | null;
  onMapMove?: (center: [number, number]) => void
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
  manualPinAddress,
  manualPinCoordinates,
  onMapMove
}) => {
  React.useEffect(() => {
    console.log("[CustomerMapPanel] Incoming markers:", markers);
    console.log("[CustomerMapPanel] Incoming route:", route);
  }, [markers, route]);

  const handleConfirm = () => {
    if (onManualPinConfirm && manualPinCoordinates) {
      onManualPinConfirm(manualPinCoordinates[0], manualPinCoordinates[1]);
    }
  };

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
        onMapMove={onMapMove}
      />
      {manualPinMode && manualPinMode !== 'none' && (
        <>
          {/* Center Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
             <MapPin 
               className={`w-10 h-10 drop-shadow-lg ${manualPinMode === 'from' ? 'text-sky-500' : 'text-orange-500'}`} 
               fill="currentColor"
             />
          </div>
          
          {/* Confirmation Panel */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <Card className="shadow-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">
                  {manualPinMode === 'from' ? 'تحديد نقطة الانطلاق' : 'تحديد الوجهة'}
                </p>
                {manualPinAddress ? (
                  <p className="text-sm text-slate-600">{manualPinAddress}</p>
                ) : (
                  <Skeleton className="h-4 w-full" />
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full" 
                  onClick={handleConfirm}
                  disabled={!manualPinCoordinates}
                >
                  تأكيد الموقع
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerMapPanel;
