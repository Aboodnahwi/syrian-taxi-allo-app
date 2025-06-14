import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehiclePricing } from '@/hooks/useVehiclePricing';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { useToast } from '@/hooks/use-toast';
import { useManualPinMode } from "@/hooks/useManualPinMode";
import { useDraggablePinState } from "@/hooks/useDraggablePinState";
import { useCustomerLocation } from '@/hooks/customer/useCustomerLocation';
import { useCustomerRouting } from '@/hooks/customer/useCustomerRouting';
import { useCustomerRide } from '@/hooks/customer/useCustomerRide';
import CustomerPageHeader from '@/components/customer/CustomerPageHeader';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import CustomerMapPanel from '@/components/customer/CustomerMapPanel';
import React from "react";
import {
  getVehicleName,
  getVehicleIcon,
  getVehicleColor,
} from '@/utils/vehicleUtils';

const CustomerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { pricing, calculatePrice } = useVehiclePricing();
  const trips = useRealTimeTrips('customer', user?.id);

  const [selectedVehicle, setSelectedVehicle] = useState('regular');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5138, 36.2765]);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [manualPinMode, setManualPinMode] = useState<"none"|"from"|"to">("none");

  // Callbacks refs to allow triggering zooms from parent
  const mapZoomToFromRef = useRef<() => void>();
  const mapZoomToToRef = useRef<() => void>();
  const mapZoomToRouteRef = useRef<() => void>();

  const {
    fromLocation,
    setFromLocation,
    toLocation,
    setToLocation,
    fromCoordinates,
    setFromCoordinates,
    toCoordinates,
    setToCoordinates,
    fromSuggestions,
    toSuggestions,
    showFromSuggestions,
    setShowFromSuggestions,
    showToSuggestions,
    setShowToSuggestions,
    userLocated,
    setUserLocated,
    searchLocation,
    useCurrentLocation
  } = useCustomerLocation({
    toast,
    setMapCenter,
    setMapZoom
  });

  const { route, routeDistance } = useCustomerRouting({
    fromCoordinates,
    toCoordinates,
    toast,
    mapZoomToRouteRef
  });

  const {
    isScheduled,
    setIsScheduled,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    requestRide
  } = useCustomerRide({
    userId: user?.id || '',
    fromLocation,
    toLocation,
    fromCoordinates,
    toCoordinates,
    selectedVehicle,
    calculatePrice,
    calculateDirectDistance: (from, to) => {
      const R = 6371;
      const dLat = (to[0] - from[0]) * Math.PI / 180;
      const dLon = (to[1] - from[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    },
    toast,
    setFromLocation,
    setToLocation,
    setFromCoordinates,
    setToCoordinates,
    setRoute: () => {} // This will be handled by useCustomerRouting
  });

  const {
    fromDraggable,
    enableDraggable,
    disableDraggable,
    setFromDraggable
  } = useDraggablePinState({
    manualPinMode,
    setManualPinMode
  });

  // Handle marker drag
  const handleMarkerDrag = async (
    type: 'from' | 'to',
    lat: number,
    lng: number,
    address: string
  ) => {
    console.log("[CustomerPage] handleMarkerDrag:", type, lat, lng, address);
    
    if (type === 'from') {
      setFromCoordinates([lat, lng]);
      setFromLocation(address);
      if (manualPinMode === "from") {
        setTimeout(() => {
          disableDraggable();
        }, 100);
      }
    } else {
      setToCoordinates([lat, lng]);
      setToLocation(address);
    }
  };

  const {
    handleManualFromPin: _handleManualFromPinBase,
    handleManualToPin: _handleManualToPinBase,
    handleMapClickManual
  } = useManualPinMode({
    setManualPinMode,
    setFromCoordinates,
    setToCoordinates,
    setFromLocation,
    setToLocation,
    setMapCenter,
    setMapZoom,
    showToast: toast,
    fromCoordinates,
    toCoordinates,
    mapCenter
  });

  const handleManualFromPin = () => {
    console.log("[CustomerPage] handleManualFromPin called");
    _handleManualFromPinBase();
    enableDraggable();
  };

  const handleManualToPin = () => {
    console.log("[CustomerPage] handleManualToPin called");
    _handleManualToPinBase();
  };

  const handleMapClick = (lat: number, lng: number, address: string) => {
    console.log("[CustomerPage] handleMapClick:", lat, lng, address, "mode:", manualPinMode);
    
    if (manualPinMode === "from") {
      setFromCoordinates([lat, lng]);
      setFromLocation(address);
      setMapCenter([lat, lng]);
      setMapZoom(17);
      disableDraggable();
      setManualPinMode("none");
      toast({
        title: "تم تحديد نقطة الانطلاق يدويًا",
        description: address.substring(0, 50) + "...",
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
      setTimeout(() => mapZoomToFromRef.current?.(), 400);
      return;
    }
    if (manualPinMode === "to") {
      setToCoordinates([lat, lng]);
      setToLocation(address);
      setMapCenter([lat, lng]);
      setMapZoom(17);
      setManualPinMode("none");
      toast({
        title: "تم تحديد الوجهة يدويًا",
        description: address.substring(0, 50) + "...",
        className: "bg-orange-50 border-orange-200 text-orange-800"
      });
      setTimeout(() => mapZoomToToRef.current?.(), 400);
      return;
    }
    // Default behavior: set as 'from' location
    setFromCoordinates([lat, lng]);
    setFromLocation(address);
    setShowFromSuggestions(false);
    setMapCenter([lat, lng]);
    setMapZoom(17);
    setUserLocated(true);
    toast({
      title: "تم تحديد نقطة الانطلاق",
      description: address.substring(0, 50) + "...",
      className: "bg-blue-50 border-blue-200 text-blue-800"
    });
    setTimeout(() => mapZoomToFromRef.current?.(), 400);
  };

  const selectLocation = (suggestion: any, type: 'from' | 'to') => {
    console.log("[CustomerPage] selectLocation:", suggestion.name, type);
    if (type === 'from') {
      setFromLocation(suggestion.name);
      setFromCoordinates([suggestion.lat, suggestion.lon]);
      setShowFromSuggestions(false);
      setMapCenter([suggestion.lat, suggestion.lon]);
      setMapZoom(17);
      setUserLocated(true);
      setTimeout(() => {
        mapZoomToFromRef.current?.();
      }, 250);
    } else {
      setToLocation(suggestion.name);
      setToCoordinates([suggestion.lat, suggestion.lon]);
      setShowToSuggestions(false);
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
  };

  useEffect(() => {
    if (routeDistance > 0) {
      const price = calculatePrice(routeDistance, selectedVehicle);
      setEstimatedPrice(price);
    }
  }, [routeDistance, selectedVehicle, calculatePrice]);

  if (!user) return null;

  const vehicleTypes = pricing.map(p => ({
    id: p.vehicle_type,
    name: getVehicleName(p.vehicle_type),
    price: p.base_price,
    icon: getVehicleIcon(p.vehicle_type),
    color: getVehicleColor(p.vehicle_type)
  }));

  // Create markers with proper visibility and draggable settings
  const markers = [
    ...(fromCoordinates ? [{
      id: "from" as const,
      position: fromCoordinates,
      popup: fromLocation || "نقطة الانطلاق",
      draggable: fromDraggable || manualPinMode === "from",
      icon: {
        html: '<div style="background:#0ea5e9;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">📍</div>',
        iconSize: [32, 42] as [number, number],
        iconAnchor: [16, 40] as [number, number]
      }
    }] : []),
    ...(toCoordinates ? [{
      id: "to" as const,
      position: toCoordinates,
      popup: toLocation || "الوجهة",
      draggable: manualPinMode === "to",
      icon: {
        html: '<div style="background:#f59e42;width:32px;height:42px;border-radius:16px 16px 20px 20px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">🎯</div>',
        iconSize: [32, 42] as [number, number],
        iconAnchor: [16, 40] as [number, number]
      }
    }] : []),
  ];

  console.log("[CustomerPage] Rendering with markers:", markers.length, markers);
  console.log("[CustomerPage] Route length:", route.length);

  return (
    <div className="relative w-full h-screen min-h-screen bg-slate-900 overflow-hidden">
      {/* الخريطة */}
      <CustomerMapPanel
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        markers={markers}
        route={route}
        toast={toast}
        onLocationSelect={handleMapClick}
        onMarkerDrag={handleMarkerDrag}
        mapZoomToFromRef={mapZoomToFromRef}
        mapZoomToToRef={mapZoomToToRef}
        mapZoomToRouteRef={mapZoomToRouteRef}
      />
      
      {/* Head & notification */}
      <CustomerPageHeader 
        userName={user.name}
        onSignOut={signOut}
      />
      
      {/* مربعات البحث */}
      <div className="absolute top-20 left-4 right-4 z-30">
        <LocationInputs
          fromLocation={fromLocation}
          toLocation={toLocation}
          setFromLocation={setFromLocation}
          setToLocation={setToLocation}
          onSearchLocation={searchLocation}
          onSelectLocation={selectLocation}
          fromSuggestions={fromSuggestions}
          toSuggestions={toSuggestions}
          showFromSuggestions={showFromSuggestions}
          showToSuggestions={showToSuggestions}
          useCurrentLocation={useCurrentLocation}
          setShowFromSuggestions={setShowFromSuggestions}
          setShowToSuggestions={setShowToSuggestions}
          onManualFromPin={handleManualFromPin}
          onManualToPin={handleManualToPin}
        />
      </div>
      
      {/* لوحة الطلب */}
      <OrderPanel
        orderOpen={orderOpen}
        setOrderOpen={setOrderOpen}
        vehicleTypes={vehicleTypes}
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
        fromLocation={fromLocation}
        toLocation={toLocation}
        routeDistance={routeDistance}
        estimatedPrice={estimatedPrice}
        isScheduled={isScheduled}
        setIsScheduled={setIsScheduled}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        scheduleTime={scheduleTime}
        setScheduleTime={setScheduleTime}
        requestRide={requestRide}
      />
    </div>
  );
};

export default CustomerPage;
