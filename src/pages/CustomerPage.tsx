import React, { useState, useEffect, useCallback } from 'react';
import { useCustomerPageState } from '@/hooks/customer/useCustomerPageState';
import useCustomerMapMarkers from '@/components/customer/CustomerMapMarkers';
import LocationSelectionHandler from '@/components/customer/LocationSelectionHandler';
import CustomerPageHeader from '@/components/customer/CustomerPageHeader';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import CustomerMapPanel from '@/components/customer/CustomerMapPanel';
import {
  getVehicleName,
  getVehicleIcon,
  getVehicleColor,
} from '@/utils/vehicleUtils';

const CustomerPage = () => {
  const {
    user,
    signOut,
    pricing,
    selectedVehicle,
    setSelectedVehicle,
    estimatedPrice,
    orderOpen,
    setOrderOpen,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    mapZoomToFromRef,
    mapZoomToToRef,
    mapZoomToRouteRef,
    locationHook,
    routingHook,
    rideHook,
    toast
  } = useCustomerPageState();

  // جميع الهوكات يجب أن تكون هنا فوق أي شرط
  const [locationHandlers, setLocationHandlers] = useState<{
    handleManualFromPin: () => void;
    handleManualToPin: () => void;
    handleMarkerDrag: (type: 'from' | 'to') => void;
    selectLocation: (suggestion: any, type: 'from' | 'to') => void;
    manualPinMode?: "none"|"from"|"to";
    onManualPinConfirm?: (lat:number,lng:number)=>void;
  } | null>(null);

  // معالج سحب الدبابيس - محسن لضمان التحديث الفوري
  const handleMarkerDrag = useCallback(async (type: "from" | "to", lat: number, lng: number, address: string) => {
    console.log(`[CustomerPage] Marker ${type} dragged to:`, lat, lng, address);
    
    const newCoordinates: [number, number] = [lat, lng];
    
    if (type === "from") {
      console.log(`[CustomerPage] Updating FROM coordinates to:`, newCoordinates);
      locationHook.setFromCoordinates(newCoordinates);
      locationHook.setFromLocation(address);
      
      // إظهار toast لتأكيد التحديث
      toast({
        title: "تم تحديث نقطة الانطلاق",
        description: address,
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
      
      // حساب المسار إذا كانت الوجهة موجودة
      if (locationHook.toCoordinates) {
        console.log(`[CustomerPage] Calculating route from ${newCoordinates} to ${locationHook.toCoordinates}`);
        try {
          await locationHook.calculateRoute(newCoordinates, locationHook.toCoordinates);
        } catch (error) {
          console.error(`[CustomerPage] Error calculating route:`, error);
        }
      }
    } else if (type === "to") {
      console.log(`[CustomerPage] Updating TO coordinates to:`, newCoordinates);
      locationHook.setToCoordinates(newCoordinates);
      locationHook.setToLocation(address);
      
      // إظهار toast لتأكيد التحديث
      toast({
        title: "تم تحديث الوجهة",
        description: address,
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });
      
      // حساب المسار إذا كانت نقطة الانطلاق موجودة
      if (locationHook.fromCoordinates) {
        console.log(`[CustomerPage] Calculating route from ${locationHook.fromCoordinates} to ${newCoordinates}`);
        try {
          await locationHook.calculateRoute(locationHook.fromCoordinates, newCoordinates);
        } catch (error) {
          console.error(`[CustomerPage] Error calculating route:`, error);
        }
      }
    }
  }, [locationHook, toast]);

  // معالج النقر على الدبوس لتفعيل وضع التحديد اليدوي
  const handleMapMarkerClick = useCallback((type: "from" | "to") => {
    console.log(`[CustomerPage] Marker ${type} clicked, activating manual mode`);
    
    if (locationHandlers?.handleMarkerDrag) {
      locationHandlers.handleMarkerDrag(type);
    } else {
      console.log("[CustomerPage] locationHandlers.handleMarkerDrag not ready, will retry");
      // إعادة المحاولة بعد فترة قصيرة إذا لم تكن الـ handlers جاهزة
      setTimeout(() => {
        if (locationHandlers?.handleMarkerDrag) {
          locationHandlers.handleMarkerDrag(type);
        }
      }, 100);
    }
  }, [locationHandlers]);

  // تعيين معالج السحب في النافذة العامة ليتمكن useMapMarkers من الوصول إليه
  useEffect(() => {
    console.log("[CustomerPage] Setting window.handleMarkerDrag");
    (window as any).handleMarkerDrag = handleMarkerDrag;
    return () => {
      console.log("[CustomerPage] Cleaning up window.handleMarkerDrag");
      delete (window as any).handleMarkerDrag;
    };
  }, [handleMarkerDrag]);

  const [manualPinAddress, setManualPinAddress] = useState<string>("");
  useEffect(() => {
    if (!locationHandlers?.manualPinMode || locationHandlers.manualPinMode === "none") {
      setManualPinAddress("");
      return;
    }
    let isActive = true;
    const [lat, lng] = mapCenter;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (isActive) {
          if (data.display_name) setManualPinAddress(data.display_name);
          else setManualPinAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      })
      .catch(() => setManualPinAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`));
    return () => { isActive = false; };
  }, [mapCenter, locationHandlers?.manualPinMode]);

  // markers always calculated before any render exit
  const markers = useCustomerMapMarkers({
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    fromLocation: locationHook.fromLocation,
    toLocation: locationHook.toLocation,
    manualPinMode: locationHandlers?.manualPinMode,
    mapCenter,
    onMarkerClick: handleMapMarkerClick
  });

  // إذا لم يكن هناك مستخدم لا ترسم شيء
  if (!user) return null;

  const vehicleTypes = pricing.map(p => ({
    id: p.vehicle_type,
    name: getVehicleName(p.vehicle_type),
    price: p.base_price,
    icon: getVehicleIcon(p.vehicle_type),
    color: getVehicleColor(p.vehicle_type)
  }));

  return (
    <div className="relative w-full h-screen min-h-screen bg-slate-900 overflow-hidden">
      {/* Location Selection Handler */}
      <LocationSelectionHandler
        locationHook={locationHook}
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        setMapZoom={setMapZoom}
        toast={toast}
        mapZoomToFromRef={mapZoomToFromRef}
        mapZoomToToRef={mapZoomToToRef}
        onLocationHandlersReady={setLocationHandlers}
      />

      {/* الخريطة */}
      <CustomerMapPanel
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        markers={markers}
        route={routingHook.route}
        toast={toast}
        onLocationSelect={undefined}
        onMarkerDrag={handleMarkerDrag}
        mapZoomToFromRef={mapZoomToFromRef}
        mapZoomToToRef={mapZoomToToRef}
        mapZoomToRouteRef={mapZoomToRouteRef}
        manualPinMode={locationHandlers?.manualPinMode}
        onManualPinConfirm={locationHandlers?.onManualPinConfirm}
        onMarkerClick={handleMapMarkerClick}
        manualPinAddress={manualPinAddress}
      />

      {/* Head & notification */}
      <CustomerPageHeader 
        userName={user.name}
        onSignOut={signOut}
      />
      
      {/* مربعات البحث */}
      <div className="absolute top-20 left-4 right-4 z-30">
        <LocationInputs
          fromLocation={locationHook.fromLocation}
          toLocation={locationHook.toLocation}
          setFromLocation={locationHook.setFromLocation}
          setToLocation={locationHook.setToLocation}
          onSearchLocation={locationHook.searchLocation}
          onSelectLocation={locationHandlers?.selectLocation || (() => {})}
          fromSuggestions={locationHook.fromSuggestions}
          toSuggestions={locationHook.toSuggestions}
          showFromSuggestions={locationHook.showFromSuggestions}
          showToSuggestions={locationHook.showToSuggestions}
          useCurrentLocation={locationHook.useCurrentLocation}
          setShowFromSuggestions={locationHook.setShowFromSuggestions}
          setShowToSuggestions={locationHook.setShowToSuggestions}
          onManualFromPin={locationHandlers?.handleManualFromPin || (() => {})}
          onManualToPin={locationHandlers?.handleManualToPin || (() => {})}
        />
      </div>
      
      {/* لوحة الطلب */}
      <OrderPanel
        orderOpen={orderOpen}
        setOrderOpen={setOrderOpen}
        vehicleTypes={vehicleTypes}
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
        fromLocation={locationHook.fromLocation}
        toLocation={locationHook.toLocation}
        routeDistance={routingHook.routeDistance}
        estimatedPrice={estimatedPrice}
        isScheduled={rideHook.isScheduled}
        setIsScheduled={rideHook.setIsScheduled}
        scheduleDate={rideHook.scheduleDate}
        setScheduleDate={rideHook.setScheduleDate}
        scheduleTime={rideHook.scheduleTime}
        setScheduleTime={rideHook.setScheduleTime}
        requestRide={rideHook.requestRide}
      />
    </div>
  );
};

export default CustomerPage;
