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
import Map from '@/components/map/Map';
import NotificationSystem from '@/components/NotificationSystem';
import LocationInputs from '@/components/customer/LocationInputs';
import OrderPanel from '@/components/customer/OrderPanel';
import React from "react";
import { useAutoCenterOnUser } from "@/hooks/useAutoCenterOnUser";
import { useManualPinMode } from "@/hooks/useManualPinMode";

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

  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5138, 36.2765]); // Default: دمشق
  const [mapZoom, setMapZoom] = useState<number>(11); // default zoom
  const [userLocated, setUserLocated] = useState(false); // لمعرفة هل حُدّد موقع المستخدم
  const [manualPinMode, setManualPinMode] = useState<"none"|"from"|"to">("none");

  // اجلب ملف المستخدم لتحديد المحافظة
  useEffect(() => {
    if (!user || user.role !== 'customer') {
      navigate('/auth?type=customer');
      return;
    }
    // فقط ضع الخريطة على المحافظة عند الدخول الأول إذا لم يتم تعيين موقع المستخدم
    const gov = (user as any).governorate;
    if (gov && GOVERNORATE_CENTERS[gov] && !userLocated && !fromCoordinates) {
      setMapCenter(GOVERNORATE_CENTERS[gov]);
      setMapZoom(11);
    }
    // إذا تم تحديد إحداثيات نقطة الانطلاق، لا ترجّع الكاميرا للمحافظة
  }, [user, navigate, userLocated, fromCoordinates]);

  // عند أول تحميل: قرّب على موقع المستخدم وضع الزووم للأقرب
  useAutoCenterOnUser({
    setMapCenter: (coords) => {
      setMapCenter(coords);
      setMapZoom(17); // زووم قريب جدًا على موقع المستخدم
      setUserLocated(true); // تم تحديد الموقع
    },
    setFromCoordinates,
    setFromLocation,
    toast,
    setZoomLevel: (z) => setMapZoom(z)
  });

  // Callbacks refs to allow triggering zooms from parent
  const mapZoomToFromRef = useRef<() => void>();
  const mapZoomToToRef = useRef<() => void>();
  const mapZoomToRouteRef = useRef<() => void>();

  // عند تحريك أي دبوس (سواء نقطة الانطلاق أو الوجهة)
  const handleMarkerDrag = async (
    type: 'from' | 'to',
    lat: number,
    lng: number,
    address: string
  ) => {
    if (type === 'from') {
      setFromCoordinates([lat, lng]);
      setFromLocation(address);
      setTimeout(() => {
        mapZoomToFromRef.current?.();
      }, 350);
    } else {
      setToCoordinates([lat, lng]);
      setToLocation(address);
      setTimeout(() => {
        mapZoomToToRef.current?.();
      }, 350);
    }
    // في كلا الحالات، عند سحب أي دبوس وفي وجود الدبوس الآخر، يتم رسم الطريق وعمل fitBounds
    if (
      (type === "from" && toCoordinates) ||
      (type === "to" && fromCoordinates)
    ) {
      setTimeout(() => {
        mapZoomToRouteRef.current?.();
      }, 800);
    }
  };

  // قسمنا هذا الجزء من المنطق في hook منفصلة
  const {
    handleManualFromPin,
    handleManualToPin,
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

  // عدّلنا هنا فقط لكي تستدعي الدالة من الـ hook
  const handleMapClick = (lat: number, lng: number, address: string) => {
    if (manualPinMode === "from") {
      handleMapClickManual(lat, lng, address, "from");
      return;
    }
    if (manualPinMode === "to") {
      handleMapClickManual(lat, lng, address, "to");
      return;
    }
    // تصرف الوضع العادي القديم (تعيين نقطة انطلاق عند النقر على الخريطة)
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

  // عند اختيار عنوان نقطة الانطلاق/الوجهة من الاقتراحات أو البحث
  const selectLocation = (suggestion: any, type: 'from' | 'to') => {
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
    }
  };

  // رسم الطريق وتقريب الكاميرا عند توفر النقطتين
  useEffect(() => {
    const drawRouteAndFit = async () => {
      if (fromCoordinates && toCoordinates) {
        await calculateRoute();
        // بعد التأكد من رسم الطريق، قرّب لتشمل الطريق بالكامل مع الدبوسين
        setTimeout(() => mapZoomToRouteRef.current?.(), 500);
      }
    };
    drawRouteAndFit();
    // eslint-disable-next-line
  }, [fromCoordinates, toCoordinates]);

  // تحسين selectLocation: زووم على "from" أو "to"، ولو حُددت النقطتين اعمل fitBounds
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

  // حساب المسار والمسافة
  useEffect(() => {
    if (fromCoordinates && toCoordinates) {
      calculateRoute();
    }
  }, [fromCoordinates, toCoordinates]);

  const calculateRoute = async () => {
    if (!fromCoordinates || !toCoordinates) return;
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

  // تحديث useCurrentLocation ليضبط الزووم والمركز
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
          console.error('Error getting location:', error);
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

  // تحديد الدبابيس
  const markers = [
    ...(fromCoordinates
      ? [{
          id: "from",
          position: fromCoordinates,
          popup: fromLocation || "نقطة الانطلاق",
          draggable: true,
          icon: {
            html: '<div style="background:#0ea5e9;width:26px;height:36px;border-radius:14px 14px 20px 20px;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;">🚩</div>',
            iconSize: [26, 36] as [number, number],
            iconAnchor: [13, 34] as [number, number]
          }
        }]
      : []),
    ...(toCoordinates
      ? [{
          id: "to",
          position: toCoordinates,
          popup: toLocation || "الوجهة",
          draggable: true,
          icon: {
            html: '<div style="background:#f59e42;width:26px;height:36px;border-radius:14px 14px 20px 20px;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;">🏁</div>',
            iconSize: [26, 36] as [number, number],
            iconAnchor: [13, 34] as [number, number]
          }
        }]
      : [])
  ];

  // أدع handleManualFromPin, handleManualToPin كـ props
  return (
    <div className="relative w-full h-screen min-h-screen bg-slate-900 overflow-hidden">
      {/* الخريطة */}
      <div className="fixed inset-0 z-0">
        <Map
          className="w-full h-full min-h-screen"
          center={mapCenter}
          zoom={mapZoom}
          markers={markers}
          route={route}
          toast={toast}
          onLocationSelect={handleMapClick}
          onMarkerDrag={handleMarkerDrag}
          mapZoomToFromRef={mapZoomToFromRef}
          mapZoomToToRef={mapZoomToToRef}
          mapZoomToRouteRef={mapZoomToRouteRef}
        />
      </div>
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

// Helper functions (FIX: add default return)
function getVehicleName(type: string): string {
  switch (type) {
    case "regular":
      return "تكسي عادي";
    case "luxury":
      return "تكسي فخم";
    case "pickup":
      return "بيك أب";
    case "van":
      return "فان";
    case "motorcycle":
      return "دراجة نارية";
    default:
      return "مركبة";
  }
}

function getVehicleIcon(type: string): string {
  switch (type) {
    case "regular":
      return "🚕";
    case "luxury":
      return "🚘";
    case "pickup":
      return "🛻";
    case "van":
      return "🚐";
    case "motorcycle":
      return "🏍️";
    default:
      return "🚗";
  }
}

function getVehicleColor(type: string): string {
  switch (type) {
    case "regular":
      return "bg-taxi-500";
    case "luxury":
      return "bg-yellow-600";
    case "pickup":
      return "bg-blue-600";
    case "van":
      return "bg-violet-600";
    case "motorcycle":
      return "bg-gray-600";
    default:
      return "bg-gray-400";
  }
}

export default CustomerPage;
