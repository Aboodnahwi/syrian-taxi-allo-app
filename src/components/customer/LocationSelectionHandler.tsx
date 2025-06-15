import React from 'react';
import { useManualPinMode } from "@/hooks/useManualPinMode";
import { useManualPinConfirm } from "@/hooks/customer/useManualPinConfirm";

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
  const mapCenterRef = React.useRef(mapCenter);
  React.useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  const [manualPinMode, setManualPinMode] = React.useState<"none"|"from"|"to">("none");
  const [manualConfirmKey, setManualConfirmKey] = React.useState(0);

  const {
    handleManualFromPin: _handleManualFromPinBase,
    handleManualToPin: _handleManualToPinBase,
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
    mapCenter,
  });

  const calculateRoute = locationHook.calculateRoute ?? locationHook?.routingHook?.calculateRoute;

  const handleManualFromPin = React.useCallback(() => {
    _handleManualFromPinBase();
    setManualPinMode("from");
  }, [_handleManualFromPinBase]);

  const handleManualToPin = React.useCallback(() => {
    _handleManualToPinBase();
    setManualPinMode("to");
  }, [_handleManualToPinBase]);

  // استخدم الهوك الجديد
  const { onManualPinConfirm } = useManualPinConfirm({
    manualPinMode,
    mapCenterRef,
    locationHook,
    setMapCenter,
    setMapZoom,
    toast,
    calculateRoute,
    setManualPinMode,
    setManualConfirmKey,
  });

  const handleMarkerDrag = React.useCallback(
    (type: "from" | "to", lat: number, lng: number, address: string) => {
      const locationText = address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (type === "from") {
        locationHook.setFromCoordinates([lat, lng]);
        locationHook.setFromLocation(locationText);
        setMapCenter([lat, lng]);
        setMapZoom(17);
        toast({
          title: "تم تحديث نقطة الانطلاق بواسطة السحب",
          description: locationText,
          className: "bg-blue-50 border-blue-200 text-blue-800"
        });
        if (locationHook.toCoordinates) {
          calculateRoute?.([lat, lng], locationHook.toCoordinates);
        }
      } else if (type === "to") {
        locationHook.setToCoordinates([lat, lng]);
        locationHook.setToLocation(locationText);
        setMapCenter([lat, lng]);
        setMapZoom(17);
        toast({
          title: "تم تحديث الوجهة بواسطة السحب",
          description: locationText,
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
        if (locationHook.fromCoordinates) {
          calculateRoute?.(locationHook.fromCoordinates, [lat, lng]);
        }
      }
      setTimeout(() => {
        setManualPinMode("none");
      }, 300);
    },
    [
      locationHook,
      setMapCenter,
      setMapZoom,
      toast,
      calculateRoute
    ]
  );

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
      onManualPinConfirm,
    });
  }, [
    handleManualFromPin,
    handleManualToPin,
    handleMarkerDrag,
    selectLocation,
    manualPinMode,
    onManualPinConfirm,
    onLocationHandlersReady,
    manualConfirmKey, // dependency لإجبار re-prop injection في الأب
  ]);

  return null;
};

export default LocationSelectionHandler;
