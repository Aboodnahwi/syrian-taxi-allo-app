import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/map/Map';
import DriverHeader from '@/components/driver/DriverHeader';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import RideRequestDrawer from '@/components/driver/RideRequestDrawer';
import RideTrackingDisplay from '@/components/driver/RideTrackingDisplay';
import DriverPageMessages from '@/components/driver/DriverPageMessages';
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

  const { trackingData, startTracking, stopTracking, isTracking } = useActiveRideTracking(activeRide);
  const { rideRequests, loading: requestsLoading } = useRealTimeRideRequests(currentLocation);
  const { trips } = useRealTimeTrips('driver', user?.id);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'driver') {
      navigate('/auth');
      return;
    }
    setUser(parsedUser);
  }, [navigate]);

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

  useEffect(() => {
    if (!user?.id) return;
    
    const activeTrip = trips.find(trip => 
      trip.status === 'accepted' || trip.status === 'started' || trip.status === 'arrived'
    );
    
    if (activeTrip && !activeRide) {
      console.log('Setting active ride from trips:', activeTrip);
      setActiveRide(activeTrip);
      if (activeTrip.status === 'accepted') setRideStatus('accepted');
      else if (activeTrip.status === 'arrived') setRideStatus('arrived');
      else if (activeTrip.status === 'started') setRideStatus('started');
    }
  }, [trips, user?.id, activeRide]);

  useEffect(() => {
    const markers = [];
    
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

    if (isTracking && trackingData?.path) {
      setMapRoute(trackingData.path.map(pos => [pos.lat, pos.lng]));
    } else if (activeRide?.from_coordinates && activeRide?.to_coordinates && !isTracking) {
      setMapRoute([activeRide.from_coordinates, activeRide.to_coordinates]);
    } else {
      setMapRoute(undefined);
    }
  }, [isOnline, rideRequests, currentLocation, activeRide, isTracking, trackingData]);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "تم إيقاف الخدمة" : "تم تشغيل الخدمة",
      description: isOnline ? "لن تصلك طلبات جديدة" : "يمكنك الآن استقبال الطلبات",
      className: isOnline ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
    });
  };

  const acceptRide = async (request: any) => {
    try {
      console.log('Accepting ride:', request);
      console.log('Driver user object:', user);

      // التأكد من وجود معرف السائق
      if (!user?.id) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معرف السائق",
          variant: "destructive"
        });
        return;
      }

      // التحقق من وجود السائق في جدول drivers أولاً
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let driverId = driverData?.id;

      // إذا لم نجد السائق، ننشئه
      if (driverError && driverError.code === 'PGRST116') {
        console.log('Driver not found, creating new driver record...');
        const { data: newDriver, error: createError } = await supabase
          .from('drivers')
          .insert({
            user_id: user.id,
            license_number: 'TEMP001',
            license_plate: 'TEMP001',
            vehicle_type: 'regular'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating driver:', createError);
          throw createError;
        }
        driverId = newDriver.id;
      } else if (driverError) {
        console.error('Error fetching driver:', driverError);
        throw driverError;
      }

      console.log('Using driver ID:', driverId);

      // تحديث الرحلة بمعرف السائق
      const { error } = await supabase
        .from('trips')
        .update({ 
          driver_id: driverId, 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) {
        console.error('Error accepting ride:', error);
        throw error;
      }

      // تحويل البيانات للصيغة المطلوبة للرحلة النشطة
      const activeRideData = {
        ...request,
        customerName: request.customer_name,
        customer_name: request.customer_name,
        from: request.from_location,
        from_location: request.from_location,
        to: request.to_location,
        to_location: request.to_location,
        from_coordinates: request.from_coordinates,
        to_coordinates: request.to_coordinates,
        driver_id: driverId,
        status: 'accepted'
      };

      console.log('Setting active ride data:', activeRideData);
      setActiveRide(activeRideData);
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
        description: "تعذر قبول الرحلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const rejectRide = (requestId: string) => {
    toast({
      title: "تم رفض الرحلة",
      description: "تم رفض طلب الرحلة",
      className: "bg-orange-50 border-orange-200 text-orange-800"
    });
  };

  const updateRideStatus = async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) return;

    try {
      const updateData: any = { status };
      
      if (status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (status === 'started') {
        updateData.started_at = new Date().toISOString();
        startTracking();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (trackingData) {
          updateData.actual_duration = Math.floor((Date.now() - trackingData.startTime) / 1000 / 60);
          updateData.distance_km = trackingData.totalDistance;
          updateData.price = trackingData.totalFare;
        }
        await stopTracking();
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

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-slate-900">
      {/* الخريطة - ملء الشاشة كاملة */}
      <Map
        className="absolute inset-0 w-full h-full z-0"
        markers={mapMarkers}
        route={mapRoute}
        center={currentLocation || [33.5138, 36.2765]}
        zoom={currentLocation ? 14 : 11}
        toast={toast}
      />

      {/* الواجهة العلوية - فوق الخريطة */}
      <div className="absolute inset-x-0 top-0 z-50">
        <DriverHeader 
          user={user}
          isOnline={isOnline}
          toggleOnlineStatus={toggleOnlineStatus}
          logout={logout}
        />
      </div>

      {/* عرض بيانات التتبع */}
      <RideTrackingDisplay trackingData={trackingData} />

      {/* بطاقة الرحلة النشطة */}
      {activeRide && (
        <div className="absolute top-24 right-4 z-40 max-w-sm">
          <ActiveRideCard 
            activeRide={activeRide}
            rideStatus={rideStatus}
            updateRideStatus={updateRideStatus}
          />
        </div>
      )}

      {/* رسائل الحالة */}
      <DriverPageMessages 
        activeRide={activeRide}
        isOnline={isOnline}
        rideRequestsCount={rideRequests.length}
        toggleOnlineStatus={toggleOnlineStatus}
      />

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
