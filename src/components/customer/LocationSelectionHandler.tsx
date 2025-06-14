
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
    console.log("[LocationSelectionHandler] MANUAL PIN CONFIRM - Mode:", manualPinMode, "Coords:", lat, lng);
    
    if (manualPinMode === "from") {
      console.log("[LocationSelectionHandler] Setting FROM coordinates immediately");
      
      // حفظ الإحداثيات والموقع فوراً بدون تأخير
      const newCoords: [number, number] = [lat, lng];
      
      // تحديث جميع الحالات مرة واحدة
      locationHook.setFromCoordinates(newCoords);
      locationHook.setFromLocation(""); // مسح النص
      
      console.log("[LocationSelectionHandler] FROM coordinates set to:", newCoords);
      
      // تحديث الخريطة
      setMapCenter(newCoords);
      setMapZoom(17);
      setManualPinMode("none");
      
      toast({
        title: "تم تحديد نقطة الانطلاق",
        description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });

      // التأكد من حساب المسار إذا كانت الوجهة موجودة
      if (calculateRoute && locationHook.toCoordinates) {
        console.log("[LocationSelectionHandler] Calculating route with FROM:", newCoords, "TO:", locationHook.toCoordinates);
        // استدعاء مع تأخير قصير للتأكد من تحديث الحالة
        setTimeout(() => {
          calculateRoute();
        }, 150);
      }

    } else if (manualPinMode === "to") {
      console.log("[LocationSelectionHandler] Setting TO coordinates immediately");
      
      // حفظ الإحداثيات والموقع فوراً بدون تأخير
      const newCoords: [number, number] = [lat, lng];
      
      // تحديث جميع الحالات مرة واحدة
      locationHook.setToCoordinates(newCoords);
      locationHook.setToLocation(""); // مسح النص
      
      console.log("[LocationSelectionHandler] TO coordinates set to:", newCoords);
      
      // تحديث الخريطة
      setMapCenter(newCoords);
      setMapZoom(17);
      setManualPinMode("none");
      
      toast({
        title: "تم تحديد الوجهة",
        description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });

      // التأكد من حساب المسار إذا كانت نقطة الانطلاق موجودة
      if (calculateRoute && locationHook.fromCoordinates) {
        console.log("[LocationSelectionHandler] Calculating route with FROM:", locationHook.fromCoordinates, "TO:", newCoords);
        // استدعاء مع تأخير قصير للتأكد من تحديث الحالة
        setTimeout(() => {
          calculateRoute();
        }, 150);
      }
    }
  }, [manualPinMode, locationHook, setMapCenter, setMapZoom, toast, calculateRoute]);

  // الآن الدبابيس العادية غير قابلة للسحب نهائيًا
  const handleMarkerDrag = React.useCallback(() => {}, []);

  const selectLocation = React.useCallback((suggestion: any, type: 'from' | 'to') => {
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

  // Provide handlers to parent component
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
