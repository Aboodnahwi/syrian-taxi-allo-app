
import { useState } from "react";

interface ManualPinModeProps {
  setManualPinMode: (mode: "none" | "from" | "to") => void;
  setFromCoordinates: (coords: [number, number] | null) => void;
  setToCoordinates: (coords: [number, number] | null) => void;
  setFromLocation: (loc: string) => void;
  setToLocation: (loc: string) => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  showToast: (opts: any) => void;
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  mapCenter: [number, number];
}

export function useManualPinMode({
  setManualPinMode,
  setFromCoordinates,
  setToCoordinates,
  setFromLocation,
  setToLocation,
  setMapCenter,
  setMapZoom,
  showToast,
  fromCoordinates,
  toCoordinates,
  mapCenter
}: ManualPinModeProps) {
  // -- الوضع اليدوي لتعيين الدبابيس --
  function handleManualFromPin() {
    setManualPinMode("from");
    showToast({
      title: "تعيين نقطة الانطلاق يدويًا",
      description: "اختر موقع نقطة الانطلاق على الخريطة بسحب الدبوس الأزرق.",
      className: "bg-blue-50 border-blue-200 text-blue-800"
    });
    // ضع دبوس مؤقت إذا لم يكن موجودًا
    if (!fromCoordinates && mapCenter) {
      setFromCoordinates([mapCenter[0], mapCenter[1]]);
      setFromLocation("نقطة من اختيارك");
    }
    setMapZoom(17);
  }

  function handleManualToPin() {
    setManualPinMode("to");
    showToast({
      title: "تعيين الوجهة يدويًا",
      description: "اختر موقع الوجهة على الخريطة بسحب الدبوس البرتقالي.",
      className: "bg-orange-50 border-orange-200 text-orange-800"
    });
    if (!toCoordinates && mapCenter) {
      setToCoordinates([mapCenter[0], mapCenter[1]]);
      setToLocation("وجهة من اختيارك");
    }
    setMapZoom(17);
  }

  // هذه الدالة تحل مشكلتك مع الخطأ السابق، فهي التي كان المقصود بها handleMapClickManual
  function handleMapClickManual(
    lat: number,
    lng: number,
    address: string,
    mode: "from" | "to",
  ) {
    if (mode === "from") {
      setFromCoordinates([lat, lng]);
      setFromLocation(address);
      setManualPinMode("none");
      setMapCenter([lat, lng]);
      setMapZoom(17);
    } else if (mode === "to") {
      setToCoordinates([lat, lng]);
      setToLocation(address);
      setManualPinMode("none");
      setMapCenter([lat, lng]);
      setMapZoom(17);
    }
  }

  return {
    handleManualFromPin,
    handleManualToPin,
    handleMapClickManual
  };
}
