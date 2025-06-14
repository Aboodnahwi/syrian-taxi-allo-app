import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVehiclePricing } from '@/hooks/useVehiclePricing';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NotificationSystem from '@/components/NotificationSystem';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import React from "react";
import { useAutoCenterOnUser } from "@/hooks/useAutoCenterOnUser";
import { useManualPinMode } from "@/hooks/useManualPinMode";
import { useDraggablePinState } from "@/hooks/useDraggablePinState";
import CustomerMapPanel from '@/components/customer/CustomerMapPanel';
import {
  getVehicleName,
  getVehicleIcon,
  getVehicleColor,
} from '@/utils/vehicleUtils';

// Helper: governorate center mapping (for demo, put real coords as needed)
const GOVERNORATE_CENTERS: Record<string, [number, number]> = {
  "دمشق": [33.5138, 36.2765],
  "ريف دمشق": [33.5167, 36.3167],
  "حلب": [36.2021, 37.1343],
  // ... add more ...
};

const CustomerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { pricing, calculatePrice } = useVehiclePricing();
  const trips = useRealTimeTrips('customer', user?.id);

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoordinates, setFromCoordinates] = useState<[number, number] | null>(null);
  const [toCoordinates, setToCoordinates] = useState<[number, number] | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState('regular');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [routeDistance, setRouteDistance] = useState(0);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [orderOpen, setOrderOpen] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5138, 36.2765]);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [userLocated, setUserLocated] = useState(false);
  const [manualPinMode, setManualPinMode] = useState<"none"|"from"|"to">("none");
  const [fromInitialized, setFromInitialized] = useState(false);

  const {
    fromDraggable,
    enableDraggable,
    disableDraggable,
    setFromDraggable
  } = useDraggablePinState({
    manualPinMode,
    setManualPinMode
  });

  // Auto-locate user on first load
  useEffect(() => {
    if (!fromInitialized && !fromCoordinates && navigator.geolocation) {
      console.log("[CustomerPage] Getting user location on first load");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("[CustomerPage] User location found:", lat, lng);
          setFromCoordinates([lat, lng]);
          setFromLocation("موقعي الحالي");
          setMapCenter([lat, lng]);
          setMapZoom(17);
          setUserLocated(true);
          setFromInitialized(true);
          
          toast({
            title: "تم تحديد موقعك",
            description: "تم تحديد موقعك الحالي كنقطة انطلاق",
            className: "bg-green-50 border-green-200 text-green-800"
          });
        },
        (error) => {
          console.error("[CustomerPage] Error getting user location:", error);
          setFromInitialized(true);
          toast({
            title: "تعذر تحديد الموقع",
            description: "يرجى السماح بالوصول لخدمات الموقع لتحديد موقعك تلقائياً",
            variant: "destructive"
          });
        }
      );
    }
  }, [fromInitialized, fromCoordinates, toast]);

  // Callbacks refs to allow triggering zooms from parent
  const mapZoomToFromRef = useRef<() => void>();
  const mapZoomToToRef = useRef<() => void>();
  const mapZoomToRouteRef = useRef<() => void>();

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

  // Draw route when both coordinates are available
  useEffect(() => {
    const drawRouteAndFit = async () => {
      if (fromCoordinates && toCoordinates) {
        console.log("[CustomerPage] Drawing route between:", fromCoordinates, toCoordinates);
        await calculateRoute();
        setTimeout(() => mapZoomToRouteRef.current?.(), 500);
      } else {
        console.log("[CustomerPage] No coordinates for route - clearing route");
        setRoute([]);
      }
    };
    drawRouteAndFit();
  }, [fromCoordinates, toCoordinates]);

  // Search for location
  const searchLocation = async (query: string, type: 'from' | 'to') => {
    if (query.length < 3) {
      if (type === 'from') setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sy&limit=5&addressdetails=1`
      );
      const data = await response.json();
      const suggestions = data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));
      if (type === 'from') {
        setFromSuggestions(suggestions);
        setShowFromSuggestions(true);
      } else {
        setToSuggestions(suggestions);
        setShowToSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  // Calculate route
  const calculateRoute = async () => {
    if (!fromCoordinates || !toCoordinates) {
      console.log("[CustomerPage] calculateRoute: missing coordinates");
      return;
    }
    
    console.log("[CustomerPage] calculateRoute: calculating from", fromCoordinates, "to", toCoordinates);
    
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248e12d4b05e23f4f36be3b1b7f7c69a82a&start=${fromCoordinates[1]},${fromCoordinates[0]}&end=${toCoordinates[1]},${toCoordinates[0]}`
      );
      const data = await response.json();
      if (!response.ok) {
        console.error('Error from openrouteservice:', data);
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }
      if (data.features && data.features[0]) {
        const coordinates = data.features[0].geometry.coordinates;
        const routeCoords = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
        console.log("[CustomerPage] Route calculated successfully:", routeCoords.length, "points");
        setRoute(routeCoords);
        const distance = data.features[0].properties.segments[0].distance / 1000;
        setRouteDistance(distance);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "خطأ في حساب المسار",
        description: "تعذر الحصول على مسار الرحلة. سيتم الاعتماد على المسافة المباشرة.",
        variant: "destructive"
      });
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      setRouteDistance(distance);
      setRoute([]);
    }
  };

  const calculateDirectDistance = (from: [number, number], to: [number, number]) => {
    const R = 6371;
    const dLat = (to[0] - from[0]) * Math.PI / 180;
    const dLon = (to[1] - from[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (routeDistance > 0) {
      const price = calculatePrice(routeDistance, selectedVehicle);
      setEstimatedPrice(price);
    }
  }, [routeDistance, selectedVehicle, calculatePrice]);

  const requestRide = async () => {
    if (!fromLocation || !toLocation || !fromCoordinates || !toCoordinates) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد نقطة الانطلاق والوجهة",
        variant: "destructive"
      });
      return;
    }
    if (isScheduled && (!scheduleDate || !scheduleTime)) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد تاريخ ووقت الرحلة المجدولة",
        variant: "destructive"
      });
      return;
    }
    try {
      const scheduledTime = isScheduled ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null;
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      const price = calculatePrice(distance, selectedVehicle);

      const { data, error } = await supabase
        .from('trips')
        .insert({
          customer_id: user?.id,
          from_location: fromLocation,
          to_location: toLocation,
          from_coordinates: `(${fromCoordinates[0]},${fromCoordinates[1]})`,
          to_coordinates: `(${toCoordinates[0]},${toCoordinates[1]})`,
          vehicle_type: selectedVehicle,
          distance_km: distance,
          price: price,
          scheduled_time: scheduledTime,
          status: scheduledTime ? 'scheduled' : 'pending'
        })
        .select();

      if (error) throw error;

      toast({
        title: "تم إرسال طلب الرحلة",
        description: "سيتم إشعارك عند العثور على سائق مناسب",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      setFromLocation('');
      setToLocation('');
      setFromCoordinates(null);
      setToCoordinates(null);
      setRoute([]);
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الطلب",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Update useCurrentLocation to adjust zoom and center
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFromCoordinates([lat, lng]);
          setFromLocation('موقعي الحالي');
          setShowFromSuggestions(false);
          setMapCenter([lat, lng]);
          setMapZoom(17);
          setUserLocated(true);
        },
        (error) => {
          toast({
            title: "تعذر تحديد الموقع",
            description: "يرجى السماح بالوصول للموقع",
            variant: "destructive"
          });
        }
      );
    }
  };

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
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-taxi-500 to-emerald-500 p-2 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold font-cairo">ألو تكسي</h1>
              <p className="text-slate-300 text-sm font-tajawal">مرحباً، {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationSystem userType="customer" />
            <Button variant="ghost" onClick={signOut} className="text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
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
