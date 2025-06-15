
import React from 'react';
import { useManualPinModeHandler } from '@/hooks/customer/useManualPinModeHandler';
import { useManualPinConfirm } from "@/hooks/customer/useManualPinConfirm";
import { useMarkerDragHandler } from "@/hooks/customer/useMarkerDragHandler";
import { useLocationSelectHandler } from "@/hooks/customer/useLocationSelectHandler";

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

  // 1. hoook وضع تحديد الدبوس اليدوي
  const { handleManualFromPin, handleManualToPin } = useManualPinModeHandler({
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

  // 2. hook رفع الدبوس اليدوي
  const { onManualPinConfirm } = useManualPinConfirm({
    manualPinMode,
    mapCenterRef,
    locationHook,
    setMapCenter,
    setMapZoom,
    toast,
    calculateRoute: locationHook.calculateRoute ?? locationHook?.routingHook?.calculateRoute,
    setManualPinMode,
    setManualConfirmKey,
  });

  // 3. hook سحب الدبابيس
  const { handleMarkerDrag } = useMarkerDragHandler({
    locationHook,
    setMapCenter,
    setMapZoom,
    toast,
    calculateRoute: locationHook.calculateRoute ?? locationHook?.routingHook?.calculateRoute,
    setManualPinMode
  });

  // 4. hook تحديد المواقع من الاقتراحات
  const { selectLocation } = useLocationSelectHandler({
    locationHook,
    setMapCenter,
    setMapZoom,
    mapZoomToFromRef,
    mapZoomToToRef,
    toast
  });

  React.useEffect(() => {
    onLocationHandlersReady({
      handleManualFromPin,
      handleManualToPin,
      handleMarkerDrag,
      selectLocation,
      manualPinMode,
      onManualPinConfirm,
    });
  // إضافة manualConfirmKey dependency لإجبار التعديل
  }, [
    handleManualFromPin,
    handleManualToPin,
    handleMarkerDrag,
    selectLocation,
    manualPinMode,
    onManualPinConfirm,
    onLocationHandlersReady,
    manualConfirmKey,
  ]);

  return null;
};

export default LocationSelectionHandler;
