
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone, LogOut, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NotificationSystem from '@/components/NotificationSystem';

// طلبات الرحلات التجريبية
const mockRideRequests = [
  {
    id: 1,
    customerName: 'أحمد محمد',
    from: 'المزة',
    to: 'الصالحية',
    distance: '5.2 كم',
    price: 2500,
    vehicleType: 'سيارة مكيفة',
    estimatedTime: '15 دقيقة',
    customerLocation: [33.5138, 36.2765],
    urgent: false
  },
  {
    id: 2,
    customerName: 'فاطمة علي',
    from: 'جرمانا',
    to: 'باب توما',
    distance: '8.1 كم',
    price: 3200,
    vehicleType: 'سيارة VIP',
    estimatedTime: '22 دقيقة',
    customerLocation: [33.5023, 36.3012],
    urgent: true
  }
];

const DriverPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [rideRequests, setRideRequests] = useState(mockRideRequests);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth?type=driver');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'driver') {
      navigate('/auth?type=driver');
      return;
    }
    setUser(parsedUser);
  }, [navigate]);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    const map = L.map(mapRef.current).setView([33.5138, 36.2765], 12);

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
            
            // إضافة علامة للسائق
            L.marker([lat, lng])
              .addTo(mapInstanceRef.current)
              .bindPopup('موقعك - سائق')
              .openPopup();
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // عرض طلبات الرحلات على الخريطة
  useEffect(() => {
    if (mapInstanceRef.current && isOnline) {
      const L = (window as any).L;
      
      // مسح العلامات السابقة
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && layer.options.icon) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // إضافة علامات طلبات الرحلات
      rideRequests.forEach((request) => {
        const marker = L.marker(request.customerLocation, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="bg-taxi-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path d="M10 2L3 7v11h14V7l-7-5z"/>
                     </svg>
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`
          <div class="font-tajawal">
            <strong>${request.customerName}</strong><br>
            من: ${request.from}<br>
            إلى: ${request.to}<br>
            المسافة: ${request.distance}<br>
            السعر: ${request.price} ل.س
          </div>
        `);
      });

      // إضافة موقع السائق
      if (currentLocation) {
        L.marker(currentLocation, {
          icon: L.divIcon({
            className: 'driver-marker',
            html: `<div class="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white animate-pulse">
                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                       <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z"/>
                     </svg>
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapInstanceRef.current);
      }
    }
  }, [isOnline, rideRequests, currentLocation]);

  // تبديل حالة السائق
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "تم إيقاف الخدمة" : "تم تشغيل الخدمة",
      description: isOnline ? "لن تصلك طلبات جديدة" : "يمكنك الآن استقبال الطلبات",
      className: isOnline ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
    });
  };

  // قبول طلب الرحلة
  const acceptRide = (request: any) => {
    setActiveRide(request);
    setRideStatus('accepted');
    setRideRequests(rideRequests.filter(r => r.id !== request.id));
    
    toast({
      title: "تم قبول الرحلة",
      description: `رحلة ${request.customerName} من ${request.from} إلى ${request.to}`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  // رفض طلب الرحلة
  const rejectRide = (requestId: number) => {
    setRideRequests(rideRequests.filter(r => r.id !== requestId));
    toast({
      title: "تم رفض الرحلة",
      description: "تم رفض طلب الرحلة",
      className: "bg-orange-50 border-orange-200 text-orange-800"
    });
  };

  // تحديث حالة الرحلة
  const updateRideStatus = (status: 'arrived' | 'started' | 'completed') => {
    setRideStatus(status);
    
    const statusMessages = {
      arrived: "تم الإعلان عن الوصول",
      started: "تم بدء الرحلة",
      completed: "تم إنهاء الرحلة بنجاح"
    };

    toast({
      title: statusMessages[status],
      description: status === 'completed' ? "يمكنك الآن استقبال طلبات جديدة" : "",
      className: "bg-green-50 border-green-200 text-green-800"
    });

    if (status === 'completed') {
      setActiveRide(null);
      setRideStatus(null);
    }
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
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-900/95 to-emerald-900/95 backdrop-blur-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-emerald-500 to-taxi-500 p-2 rounded-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold font-cairo">سائق ألو تكسي</h1>
              <p className="text-slate-300 text-sm font-tajawal">مرحباً، {user.name || 'سائق'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleOnlineStatus}
              className={`${
                isOnline 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-slate-500 hover:bg-slate-600'
              } text-white px-4 py-2`}
            >
              {isOnline ? 'متصل' : 'غير متصل'}
            </Button>
            
            <NotificationSystem userType="driver" />
            
            <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* حالة السائق */}
      <div className="absolute top-20 right-4 z-30">
        <Badge 
          className={`${
            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          } text-white px-3 py-2 text-sm font-tajawal`}
        >
          {isOnline ? '🟢 متاح للعمل' : '🔴 غير متاح'}
        </Badge>
      </div>

      {/* الرحلة النشطة */}
      {activeRide && (
        <div className="absolute top-20 left-4 right-4 z-30">
          <Card className="bg-white/95 backdrop-blur-sm border-emerald-200 border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-800 font-cairo text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                رحلة نشطة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 font-tajawal">الزبون:</span>
                  <p className="font-semibold text-slate-800">{activeRide.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-600 font-tajawal">السعر:</span>
                  <p className="font-semibold text-emerald-600">{activeRide.price.toLocaleString()} ل.س</p>
                </div>
                <div>
                  <span className="text-slate-600 font-tajawal">من:</span>
                  <p className="font-semibold text-slate-800">{activeRide.from}</p>
                </div>
                <div>
                  <span className="text-slate-600 font-tajawal">إلى:</span>
                  <p className="font-semibold text-slate-800">{activeRide.to}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {rideStatus === 'accepted' && (
                  <Button 
                    onClick={() => updateRideStatus('arrived')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    وصلت للزبون
                  </Button>
                )}
                {rideStatus === 'arrived' && (
                  <Button 
                    onClick={() => updateRideStatus('started')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    بدء الرحلة
                  </Button>
                )}
                {rideStatus === 'started' && (
                  <Button 
                    onClick={() => updateRideStatus('completed')}
                    className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
                  >
                    انتهاء الرحلة
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className="px-3 border-slate-300 hover:bg-slate-50"
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* طلبات الرحلات */}
      {!activeRide && isOnline && rideRequests.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[50vh] overflow-y-auto">
          <div className="p-4 space-y-3">
            <h3 className="text-white font-bold font-cairo text-lg bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 text-center">
              طلبات الرحلات ({rideRequests.length})
            </h3>
            
            {rideRequests.map((request) => (
              <Card key={request.id} className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-slate-600" />
                      <span className="font-semibold text-slate-800">{request.customerName}</span>
                      {request.urgent && (
                        <Badge className="bg-red-500 text-white text-xs">عاجل</Badge>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-emerald-600">{request.price.toLocaleString()} ل.س</p>
                      <p className="text-xs text-slate-500">{request.distance}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-600">من:</span>
                      <span className="font-semibold">{request.from}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-slate-600">إلى:</span>
                      <span className="font-semibold">{request.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">وقت التوصيل المتوقع:</span>
                      <span className="font-semibold">{request.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => acceptRide(request)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      قبول الرحلة
                    </Button>
                    <Button 
                      onClick={() => rejectRide(request.id)}
                      variant="outline"
                      className="px-4 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      رفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* رسالة عدم وجود طلبات */}
      {!activeRide && isOnline && rideRequests.length === 0 && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <Card className="bg-white/90 backdrop-blur-sm border-0">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-slate-800 font-semibold font-cairo mb-2">لا توجد طلبات حالياً</h3>
              <p className="text-slate-600 font-tajawal text-sm">
                ستظهر الطلبات الجديدة هنا عندما يطلبها الزبائن
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* رسالة عدم الاتصال */}
      {!isOnline && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-600">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-white font-semibold font-cairo mb-2">غير متصل</h3>
              <p className="text-slate-300 font-tajawal text-sm mb-4">
                اضغط على "متصل" في الأعلى لبدء استقبال الطلبات
              </p>
              <Button 
                onClick={toggleOnlineStatus}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                بدء العمل
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DriverPage;
