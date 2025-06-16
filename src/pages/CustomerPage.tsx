import React, { useState, useCallback } from 'react';
import { useCustomerPageState } from '@/hooks/customer/useCustomerPageState';
import { useGlobalMarkerDragHandler } from '@/hooks/customer/useGlobalMarkerDragHandler';
import useCustomerMapMarkers from '@/components/customer/CustomerMapMarkers';
import LocationSelectionHandler from '@/components/customer/LocationSelectionHandler';
import CustomerPageHeader from '@/components/customer/CustomerPageHeader';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import CustomerMapPanel from '@/components/customer/CustomerMapPanel';
import { useManualPinAddress } from '@/hooks/customer/useManualPinAddress';
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

  const [locationHandlers, setLocationHandlers] = useState<{
    handleManualFromPin: () => void;
    handleManualToPin: () => void;
    handleMarkerDrag: (type: 'from' | 'to') => void;
    selectLocation: (suggestion: any, type: 'from' | 'to') => void;
    manualPinMode?: "none"|"from"|"to";
    onManualPinConfirm?: (lat:number,lng:number)=>void;
  } | null>(null);

  // Setup global marker drag handler
  const { handleMarkerDrag } = useGlobalMarkerDragHandler({ locationHook, toast });

  const debouncedSetFromCoordinates = useCallback(debounce(locationHook.setFromCoordinates, 300), [locationHook.setFromCoordinates]);
  const debouncedSetToCoordinates = useCallback(debounce(locationHook.setToCoordinates, 300), [locationHook.setToCoordinates]);

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
  

  const handleMapMove = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, [setMapCenter]);

  const { manualPinAddress, manualPinCoordinates } = useManualPinAddress({
    mapCenter,
    manualPinMode: locationHandlers?.manualPinMode || 'none',
  });

  // Calculate markers
  const markers = useCustomerMapMarkers({
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    fromLocation: locationHook.fromLocation,
    toLocation: locationHook.toLocation,
    manualPinMode: locationHandlers?.manualPinMode || 'none',
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
        onMapMove={handleMapMove}
        manualPinMode={locationHandlers?.manualPinMode || 'none'}
        onManualPinConfirm={locationHandlers?.onManualPinConfirm}
        manualPinAddress={manualPinAddress}
        manualPinCoordinates={manualPinCoordinates}
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
