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
  // للتحكم بأحدث mapCenter دون تعليق stale closure:
  const mapCenterRef = React.useRef(mapCenter);
  React.useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  // التحكم بوضعية تحديد يدوية (من/إلى/لاشيء)
  const [manualPinMode, setManualPinMode] = React.useState<"none"|"from"|"to">("none");

  // --- [NEW: معرف لجعل كل تأكيد دبوس فريدًا] ---
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
  const getManualAddress = (lat: number, lng: number) =>
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // عند الضغط على زر "تعيين الانطلاق يدويًا"
  const handleManualFromPin = React.useCallback(() => {
    _handleManualFromPinBase();
    setManualPinMode("from");
  }, [_handleManualFromPinBase]);

  // عند الضغط على زر "تعيين الوجهة يدويًا"
  const handleManualToPin = React.useCallback(() => {
    _handleManualToPinBase();
    setManualPinMode("to");
  }, [_handleManualToPinBase]);

  /**
   * الإصلاح: استخدم دومًا أحدث مركز للخريطة عند التأكيد!
   */
  const onManualPinConfirm = React.useCallback(
    async (_lat: number, _lng: number) => {
      // استخدم دومًا القيمة المرجعية المحدثة وليس فقط prop mapCenter
      const [lat, lng] = mapCenterRef.current;
      const manualCoords: [number, number] = [lat, lng];
      const addressText = getManualAddress(lat, lng);

      // اطبع الإحداثيات للمراجعة
      console.log("[onManualPinConfirm] تأكيد دبوس يدوي! mapCenterRef.current:", mapCenterRef.current, "manualPinMode:", manualPinMode);

      if (manualPinMode === "from") {
        locationHook.setFromCoordinates(manualCoords);
        locationHook.setFromLocation(addressText);

        setMapCenter(manualCoords);
        setMapZoom(17);

        // إضافة تأخير بسيط ليضمن التحديث الكامل قبل إطفاء manualPinMode
        setTimeout(() => {
          setManualPinMode("none");
          setManualConfirmKey((k) => k + 1); // Force re-render/cycle
          console.log("[onManualPinConfirm] manualPinMode set to none بعد التحديث");
        }, 200);

        toast({
          title: "تم تحديد نقطة الانطلاق يدويًا",
          description: addressText,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });

        if (locationHook.toCoordinates) {
          await calculateRoute?.(manualCoords, locationHook.toCoordinates);
        }
      } else if (manualPinMode === "to") {
        locationHook.setToCoordinates(manualCoords);
        locationHook.setToLocation(addressText);

        setMapCenter(manualCoords);
        setMapZoom(17);

        setTimeout(() => {
          setManualPinMode("none");
          setManualConfirmKey((k) => k + 1); // Force re-render/cycle
          console.log("[onManualPinConfirm] manualPinMode set to none بعد التحديث");
        }, 200);

        toast({
          title: "تم تحديد الوجهة يدويًا",
          description: addressText,
          className: "bg-orange-50 border-orange-200 text-orange-800",
        });

        if (locationHook.fromCoordinates) {
          await calculateRoute?.(locationHook.fromCoordinates, manualCoords);
        }
      }
      setTimeout(() => {
        console.log("[onManualPinConfirm] after-confirm fromCoordinates:", locationHook.fromCoordinates, "toCoordinates:", locationHook.toCoordinates, "manualPinMode:", manualPinMode);
      }, 300);
    },
    [
      manualPinMode,
      locationHook,
      setMapCenter,
      setMapZoom,
      toast,
      calculateRoute,
      getManualAddress
    ]
  );

  // عند سحب الدبوس (الوضع اليدوي/الدبوس العائم) أو الدبوس العادي القابل للسحب، حدّث الإحداثيات وكذلك الموقع
  const handleMarkerDrag = React.useCallback(
    (type: "from" | "to", lat: number, lng: number, address: string) => {
      const locationText = address || getManualAddress(lat, lng);
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
      calculateRoute,
      getManualAddress
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

  // React.useEffect: في حالة تغير manualConfirmKey نجبر التحديث
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
