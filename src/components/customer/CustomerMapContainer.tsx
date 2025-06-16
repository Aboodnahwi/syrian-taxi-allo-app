
import React from "react";
import { useSimpleManualPin } from '@/hooks/customer/useSimpleManualPin';
import useCustomerMapMarkers from '@/components/customer/CustomerMapMarkers';
import CustomerMapPanel from '@/components/customer/CustomerMapPanel';

interface CustomerMapContainerProps {
  mapCenter: [number, number];
  mapZoom: number;
  locationHook: any;
  routingHook: any;
  toast: (opts: any) => void;
  mapZoomToFromRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef: React.MutableRefObject<(() => void) | undefined>;
  currentPinType: 'from' | 'to' | null;
  onMapMove: (center: [number, number]) => void;
  onMarkerDrag: (type: 'from' | 'to', lat: number, lng: number, address: string) => void;
  onPinTypeChange: (type: 'from' | 'to' | null) => void;
}

const CustomerMapContainer: React.FC<CustomerMapContainerProps> = ({
  mapCenter,
  mapZoom,
  locationHook,
  routingHook,
  toast,
  mapZoomToFromRef,
  mapZoomToToRef,
  mapZoomToRouteRef,
  currentPinType,
  onMapMove,
  onMarkerDrag,
  onPinTypeChange
}) => {
  // معالج الدبوس اليدوي البسيط مع تحديث الإحداثيات في الوقت الفعلي
  const { 
    isManualMode, 
    currentAddress, 
    currentCoordinates,
    startManualMode, 
    updateAddress, 
    confirmLocation, 
    cancelManualMode 
  } = useSimpleManualPin({
    onConfirm: (lat, lng, address) => {
      if (currentPinType === 'from') {
        locationHook.setFromCoordinates([lat, lng]);
        locationHook.setFromLocation(address);
        toast({
          title: "تم تحديد نقطة الانطلاق",
          description: `${address}\n📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          className: "bg-sky-50 border-sky-200 text-sky-800"
        });
      } else if (currentPinType === 'to') {
        locationHook.setToCoordinates([lat, lng]);
        locationHook.setToLocation(address);
        toast({
          title: "تم تحديد الوجهة",
          description: `${address}\n📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
      }
      onPinTypeChange(null);
    },
    onUpdateSearchBox: (lat, lng, type) => {
      // تحديث مربع البحث بالإحداثيات في الوقت الفعلي عند كل حركة
      const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (type === 'from') {
        locationHook.setFromLocation(coordinates);
      } else if (type === 'to') {
        locationHook.setToLocation(coordinates);
      }
    },
    toast
  });

  // تحديث الإحداثيات في الوقت الفعلي عند كل حركة للخريطة
  React.useEffect(() => {
    if (isManualMode && mapCenter && mapCenter.length === 2) {
      updateAddress(mapCenter[0], mapCenter[1]);
    }
  }, [mapCenter, isManualMode, updateAddress]);

  // بدء الوضع اليدوي عند تغيير نوع الدبوس
  React.useEffect(() => {
    if (currentPinType) {
      startManualMode(currentPinType);
    } else {
      cancelManualMode();
    }
  }, [currentPinType, startManualMode, cancelManualMode]);

  // Calculate markers
  const markers = useCustomerMapMarkers({
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    fromLocation: locationHook.fromLocation,
    toLocation: locationHook.toLocation,
    manualPinMode: isManualMode ? currentPinType || 'none' : 'none',
    mapCenter,
  });

  const handleManualPinConfirm = (lat: number, lng: number) => {
    confirmLocation(lat, lng);
  };

  const handleManualPinCancel = () => {
    cancelManualMode();
    onPinTypeChange(null);
  };

  return (
    <CustomerMapPanel
      mapCenter={mapCenter}
      mapZoom={mapZoom}
      markers={markers}
      route={routingHook.route}
      toast={toast}
      onLocationSelect={undefined}
      onMarkerDrag={onMarkerDrag}
      mapZoomToFromRef={mapZoomToFromRef}
      mapZoomToToRef={mapZoomToToRef}
      mapZoomToRouteRef={mapZoomToRouteRef}
      onMapMove={onMapMove}
      manualPinMode={isManualMode ? (currentPinType || 'none') : 'none'}
      onManualPinConfirm={handleManualPinConfirm}
      onManualPinCancel={handleManualPinCancel}
      manualPinAddress={currentAddress}
      manualPinCoordinates={currentCoordinates}
    />
  );
};

export default CustomerMapContainer;
