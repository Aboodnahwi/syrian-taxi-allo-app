import React from 'react';
import { useManualPinMode } from "@/hooks/useManualPinMode";

interface LocationSelectionHandlerProps {
  locationHook: any;
  mapCenter: [number, number];
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  toast: (opts: any) => void;
  mapZoomToFromRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef: React.MutableRefObject<(() => void) | undefined>;
  onLocationHandlersReady: (handlers: {
    handleManualFromPin: () => void;
    handleManualToPin: () => void;
    handleMarkerDrag: (type: 'from' | 'to', lat: number, lng: number, address: string) => void;
    selectLocation: (suggestion: any, type: 'from' | 'to') => void;
    manualPinMode: "none"|"from"|"to";
    onManualPinConfirm: (lat: number, lng: number) => void;
  }) => void;
}

const LocationSelectionHandler: React.FC<LocationSelectionHandlerProps> = ({
  locationHook,
  mapCenter,
  setMapCenter,
  setMapZoom,
  toast,
  mapZoomToFromRef,
  mapZoomToToRef,
  onLocationHandlersReady
}) => {
  const [manualPinMode, setManualPinMode] = React.useState<"none"|"from"|"to">("none");

  const {
    handleManualFromPin: _handleManualFromPinBase,
    handleManualToPin: _handleManualToPinBase,
    handleMapClickManual
  } = useManualPinMode({
    setManualPinMode,
    setFromCoordinates: locationHook.setFromCoordinates,
    setToCoordinates: locationHook.setToCoordinates,
    setFromLocation: locationHook.setFromLocation,
    setToLocation: locationHook.setToLocation,
    setMapCenter,
    setMapZoom,
    showToast: toast,
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    mapCenter
  });

  // لاحظ: نعدل حساب المسار كي نعطيه الإحداثيات الجديدة مباشرة
  const calculateRoute = locationHook.calculateRoute ?? locationHook?.routingHook?.calculateRoute;

  // استدعاء تفعيل وضع التثبيت اليدوي
  const handleManualFromPin = React.useCallback(() => {
    _handleManualFromPinBase();
    setManualPinMode("from");
  }, [_handleManualFromPinBase]);

  const handleManualToPin = React.useCallback(() => {
    _handleManualToPinBase();
    setManualPinMode("to");
  }, [_handleManualToPinBase]);

  // عند تأكيد الموقع (الدبوس في مركز الخريطة)
  const onManualPinConfirm = React.useCallback((lat: number, lng: number) => {
    if (manualPinMode === "from") {
      const newCoords: [number, number] = [lat, lng];
      const addressText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationHook.setFromCoordinates(newCoords);
      locationHook.setFromLocation(addressText);
      setMapCenter(newCoords);
      setMapZoom(17);
      setManualPinMode("none");
      toast({
        title: "تم تحديد نقطة الانطلاق",
        description: addressText,
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });

      // حساب المسار فورًا مع الإحداثيات الجديدة
      if (calculateRoute && locationHook.toCoordinates) {
        setTimeout(() => {
          calculateRoute(newCoords, locationHook.toCoordinates);
        }, 150);
      }
    } else if (manualPinMode === "to") {
      const newCoords: [number, number] = [lat, lng];
      const addressText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationHook.setToCoordinates(newCoords);
      locationHook.setToLocation(addressText);
      setMapCenter(newCoords);
      setMapZoom(17);
      setManualPinMode("none");
      toast({
        title: "تم تحديد الوجهة",
        description: addressText,
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });

      if (calculateRoute && locationHook.fromCoordinates) {
        setTimeout(() => {
          calculateRoute(locationHook.fromCoordinates, newCoords);
        }, 150);
      }
    }
  }, [manualPinMode, locationHook, setMapCenter, setMapZoom, toast, calculateRoute]);

  // الآن الدبابيس العادية غير قابلة للسحب نهائيًا
  const handleMarkerDrag = React.useCallback(() => {}, []);

  const selectLocation = React.useCallback((suggestion: any, type: 'from' | 'to') => {
    console.log("[LocationSelectionHandler] Selecting location:", suggestion.name, "for", type);
    
    if (type === 'from') {
      locationHook.setFromLocation(suggestion.name);
      locationHook.setFromCoordinates([suggestion.lat, suggestion.lon]);
      locationHook.setShowFromSuggestions(false);
      setMapCenter([suggestion.lat, suggestion.lon]);
      setMapZoom(17);
      locationHook.setUserLocated(true);
      setTimeout(() => {
        mapZoomToFromRef.current?.();
      }, 250);
    } else {
      locationHook.setToLocation(suggestion.name);
      locationHook.setToCoordinates([suggestion.lat, suggestion.lon]);
      locationHook.setShowToSuggestions(false);
      setMapCenter([suggestion.lat, suggestion.lon]);
      setMapZoom(17);
      setTimeout(() => {
        mapZoomToToRef.current?.();
      }, 250);
      toast({
        title: "تم تحديد الوجهة",
        description: suggestion.name.substring(0, 50) + "...",
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });
    }
  }, [locationHook, setMapCenter, setMapZoom, mapZoomToFromRef, mapZoomToToRef, toast]);

  React.useEffect(() => {
    onLocationHandlersReady({
      handleManualFromPin,
      handleManualToPin,
      handleMarkerDrag,
      selectLocation,
      manualPinMode,
      onManualPinConfirm
    });
  }, [
    handleManualFromPin,
    handleManualToPin,
    handleMarkerDrag,
    selectLocation,
    manualPinMode,
    onManualPinConfirm,
    onLocationHandlersReady
  ]);

  return null;
};

export default LocationSelectionHandler;
