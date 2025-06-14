import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Car, LogOut, Search, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVehiclePricing } from '@/hooks/useVehiclePricing';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/map/Map';
import NotificationSystem from '@/components/NotificationSystem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronUp, ChevronDown } from "lucide-react";
import React from "react";

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

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!user || user.role !== 'customer') {
      navigate('/auth?type=customer');
    }
  }, [user, navigate]);

  const handleMapClick = (lat: number, lng: number, address: string) => {
    // حالياً، سيتم تحديد نقطة الانطلاق فقط. يمكن تطويرها لاحقاً لاختيار بين نقطة الانطلاق والوجهة
    setFromCoordinates([lat, lng]);
    setFromLocation(address);
    setShowFromSuggestions(false); // إخفاء أي اقتراحات عناوين مفتوحة
    toast({
      title: "تم تحديد نقطة الانطلاق",
      description: address.substring(0, 50) + "...",
      className: "bg-blue-50 border-blue-200 text-blue-800"
    });
  };

  // البحث عن العناوين
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

  // اختيار موقع من الاقتراحات
  const selectLocation = (suggestion: any, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromLocation(suggestion.name);
      setFromCoordinates([suggestion.lat, suggestion.lon]);
      setShowFromSuggestions(false);
    } else {
      setToLocation(suggestion.name);
      setToCoordinates([suggestion.lat, suggestion.lon]);
      setShowToSuggestions(false);
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
        
        const distance = data.features[0].properties.segments[0].distance / 1000; // بالكيلومتر
        setRouteDistance(distance);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "خطأ في حساب المسار",
        description: "تعذر الحصول على مسار الرحلة. سيتم الاعتماد على المسافة المباشرة.",
        variant: "destructive"
      });
      // حساب المسافة المباشرة كبديل
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      setRouteDistance(distance);
      setRoute([]); // Clear any old route
    }
  };

  const calculateDirectDistance = (from: [number, number], to: [number, number]) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (to[0] - from[0]) * Math.PI / 180;
    const dLon = (to[1] - from[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // حساب السعر المتوقع
  useEffect(() => {
    if (routeDistance > 0) {
      const price = calculatePrice(routeDistance, selectedVehicle);
      setEstimatedPrice(price);
    }
  }, [routeDistance, selectedVehicle, calculatePrice]);

  // طلب الرحلة
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
      
      // حساب المسافة والسعر
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

      // إعادة تعيين النموذج
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

  // تحديد الموقع الحالي
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFromCoordinates([lat, lng]);
          setFromLocation('موقعي الحالي');
          setShowFromSuggestions(false);
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

  return (
    <div className="relative w-full h-screen min-h-screen bg-slate-900 overflow-hidden">
      {/* الخريطة - كخلفية تمتد لكل الشاشة */}
      <div className="fixed inset-0 z-0">
        <Map
          className="w-full h-full min-h-screen"
          markers={[
            ...(fromCoordinates ? [{
              id: 'from',
              position: fromCoordinates,
              popup: 'نقطة الانطلاق'
            }] : []),
            ...(toCoordinates ? [{
              id: 'to',
              position: toCoordinates,
              popup: 'الوجهة'
            }] : [])
          ]}
          route={route}
          toast={toast}
          onLocationSelect={handleMapClick}
        />
      </div>

      {/* الشريط العلوي */}
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
      <div className="absolute top-20 left-4 right-4 z-30 space-y-3">
        {/* البحث عن نقطة الانطلاق */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="من أين تريد أن تنطلق؟"
                value={fromLocation}
                onChange={(e) => {
                  setFromLocation(e.target.value);
                  searchLocation(e.target.value, 'from');
                }}
                className="bg-white/95 backdrop-blur-sm border-0 text-slate-800 placeholder:text-slate-500 font-tajawal pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
            <Button 
              onClick={useCurrentLocation}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
          
          {/* اقتراحات نقطة الانطلاق */}
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-40">
              {fromSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => selectLocation(suggestion, 'from')}
                  className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 font-tajawal"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-800">{suggestion.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* البحث عن الوجهة */}
        <div className="relative">
          <Input
            placeholder="إلى أين تريد أن تذهب؟"
            value={toLocation}
            onChange={(e) => {
              setToLocation(e.target.value);
              searchLocation(e.target.value, 'to');
            }}
            className="bg-white/95 backdrop-blur-sm border-0 text-slate-800 placeholder:text-slate-500 font-tajawal pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          
          {/* اقتراحات الوجهة */}
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-40">
              {toSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => selectLocation(suggestion, 'to')}
                  className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 font-tajawal"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-800">{suggestion.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* لوحة الطلب المنسدلة */}
      <Collapsible
        open={orderOpen}
        onOpenChange={setOrderOpen}
        className="absolute left-0 right-0 bottom-0 z-50"
      >
        {/* لسان الفتح */}
        <CollapsibleTrigger
          className={`w-full flex justify-center items-center py-2 transition-all hover:bg-slate-200/80 border-t bg-white/95 shadow-lg rounded-t-2xl ${
            orderOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          aria-label={orderOpen ? "إغلاق" : "فتح لوحة طلب الرحلة"}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="w-10 h-1.5 rounded bg-slate-300 mb-0.5"></span>
            <ChevronUp className="w-6 h-6 text-slate-500 animate-bounce" />
            <span className="font-tajawal text-xs text-slate-700 mt-0.5">طلب رحلة</span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent
          className={`
            w-full
            animate-accordion-down
            bg-white/95
            backdrop-blur-sm
            border-0
            shadow-xl
            rounded-t-3xl
            data-[state=closed]:hidden
            max-h-[80vh] overflow-y-auto
          `}
        >
          {/* زر إغلاق أعلى اللوحة */}
          <div className="flex justify-center">
            <button
              className="w-12 h-8 -mb-1 bg-slate-100 rounded-b-lg flex flex-col items-center z-10 mt-2 shadow hover:bg-slate-200"
              onClick={() => setOrderOpen(false)}
            >
              <ChevronDown className="w-6 h-6 text-slate-500" />
              <span className="font-tajawal text-[10px] text-slate-600 leading-none">إغلاق</span>
            </button>
          </div>
          {/* محتوى اللوحة (نفس الكود الأساسي للوحة الطلب) */}
          <Card className="bg-transparent border-0 shadow-none rounded-t-3xl m-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-800 font-cairo text-lg">اختر نوع المركبة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* أنواع المركبات */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {vehicleTypes.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className={`min-w-[120px] p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVehicle === vehicle.id
                        ? 'border-taxi-500 bg-taxi-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full ${vehicle.color} flex items-center justify-center mx-auto mb-2`}>
                        <span className="text-2xl">{vehicle.icon}</span>
                      </div>
                      <p className="text-xs font-tajawal text-slate-700 mb-1">{vehicle.name}</p>
                      <p className="text-xs font-bold text-slate-800">{vehicle.price.toLocaleString()} ل.س</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* تفاصيل الرحلة */}
              {fromLocation && toLocation && routeDistance > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-tajawal">المسافة:</span>
                    <span className="font-semibold text-slate-800">{routeDistance.toFixed(1)} كم</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-tajawal">السعر المتوقع:</span>
                    <span className="text-lg font-bold text-emerald-600">{estimatedPrice.toLocaleString()} ل.س</span>
                  </div>
                </div>
              )}

              {/* خيارات الموعد */}
              <div className="flex gap-2">
                <Button
                  variant={!isScheduled ? "default" : "outline"}
                  onClick={() => setIsScheduled(false)}
                  className="flex-1"
                >
                  اطلب الآن
                </Button>
                <Button
                  variant={isScheduled ? "default" : "outline"}
                  onClick={() => setIsScheduled(true)}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 ml-2" />
                  جدولة الرحلة
                </Button>
              </div>

              {/* خيارات الجدولة */}
              {isScheduled && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="bg-white border-slate-200"
                  />
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-white border-slate-200"
                  />
                </div>
              )}

              {/* زر تأكيد الطلب */}
              <Button 
                onClick={requestRide}
                className="w-full btn-taxi text-lg py-4"
                disabled={!fromLocation || !toLocation}
              >
                {isScheduled ? 'جدولة الرحلة' : 'طلب الرحلة'}
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// دوال مساعدة
function getVehicleName(type: string): string {
  const names: Record<string, string> = {
    regular: 'سيارة عادية',
    ac: 'سيارة مكيفة',
    public: 'سيارة عامة',
    vip: 'سيارة VIP',
    microbus: 'ميكرو باص',
    bike: 'دراجة نارية'
  };
  return names[type] || type;
}

function getVehicleIcon(type: string): string {
  const icons: Record<string, string> = {
    regular: '🚗',
    ac: '❄️',
    public: '🚕',
    vip: '✨',
    microbus: '🚐',
    bike: '🏍️'
  };
  return icons[type] || '🚗';
}

function getVehicleColor(type: string): string {
  const colors: Record<string, string> = {
    regular: 'bg-blue-500',
    ac: 'bg-cyan-500',
    public: 'bg-yellow-500',
    vip: 'bg-purple-500',
    microbus: 'bg-green-500',
    bike: 'bg-orange-500'
  };
  return colors[type] || 'bg-blue-500';
}

export default CustomerPage;
