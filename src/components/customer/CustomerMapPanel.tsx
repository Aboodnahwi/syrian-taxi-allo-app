
import React from "react";
import Map from "@/components/map/Map";
import { MapPin, Check, X } from 'lucide-react';
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
  onManualPinCancel?: () => void;
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
  onManualPinCancel,
  manualPinAddress,
  manualPinCoordinates,
  onMapMove
}) => {
  const handleConfirm = () => {
    if (onManualPinConfirm && manualPinCoordinates) {
      onManualPinConfirm(manualPinCoordinates[0], manualPinCoordinates[1]);
    }
  };

  const handleCancel = () => {
    if (onManualPinCancel) {
      onManualPinCancel();
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
          {/* Center Pin with coordinates display */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1001] pointer-events-none">
             <MapPin 
               className={`w-10 h-10 drop-shadow-lg ${manualPinMode === 'from' ? 'text-sky-500' : 'text-orange-500'}`} 
               fill="currentColor"
             />
             {/* Coordinates display below pin */}
             {manualPinCoordinates && (
               <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                 {manualPinCoordinates[0].toFixed(6)}, {manualPinCoordinates[1].toFixed(6)}
               </div>
             )}
          </div>
          
          {/* Confirmation Panel */}
          <div className="absolute top-1/2 left-1/2 z-[1002] w-80 -translate-x-1/2 mt-4">
            <Card className="shadow-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2 text-center">
                  {manualPinMode === 'from' ? 'تحديد نقطة الانطلاق' : 'تحديد الوجهة'}
                </p>
                {manualPinAddress ? (
                  <div className="text-sm text-slate-600 text-center whitespace-pre-line">
                    {manualPinAddress}
                  </div>
                ) : (
                  <Skeleton className="h-4 w-full" />
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1" 
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleConfirm}
                  disabled={!manualPinCoordinates}
                >
                  <Check className="w-4 h-4" />
                  تأكيد
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
