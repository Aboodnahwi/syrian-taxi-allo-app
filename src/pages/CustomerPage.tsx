
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Car, LogOut, Search, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NotificationSystem from '@/components/NotificationSystem';

// أنواع المركبات
const vehicleTypes = [
  { id: 'regular', name: 'سيارة عادية', price: 1000, icon: '🚗', color: 'bg-blue-500' },
  { id: 'ac', name: 'سيارة مكيفة', price: 1500, icon: '❄️', color: 'bg-cyan-500' },
  { id: 'public', name: 'سيارة عامة', price: 500, icon: '🚕', color: 'bg-yellow-500' },
  { id: 'vip', name: 'سيارة VIP', price: 3000, icon: '✨', color: 'bg-purple-500' },
  { id: 'microbus', name: 'ميكرو باص', price: 800, icon: '🚐', color: 'bg-green-500' },
  { id: 'bike', name: 'دراجة نارية', price: 700, icon: '🏍️', color: 'bg-orange-500' }
];

const CustomerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [user, setUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleTypes[0]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [routeDistance, setRouteDistance] = useState(0);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth?type=customer');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current) return;

    // تهيئة الخريطة
    const L = (window as any).L;
    const map = L.map(mapRef.current).setView([33.5138, 36.2765], 11); // دمشق

    // إضافة طبقة الخريطة
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // الحصول على الموقع الحالي
    getCurrentLocation();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation([lat, lng]);
          
          if (mapInstanceRef.current) {
            const L = (window as any).L;
            mapInstanceRef.current.setView([lat, lng], 15);
            
            // إضافة علامة للموقع الحالي
            L.marker([lat, lng])
              .addTo(mapInstanceRef.current)
              .bindPopup('موقعك الحالي')
              .openPopup();
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "تعذر تحديد الموقع",
            description: "يرجى السماح بالوصول للموقع أو اختيار الموقع يدوياً",
            variant: "destructive"
          });
        }
      );
    }
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
      setShowFromSuggestions(false);
    } else {
      setToLocation(suggestion.name);
      setShowToSuggestions(false);
    }

    // إضافة علامة على الخريطة
    if (mapInstanceRef.current) {
      const L = (window as any).L;
      const marker = L.marker([suggestion.lat, suggestion.lon])
        .addTo(mapInstanceRef.current)
        .bindPopup(type === 'from' ? 'نقطة الانطلاق' : 'الوجهة');
      
      mapInstanceRef.current.setView([suggestion.lat, suggestion.lon], 15);
    }
  };

  // استخدام الموقع الحالي
  const useCurrentLocation = () => {
    if (currentLocation) {
      setFromLocation('موقعي الحالي');
      setShowFromSuggestions(false);
    } else {
      getCurrentLocation();
    }
  };

  // حساب السعر المتوقع
  useEffect(() => {
    if (fromLocation && toLocation && routeDistance > 0) {
      const basePrice = selectedVehicle.price;
      const distancePrice = routeDistance * 100; // 100 ليرة لكل كيلومتر
      setEstimatedPrice(basePrice + distancePrice);
    }
  }, [fromLocation, toLocation, selectedVehicle, routeDistance]);

  // طلب الرحلة
  const requestRide = () => {
    if (!fromLocation || !toLocation) {
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

    const rideData = {
      from: fromLocation,
      to: toLocation,
      vehicleType: selectedVehicle,
      estimatedPrice,
      isScheduled,
      scheduleDate: isScheduled ? scheduleDate : null,
      scheduleTime: isScheduled ? scheduleTime : null,
      timestamp: new Date().toISOString()
    };

    console.log('طلب رحلة:', rideData);

    toast({
      title: "تم إرسال طلب الرحلة",
      description: "سيتم إشعارك عند العثور على سائق مناسب",
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden">
      {/* الخريطة */}
      <div ref={mapRef} className="absolute inset-0 z-10"></div>

      {/* شريط علوي */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-taxi-500 to-emerald-500 p-2 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold font-cairo">ألو تكسي</h1>
              <p className="text-slate-300 text-sm font-tajawal">مرحباً، {user.name || 'زبون'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationSystem userType="customer" />
            <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
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

      {/* لوحة الطلب */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-t-3xl m-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-800 font-cairo text-lg">اختر نوع المركبة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* أنواع المركبات */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {vehicleTypes.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`min-w-[120px] p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVehicle.id === vehicle.id
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
            {fromLocation && toLocation && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-tajawal">السعر المتوقع:</span>
                  <span className="text-lg font-bold text-emerald-600">{estimatedPrice.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-tajawal">نوع المركبة:</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle.name}</span>
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
      </div>
    </div>
  );
};

export default CustomerPage;
