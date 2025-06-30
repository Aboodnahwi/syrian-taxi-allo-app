import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/map/Map';
import DriverHeader from '@/components/driver/DriverHeader';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import RideRequestDrawer from '@/components/driver/RideRequestDrawer';
import RealTimeTracker from '@/components/driver/RealTimeTracker';
import RideCompletionSummary from '@/components/driver/RideCompletionSummary';
import DriverPageMessages from '@/components/driver/DriverPageMessages';
import { useEnhancedRideTracking } from '@/hooks/driver/useEnhancedRideTracking';
import { useRealTimeRideRequests } from '@/hooks/driver/useRealTimeRideRequests';
import { useRideAcceptance } from '@/hooks/driver/useRideAcceptance';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { supabase } from '@/integrations/supabase/client';
import LiveFareCounter from '@/components/driver/LiveFareCounter';

const DriverPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapRoute, setMapRoute] = useState<[number, number][] | undefined>();
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

  const { trackingData, startTracking, stopTracking, isTracking } = useEnhancedRideTracking(activeRide);
  const { rideRequests, loading: requestsLoading } = useRealTimeRideRequests(currentLocation);
  const { acceptRide, rejectRide, loading: acceptanceLoading } = useRideAcceptance();
  const { trips } = useRealTimeTrips('driver', driverProfile?.id);

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
    const fetchDriverProfile = async () => {
      if (!user?.id) return;

      try {
        console.log('جلب ملف السائق للمستخدم:', user.id);
        
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('خطأ في جلب ملف السائق:', error);
          return;
        }

        if (!driver) {
          console.log('لم يتم العثور على ملف السائق، إنشاء ملف جديد');
          const { data: newDriver, error: createError } = await supabase
            .from('drivers')
            .insert({
              user_id: user.id,
              license_number: `LIC-${Date.now()}`,
              license_plate: `PLT-${Date.now()}`,
              vehicle_type: 'regular',
              is_online: false,
              rating: 5.0,
              total_trips: 0
            })
            .select()
            .single();

          if (createError) {
            console.error('خطأ في إنشاء ملف السائق:', createError);
            toast({
              title: "خطأ في إنشاء الملف الشخصي",
              description: "تعذر إنشاء ملف السائق. يرجى المحاولة مرة أخرى.",
              variant: "destructive"
            });
            return;
          }
          console.log('تم إنشاء ملف السائق الجديد:', newDriver);
          setDriverProfile(newDriver);
        } else {
          console.log('تم العثور على ملف السائق:', driver);
          setDriverProfile(driver);
        }
      } catch (error) {
        console.error('خطأ في fetchDriverProfile:', error);
        toast({
          title: "خطأ في جلب البيانات",
          description: "تعذر جلب بيانات السائق",
          variant: "destructive"
        });
      }
    };

    fetchDriverProfile();
  }, [user, toast]);

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
    if (!driverProfile?.id) return;
    
    const activeTrip = trips.find(trip => 
      trip.status === 'accepted' || trip.status === 'started' || trip.status === 'arrived'
    );
    
    if (activeTrip && !activeRide) {
      console.log('تعيين الرحلة النشطة من الرحلات:', activeTrip);
      
      // تحضير بيانات الرحلة بشكل صحيح مع استخدام البيانات من profiles
      const rideData = {
        ...activeTrip,
        customer_name: activeTrip.customer_name || activeTrip.profiles?.name || 'زبون',
        customer_phone: activeTrip.customer_phone || activeTrip.profiles?.phone || '',
        estimated_duration: activeTrip.estimated_duration || Math.ceil((activeTrip.distance_km || 5) * 1.5)
      };
      
      setActiveRide(rideData);
      if (activeTrip.status === 'accepted') setRideStatus('accepted');
      else if (activeTrip.status === 'arrived') setRideStatus('arrived');
      else if (activeTrip.status === 'started') setRideStatus('started');
    }
  }, [trips, driverProfile?.id, activeRide]);

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

  const handleAcceptRide = async (request: any) => {
    if (!driverProfile?.id || !user?.name) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على بيانات السائق",
        variant: "destructive"
      });
      return { success: false };
    }

    console.log('قبول طلب الرحلة:', request);
    const result = await acceptRide(request, driverProfile.id, user.name);
    
    if (result.success && result.trip) {
      console.log('تم قبول الرحلة بنجاح، تحديث الحالة المحلية');
      setActiveRide(result.trip);
      setRideStatus('accepted');
    }
    
    return result;
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
          updateData.actual_duration = Math.floor(trackingData.duration / 60);
          updateData.distance_km = trackingData.totalDistance;
          updateData.price = trackingData.totalFare;
        }
        const finalData = await stopTracking();
        if (finalData) {
          setCompletionData({
            ...finalData,
            customerName: activeRide.customer_name || activeRide.customerName,
            fromLocation: activeRide.from_location || activeRide.from,
            toLocation: activeRide.to_location || activeRide.to
          });
          setShowCompletionSummary(true);
        }
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', activeRide.id);

      if (error) throw error;

      setRideStatus(status);

      const statusMessages = {
        arrived: "تم الإعلان عن الوصول للزبون",
        started: "تم بدء الرحلة وتفعيل التتبع",
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
      console.error('خطأ في تحديث حالة الرحلة:', error);
      toast({
        title: "خطأ",
        description: "تعذر تحديث حالة الرحلة",
        variant: "destructive"
      });
    }
  };

  const handleCompletionClose = () => {
    setShowCompletionSummary(false);
    setCompletionData(null);
  };

  const handleNewRide = () => {
    setShowCompletionSummary(false);
    setCompletionData(null);
    setIsOnline(true);
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

      {/* عداد الأجرة الكبير */}
      {trackingData && rideStatus === 'started' && (
        <LiveFareCounter
          currentFare={trackingData.totalFare}
          distance={trackingData.totalDistance}
          duration={trackingData.duration}
          speed={trackingData.currentSpeed}
          customerName={activeRide?.customer_name}
          isActive={trackingData.isTracking}
        />
      )}

      {/* عرض بيانات التتبع في الوقت الفعلي */}
      {trackingData && rideStatus !== 'started' && (
        <RealTimeTracker 
          distance={trackingData.totalDistance}
          duration={trackingData.duration}
          fare={trackingData.totalFare}
          speed={trackingData.currentSpeed}
          isTracking={trackingData.isTracking}
        />
      )}

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
          acceptRide={handleAcceptRide}
          rejectRide={rejectRide}
          loading={requestsLoading || acceptanceLoading}
        />
      )}

      {/* ملخص إنهاء الرحلة */}
      {showCompletionSummary && completionData && (
        <RideCompletionSummary 
          rideData={completionData}
          onClose={handleCompletionClose}
          onNewRide={handleNewRide}
        />
      )}
    </div>
  );
};

export default DriverPage;
