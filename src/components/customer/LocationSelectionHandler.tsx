
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

  const handleManualFromPin = React.useCallback(() => {
    console.log("[LocationSelectionHandler] handleManualFromPin called");
    _handleManualFromPinBase();
  }, [_handleManualFromPinBase]);

  const handleManualToPin = React.useCallback(() => {
    console.log("[LocationSelectionHandler] handleManualToPin called");
    _handleManualToPinBase();
  }, [_handleManualToPinBase]);

  // Simplified marker drag handler
  const handleMarkerDrag = React.useCallback(async (
    type: 'from' | 'to',
    lat: number,
    lng: number,
    address: string
  ) => {
    console.log("[LocationSelectionHandler] handleMarkerDrag:", type, lat, lng, address);
    
    if (type === 'from') {
      locationHook.setFromCoordinates([lat, lng]);
      locationHook.setFromLocation(address);
      toast({
        title: "تم تحديث نقطة الانطلاق",
        description: address.substring(0, 50) + "...",
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
    } else {
      locationHook.setToCoordinates([lat, lng]);
      locationHook.setToLocation(address);
      toast({
        title: "تم تحديث الوجهة",
        description: address.substring(0, 50) + "...",
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });
    }
  }, [locationHook, toast]);

  const selectLocation = React.useCallback((suggestion: any, type: 'from' | 'to') => {
    console.log("[LocationSelectionHandler] selectLocation:", suggestion.name, type);
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
      selectLocation
    });
  }, [handleManualFromPin, handleManualToPin, handleMarkerDrag, selectLocation, onLocationHandlersReady]);

  return null; // This is a logic-only component
};

export default LocationSelectionHandler;
