
import React, { useEffect } from 'react';
import { useCustomerPageState } from '@/hooks/customer/useCustomerPageState';
import { useCustomerPageHandlers } from '@/hooks/customer/useCustomerPageHandlers';
import CustomerPageLayout from '@/components/customer/CustomerPageLayout';
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

  const {
    currentPinType,
    setCurrentPinType,
    debouncedSetFromCoordinates,
    debouncedSetToCoordinates,
    handleMapMove,
    handleManualPin,
    handleMarkerDrag,
    handleLocationSelect
  } = useCustomerPageHandlers({
    locationHook,
    toast,
    setMapCenter,
    setMapZoom,
    mapCenter
  });

  // معالج الخريطة العالمي
  useEffect(() => {
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
    <CustomerPageLayout
      user={user}
      signOut={signOut}
      locationHook={locationHook}
      routingHook={routingHook}
      rideHook={rideHook}
      toast={toast}
      mapCenter={mapCenter}
      mapZoom={mapZoom}
      mapZoomToFromRef={mapZoomToFromRef}
      mapZoomToToRef={mapZoomToToRef}
      mapZoomToRouteRef={mapZoomToRouteRef}
      orderOpen={orderOpen}
      setOrderOpen={setOrderOpen}
      vehicleTypes={vehicleTypes}
      selectedVehicle={selectedVehicle}
      setSelectedVehicle={setSelectedVehicle}
      estimatedPrice={estimatedPrice}
      currentPinType={currentPinType}
      onMapMove={handleMapMove}
      onMarkerDrag={handleMarkerDrag}
      onLocationSelect={handleLocationSelect}
      onManualPin={handleManualPin}
      onPinTypeChange={setCurrentPinType}
      setMapCenter={setMapCenter}
      setMapZoom={setMapZoom}
    />
  );
};

export default CustomerPage;
