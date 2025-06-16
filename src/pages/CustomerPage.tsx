
import React, { useState, useCallback } from 'react';
import { useCustomerPageState } from '@/hooks/customer/useCustomerPageState';
import { useGlobalMarkerDragHandler } from '@/hooks/customer/useGlobalMarkerDragHandler';
import { useSimpleManualPin } from '@/hooks/customer/useSimpleManualPin';
import useCustomerMapMarkers from '@/components/customer/CustomerMapMarkers';
import CustomerPageHeader from '@/components/customer/CustomerPageHeader';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import CustomerMapPanel from '@/components/customer/CustomerMapPanel';
import {
  getVehicleName,
  getVehicleIcon,
  getVehicleColor,
} from '@/utils/vehicleUtils';

// A simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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

  const [currentPinType, setCurrentPinType] = useState<'from' | 'to' | null>(null);

  // Setup global marker drag handler
  const { handleMarkerDrag } = useGlobalMarkerDragHandler({ locationHook, toast });

  // معالج الدبوس اليدوي البسيط
  const { isManualMode, currentAddress, startManualMode, updateAddress, confirmLocation, cancelManualMode } = useSimpleManualPin({
    onConfirm: (lat, lng, address) => {
      if (currentPinType === 'from') {
        locationHook.setFromCoordinates([lat, lng]);
        locationHook.setFromLocation(address);
        toast({
          title: "تم تحديد نقطة الانطلاق",
          description: address,
          className: "bg-sky-50 border-sky-200 text-sky-800"
        });
      } else if (currentPinType === 'to') {
        locationHook.setToCoordinates([lat, lng]);
        locationHook.setToLocation(address);
        toast({
          title: "تم تحديد الوجهة",
          description: address,
          className: "bg-orange-50 border-orange-200 text-orange-800"
        });
      }
      setCurrentPinType(null);
    },
    toast
  });

  const debouncedSetFromCoordinates = useCallback(debounce(locationHook.setFromCoordinates, 300), [locationHook.setFromCoordinates]);
  const debouncedSetToCoordinates = useCallback(debounce(locationHook.setToCoordinates, 300), [locationHook.setToCoordinates]);

  // معالج الخريطة العالمي
  React.useEffect(() => {
    const handleMarkerDragMove = (type: 'from' | 'to', lat: number, lng: number) => {
      if (type === 'from') {
        debouncedSetFromCoordinates([lat, lng]);
      } else {
        debouncedSetToCoordinates([lat, lng]);
      }
    };

    const handleMarkerDragEnd = (type: 'from' | 'to', lat: number, lng: number, address: string) => {
      if (type === 'from') {
        locationHook.setFromCoordinates([lat, lng]);
        locationHook.setFromLocation(address);
      } else {
        locationHook.setToCoordinates([lat, lng]);
        locationHook.setToLocation(address);
      }
    };
    
    (window as any).handleMarkerDrag = handleMarkerDragEnd;
    (window as any).handleMarkerDragMove = handleMarkerDragMove;
    
    return () => {
      delete (window as any).handleMarkerDrag;
      delete (window as any).handleMarkerDragMove;
    }
  }, [locationHook, debouncedSetFromCoordinates, debouncedSetToCoordinates]);

  // معالج تحريك الخريطة للدبوس اليدوي
  const handleMapMove = useCallback((center: [number, number]) => {
    setMapCenter(center);
    if (isManualMode) {
      updateAddress(center[0], center[1]);
    }
  }, [setMapCenter, isManualMode, updateAddress]);

  // معالج بدء الدبوس اليدوي
  const handleManualPin = useCallback((type: 'from' | 'to') => {
    setCurrentPinType(type);
    startManualMode(type);
  }, [startManualMode]);

  // Calculate markers
  const markers = useCustomerMapMarkers({
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    fromLocation: locationHook.fromLocation,
    toLocation: locationHook.toLocation,
    manualPinMode: isManualMode ? currentPinType || 'none' : 'none',
    mapCenter,
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
        onMapMove={handleMapMove}
        manualPinMode={isManualMode ? (currentPinType || 'none') : 'none'}
        onManualPinConfirm={(lat, lng) => confirmLocation(lat, lng)}
        manualPinAddress={currentAddress}
        manualPinCoordinates={isManualMode ? mapCenter : null}
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
          onSelectLocation={(suggestion, type) => {
            if (type === "from") {
              locationHook.setFromLocation(suggestion.name);
              locationHook.setFromCoordinates([suggestion.lat, suggestion.lon]);
              locationHook.setShowFromSuggestions(false);
              setMapCenter([suggestion.lat, suggestion.lon]);
              setMapZoom(17);
            } else {
              locationHook.setToLocation(suggestion.name);
              locationHook.setToCoordinates([suggestion.lat, suggestion.lon]);
              locationHook.setShowToSuggestions(false);
              setMapCenter([suggestion.lat, suggestion.lon]);
              setMapZoom(17);
            }
          }}
          fromSuggestions={locationHook.fromSuggestions}
          toSuggestions={locationHook.toSuggestions}
          showFromSuggestions={locationHook.showFromSuggestions}
          showToSuggestions={locationHook.showToSuggestions}
          useCurrentLocation={locationHook.useCurrentLocation}
          setShowFromSuggestions={locationHook.setShowFromSuggestions}
          setShowToSuggestions={locationHook.setShowToSuggestions}
          onManualFromPin={() => handleManualPin('from')}
          onManualToPin={() => handleManualPin('to')}
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
