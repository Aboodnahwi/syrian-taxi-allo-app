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
  // مرجع دائم لمركز الخريطة
  const mapCenterRef = React.useRef(mapCenter);
  React.useEffect(() => { mapCenterRef.current = mapCenter; }, [mapCenter]);

  // === state خاص بالدبوس اليدوي ===
  const [manualPinMode, setManualPinMode] = React.useState<"none"|"from"|"to">("none");
  const [manualConfirmKey, setManualConfirmKey] = React.useState(0);

  // === Handlers للإجراءات المختلفة بشكل منظم ===

  // التعامل مع وضع اختيار الدبوس يدويًا
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

  // تأكيد اختيار الدبوس اليدوي
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

  // تحكم بسحب الدبابيس (marker)
  // changed to match function signature
  const { handleMarkerDrag } = useMarkerDragHandler();

  // عند اختيار موقع من الاقتراحات
  const { selectLocation } = useLocationSelectHandler({
    locationHook,
    setMapCenter,
    setMapZoom,
    mapZoomToFromRef,
    mapZoomToToRef,
    toast
  });

  // تمرير جميع الهاندلرز المرتبة للأب عند أي تغيير
  React.useEffect(() => {
    onLocationHandlersReady({
      handleManualFromPin,
      handleManualToPin,
      handleMarkerDrag, // now matches expected signature
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

  // هذا المكون لا يعرض أي شيء على الواجهة (منطقي فقط)
  return null;
};

export default LocationSelectionHandler;
