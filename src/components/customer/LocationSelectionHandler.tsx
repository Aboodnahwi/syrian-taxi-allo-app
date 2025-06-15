
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
  const getManualAddress = (lat: number, lng: number) =>
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const handleManualFromPin = React.useCallback(() => {
    _handleManualFromPinBase();
    setManualPinMode("from");
  }, [_handleManualFromPinBase]);

  const handleManualToPin = React.useCallback(() => {
    _handleManualToPinBase();
    setManualPinMode("to");
  }, [_handleManualToPinBase]);

  // إعادة الصياغة هنا: تحديث كل شيء فورياً ثم رسم المسار متى ما توفر الطرف الآخر
  const onManualPinConfirm = React.useCallback(
    async (lat: number, lng: number) => {
      const manualCoords: [number, number] = [lat, lng];
      const addressText = getManualAddress(lat, lng);

      if (manualPinMode === "from") {
        // حدّث نقطة الانطلاق فورا
        locationHook.setFromCoordinates(manualCoords);
        locationHook.setFromLocation(addressText);
        setMapCenter(manualCoords);
        setMapZoom(17);
        setManualPinMode("none");
        toast({
          title: "تم تحديد نقطة الانطلاق يدويًا",
          description: addressText,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
        // بعد تحديث الانطلاق، إذا وُجدت وجهة ارسم المسار فوراً
        if (locationHook.toCoordinates) {
          await calculateRoute?.(manualCoords, locationHook.toCoordinates);
        }
      } else if (manualPinMode === "to") {
        // حدّث نقطة الوجهة فورا
        locationHook.setToCoordinates(manualCoords);
        locationHook.setToLocation(addressText);
        setMapCenter(manualCoords);
        setMapZoom(17);
        setManualPinMode("none");
        toast({
          title: "تم تحديد الوجهة يدويًا",
          description: addressText,
          className: "bg-orange-50 border-orange-200 text-orange-800",
        });
        // بعد تحديث الوجهة، إذا وُجدت نقطة انطلاق ارسم المسار فوراً
        if (locationHook.fromCoordinates) {
          await calculateRoute?.(locationHook.fromCoordinates, manualCoords);
        }
      }
    },
    [
      manualPinMode,
      locationHook,
      setMapCenter,
      setMapZoom,
      toast,
      calculateRoute,
    ]
  );

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

