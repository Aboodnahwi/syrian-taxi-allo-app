/**
 * Component: LocationSelectionHandler
 * يربط جميع هوكات تحديد/تحريك المواقع، وينظم handlers بوضوح ويرجعها للأب
 */

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
    handleMarkerDrag: (type: 'from' | 'to') => void;
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
  React.useEffect(() => { mapCenterRef.current = mapCenter; }, [mapCenter]);

  const [manualPinMode, setManualPinMode] = React.useState<"none"|"from"|"to">("none");
  const [manualConfirmKey, setManualConfirmKey] = React.useState(0);

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

  // استدعِ useMarkerDragHandler مع props لتفعيل manualPinMode عند النقر على دبوس
  const { handleMarkerDrag } = useMarkerDragHandler({
    manualPinMode,
    setManualPinMode,
    setMapCenter,
    setMapZoom,
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates
  });

  const { onManualPinConfirm } = useManualPinConfirm({
    manualPinMode,
    mapCenterRef,
    setFromCoordinates: locationHook.setFromCoordinates,
    setFromLocation: locationHook.setFromLocation,
    setToCoordinates: locationHook.setToCoordinates,
    setToLocation: locationHook.setToLocation,
    setMapCenter,
    setMapZoom,
    toast,
    setManualPinMode,
    setManualConfirmKey,
  });

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
