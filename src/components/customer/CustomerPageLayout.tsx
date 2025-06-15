
import React from 'react';
import CustomerPageHeader from '@/components/customer/CustomerPageHeader';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import CustomerMapContainer from '@/components/customer/CustomerMapContainer';

interface CustomerPageLayoutProps {
  user: any;
  signOut: () => void;
  locationHook: any;
  routingHook: any;
  rideHook: any;
  toast: (opts: any) => void;
  mapCenter: [number, number];
  mapZoom: number;
  mapZoomToFromRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef: React.MutableRefObject<(() => void) | undefined>;
  orderOpen: boolean;
  setOrderOpen: (open: boolean) => void;
  vehicleTypes: any[];
  selectedVehicle: string;
  setSelectedVehicle: (vehicle: string) => void;
  estimatedPrice: number;
  currentPinType: 'from' | 'to' | null;
  onMapMove: (center: [number, number]) => void;
  onMarkerDrag: (type: 'from' | 'to', lat: number, lng: number, address: string) => void;
  onLocationSelect: (suggestion: any, type: 'from' | 'to') => void;
  onManualPin: (type: 'from' | 'to') => void;
  onPinTypeChange: (type: 'from' | 'to' | null) => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

const CustomerPageLayout: React.FC<CustomerPageLayoutProps> = ({
  user,
  signOut,
  locationHook,
  routingHook,
  rideHook,
  toast,
  mapCenter,
  mapZoom,
  mapZoomToFromRef,
  mapZoomToToRef,
  mapZoomToRouteRef,
  orderOpen,
  setOrderOpen,
  vehicleTypes,
  selectedVehicle,
  setSelectedVehicle,
  estimatedPrice,
  currentPinType,
  onMapMove,
  onMarkerDrag,
  onLocationSelect,
  onManualPin,
  onPinTypeChange,
  setMapCenter,
  setMapZoom
}) => {
  return (
    <div className="relative w-full h-screen min-h-screen bg-slate-900 overflow-hidden">
      {/* الخريطة */}
      <CustomerMapContainer
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        locationHook={locationHook}
        routingHook={routingHook}
        toast={toast}
        mapZoomToFromRef={mapZoomToFromRef}
        mapZoomToToRef={mapZoomToToRef}
        mapZoomToRouteRef={mapZoomToRouteRef}
        currentPinType={currentPinType}
        onMapMove={onMapMove}
        onMarkerDrag={onMarkerDrag}
        onPinTypeChange={onPinTypeChange}
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
          onSelectLocation={onLocationSelect}
          fromSuggestions={locationHook.fromSuggestions}
          toSuggestions={locationHook.toSuggestions}
          showFromSuggestions={locationHook.showFromSuggestions}
          showToSuggestions={locationHook.showToSuggestions}
          useCurrentLocation={locationHook.useCurrentLocation}
          setShowFromSuggestions={locationHook.setShowFromSuggestions}
          setShowToSuggestions={locationHook.setShowToSuggestions}
          onManualFromPin={() => onManualPin('from')}
          onManualToPin={() => onManualPin('to')}
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

export default CustomerPageLayout;
