
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/map/Map';
import DriverHeader from '@/components/driver/DriverHeader';
import DriverStatusBadge from '@/components/driver/DriverStatusBadge';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import RideRequestDrawer from '@/components/driver/RideRequestDrawer';
import RideTrackingDisplay from '@/components/driver/RideTrackingDisplay';
import { useActiveRideTracking } from '@/hooks/driver/useActiveRideTracking';
import { useRealTimeRideRequests } from '@/hooks/driver/useRealTimeRideRequests';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { supabase } from '@/integrations/supabase/client';

const DriverPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapRoute, setMapRoute] = useState<[number, number][] | undefined>();

  // استخدام hooks للتتبع والطلبات
  const { trackingData, startTracking, stopTracking, isTracking } = useActiveRideTracking(activeRide);
  const { rideRequests, loading: requestsLoading } = useRealTimeRideRequests(currentLocation);
  const { trips } = useRealTimeTrips('driver', user?.id);

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

  // البحث عن الرحلة النشطة
  useEffect(() => {
    if (!user?.id) return;
    
    const activeTrip = trips.find(trip => 
      trip.status === 'accepted' || trip.status === 'started' || trip.status === 'arrived'
    );
    
    if (activeTrip && !activeRide) {
      setActiveRide(activeTrip);
      if (activeTrip.status === 'accepted') setRideStatus('accepted');
      else if (activeTrip.status === 'arrived') setRideStatus('arrived');
      else if (activeTrip.status === 'started') setRideStatus('started');
    }
  }, [trips, user?.id, activeRide]);

  // تجهيز العلامات والمسار للخريطة
  useEffect(() => {
    const markers = [];
    
    // إضافة علامة السائق
    if (currentLocation) {
      markers.push({
        id: 'driver',
        position: currentLocation,
        popup: 'موقعي',
        icon: {
          html: `<div class="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M8 18V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12l-4-2-4 2Z"></path></svg></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: 'driver-marker'
        }
      });
    }
    
    // إضافة علامات طلبات الرحلات (فقط إذا كان السائق متصل وليس لديه رحلة نشطة)
    if (isOnline && !activeRide && !isTracking) {
      rideRequests.forEach((request) => {
        markers.push({
          id: `request-${request.id}`,
          position: request.from_coordinates,
          popup: `<div class="font-tajawal"><strong>${request.customer_name}</strong><br>من: ${request.from_location}<br>إلى: ${request.to_location}</div>`,
          icon: {
            html: `<div class="bg-taxi-500 text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v3c0 .6.4 1 1 1h2"></path><path d="M7 17H5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1Z"></path><path d="M19 17h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1Z"></path><path d="M12 17H7"></path><path d="M17 17h-5"></path><path d="M12 5v12"></path><circle cx="12" cy="3" r="1"></circle></svg></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            className: 'custom-div-icon'
          }
        });
      });
    }

    // إضافة علامات للرحلة النشطة
    if (activeRide) {
      if (activeRide.from_coordinates) {
        markers.push({
          id: 'pickup',
          position: activeRide.from_coordinates,
          popup: `نقطة الانطلاق: ${activeRide.from_location}`,
          icon: {
            html: `<div class="bg-green-500 text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          }
        });
      }
      
      if (activeRide.to_coordinates) {
        markers.push({
          id: 'destination',
          position: activeRide.to_coordinates,
          popup: `الوجهة: ${activeRide.to_location}`,
          icon: {
            html: `<div class="bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          }
        });
      }
    }
    
    setMapMarkers(markers);

    // تحديث المسار
    if (isTracking && trackingData?.path) {
      setMapRoute(trackingData.path.map(pos => [pos.lat, pos.lng]));
    } else if (activeRide?.from_coordinates && activeRide?.to_coordinates && !isTracking) {
      setMapRoute([activeRide.from_coordinates, activeRide.to_coordinates]);
    } else {
      setMapRoute(undefined);
    }
  }, [isOnline, rideRequests, currentLocation, activeRide, isTracking, trackingData]);

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
  const acceptRide = async (request: any) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          driver_id: user.id, 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      setActiveRide(request);
      setRideStatus('accepted');
      
      toast({
        title: "تم قبول الرحلة",
        description: `رحلة ${request.customer_name} من ${request.from_location} إلى ${request.to_location}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "خطأ",
        description: "تعذر قبول الرحلة",
        variant: "destructive"
      });
    }
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
  const updateRideStatus = async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) return;

    try {
      const updateData: any = { status };
      
      if (status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (status === 'started') {
        updateData.started_at = new Date().toISOString();
        startTracking(); // بدء التتبع
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (trackingData) {
          updateData.actual_duration = Math.floor((Date.now() - trackingData.startTime) / 1000 / 60);
          updateData.distance_km = trackingData.totalDistance;
          updateData.price = trackingData.totalFare;
        }
        await stopTracking(); // إنهاء التتبع
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', activeRide.id);

      if (error) throw error;

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
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: "خطأ",
        description: "تعذر تحديث حالة الرحلة",
        variant: "destructive"
      });
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
      {/* الخريطة ملء الشاشة */}
      <Map
        className="absolute inset-0 z-10"
        markers={mapMarkers}
        route={mapRoute}
        center={currentLocation || [33.5138, 36.2765]}
        zoom={currentLocation ? 14 : 11}
        toast={toast}
      />

      {/* هيدر شفاف */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <DriverHeader 
          user={user}
          isOnline={isOnline}
          toggleOnlineStatus={toggleOnlineStatus}
          logout={logout}
        />
      </div>

      {/* شارة الحالة */}
      <div className="absolute top-20 left-4 z-30">
        <DriverStatusBadge isOnline={isOnline} />
      </div>

      {/* عرض معلومات التتبع */}
      <RideTrackingDisplay trackingData={trackingData} />

      {/* كارد الرحلة النشطة */}
      {activeRide && (
        <div className="absolute top-4 right-4 z-30 max-w-sm">
          <ActiveRideCard 
            activeRide={activeRide}
            rideStatus={rideStatus}
            updateRideStatus={updateRideStatus}
          />
        </div>
      )}

      {/* درج طلبات الرحلات */}
      {!activeRide && isOnline && (
        <RideRequestDrawer 
          rideRequests={rideRequests}
          acceptRide={acceptRide}
          rejectRide={rejectRide}
          loading={requestsLoading}
        />
      )}
    </div>
  );
};

export default DriverPage;
