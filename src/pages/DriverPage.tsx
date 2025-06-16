
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { useVehiclePricing } from '@/hooks/useVehiclePricing';
import Map from '@/components/map/Map';
import DriverHeader from '@/components/driver/DriverHeader';
import DriverStatusBadge from '@/components/driver/DriverStatusBadge';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import RideRequestDrawer from '@/components/driver/RideRequestDrawer';
import RideMeter from '@/components/driver/RideMeter';
import DriverPageMessages from '@/components/driver/DriverPageMessages';

const DriverPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  // استخدام البيانات الحقيقية
  const { trips: rideRequests, loading: tripsLoading } = useRealTimeTrips('driver', user?.id);
  const { pricing, calculatePrice } = useVehiclePricing();

  // فلترة الرحلات للحصول على الطلبات المتاحة فقط
  const availableRequests = rideRequests.filter(trip => trip.status === 'pending' && !trip.driver_id);

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

  // الحصول على الموقع الحالي للسائق
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setCurrentLocation([lat, lng]);
          },
          (error) => {
            console.error('Error getting location:', error);
            toast({
              title: "خطأ في تحديد الموقع",
              description: "تعذر الوصول لموقعك. يرجى تفعيل خدمات الموقع.",
              variant: "destructive"
            });
          }
        );
      }
    };
    getCurrentLocation();
  }, [toast]);

  // تجهيز العلامات لعرضها على الخريطة
  useEffect(() => {
    const markers = [];
    
    // إضافة علامة السائق
    if (currentLocation) {
      markers.push({
        id: 'driver',
        position: currentLocation,
        popup: 'موقعي',
        icon: {
          html: `<div class="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 13-2 2 2 2"></path><path d="m14 17 2-2-2-2"></path></svg></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: 'driver-marker'
        }
      });
    }
    
    // إضافة علامات طلبات الرحلات
    if (isOnline && !activeRide && availableRequests.length > 0) {
      availableRequests.forEach((request) => {
        if (request.from_coordinates) {
          markers.push({
            id: `request-${request.id}`,
            position: request.from_coordinates,
            popup: `<div class="font-tajawal"><strong>طلب رحلة</strong><br>من: ${request.from_location}<br>إلى: ${request.to_location}</div>`,
            icon: {
              html: `<div class="bg-taxi-500 text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v3c0 .6.4 1 1 1h2"></path><path d="M7 17H5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1Z"></path><path d="M19 17h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1Z"></path><path d="M12 17H7"></path><path d="M17 17h-5"></path><path d="M12 5v12"></path><circle cx="12" cy="3" r="1"></circle></svg></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              className: 'custom-div-icon'
            }
          });
        }
      });
    }
    
    setMapMarkers(markers);
  }, [isOnline, availableRequests, currentLocation, activeRide]);

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
    
    toast({
      title: "تم قبول الرحلة",
      description: `رحلة من ${request.from_location} إلى ${request.to_location}`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  // رفض طلب الرحلة
  const rejectRide = (requestId: string) => {
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

  // إنهاء الرحلة مع بيانات العداد
  const handleRideComplete = (distance: number, totalPrice: number) => {
    console.log(`تم إنهاء الرحلة - المسافة: ${distance} كم، السعر النهائي: ${totalPrice} ل.س`);
    updateRideStatus('completed');
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  // الحصول على بيانات التسعير للرحلة النشطة
  const currentVehiclePricing = pricing.find(p => p.vehicle_type === activeRide?.vehicle_type) || pricing[0];

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden">
      <Map
        className="absolute inset-0 z-10"
        markers={mapMarkers}
        center={currentLocation || [33.5138, 36.2765]}
        zoom={currentLocation ? 14 : 11}
        toast={toast}
      />

      <DriverHeader 
        user={user}
        isOnline={isOnline}
        toggleOnlineStatus={toggleOnlineStatus}
        logout={logout}
      />

      <DriverStatusBadge isOnline={isOnline} />

      {rideStatus === 'started' && currentVehiclePricing && (
        <RideMeter
          isActive={true}
          basePrice={currentVehiclePricing.base_price}
          pricePerKm={currentVehiclePricing.price_per_km}
          onRideComplete={handleRideComplete}
        />
      )}

      <ActiveRideCard 
        activeRide={activeRide}
        rideStatus={rideStatus}
        updateRideStatus={updateRideStatus}
      />

      {!activeRide && isOnline && (
        <RideRequestDrawer 
          rideRequests={availableRequests}
          acceptRide={acceptRide}
          rejectRide={rejectRide}
        />
      )}
      
      <DriverPageMessages 
        activeRide={activeRide}
        isOnline={isOnline}
        rideRequestsCount={availableRequests.length}
        toggleOnlineStatus={toggleOnlineStatus}
      />
    </div>
  );
};

export default DriverPage;
