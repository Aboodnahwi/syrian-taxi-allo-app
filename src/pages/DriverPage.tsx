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
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const { trackingData, startTracking, stopTracking, isTracking } = useEnhancedRideTracking(activeRide);
  const { rideRequests, loading: requestsLoading } = useRealTimeRideRequests(currentLocation);
  const { acceptRide, rejectRide, loading: acceptanceLoading } = useRideAcceptance();
  const { trips } = useRealTimeTrips('driver', driverProfile?.id);

  // التحقق من المستخدم وإعادة التوجيه
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'driver') {
        navigate('/auth');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('خطأ في تحليل بيانات المستخدم:', error);
      localStorage.removeItem('user');
      navigate('/auth');
    }
  }, [navigate]);

  // جلب ملف السائق
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!user?.id) return;

      try {
        console.log('جلب ملف السائق للمستخدم:', user.id);
        
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('خطأ في جلب ملف السائق:', error);
          toast({
            title: "خطأ في جلب البيانات",
            description: "تعذر جلب بيانات السائق",
            variant: "destructive"
          });
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
          toast({
            title: "تم إنشاء الملف الشخصي",
            description: "تم إنشاء ملف السائق بنجاح",
            className: "bg-green-50 border-green-200 text-green-800"
          });
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
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchDriverProfile();
    }
  }, [user, toast]);

  // الحصول على الموقع الحالي للسائق
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        console.log('طلب الموقع من المتصفح...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log('تم الحصول على موقع السائق:', lat, lng);
            setCurrentLocation([lat, lng]);
            setLocationPermissionDenied(false);
            
            // تحديث موقع السائق في قاعدة البيانات
            if (driverProfile?.id) {
              updateDriverLocation(lat, lng);
            }
          },
          (error) => {
            console.error('خطأ في الحصول على الموقع:', error);
            setLocationPermissionDenied(true);
            // استخدام موقع دمشق كافتراضي
            setCurrentLocation([33.5138, 36.2765]);
            toast({
              title: "تم استخدام موقع افتراضي",
              description: "تعذر الوصول لموقعك. تم استخدام موقع دمشق كافتراضي. يرجى السماح بالوصول للموقع لتحسين الخدمة.",
              className: "bg-yellow-50 border-yellow-200 text-yellow-800"
            });
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 300000 
          }
        );
      } else {
        console.log('الجهاز لا يدعم خدمات الموقع');
        setCurrentLocation([33.5138, 36.2765]);
        setLocationPermissionDenied(true);
        toast({
          title: "خدمة الموقع غير مدعومة",
          description: "جهازك لا يدعم خدمات الموقع",
          variant: "destructive"
        });
      }
    };

    getCurrentLocation();
  }, [driverProfile, toast]);

  // تحديث موقع السائق في قاعدة البيانات
  const updateDriverLocation = async (lat: number, lng: number) => {
    if (!driverProfile?.id) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          current_location: `(${lat},${lng})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverProfile.id);

      if (error) {
        console.error('خطأ في تحديث موقع السائق:', error);
      } else {
        console.log('تم تحديث موقع السائق بنجاح');
      }
    } catch (error) {
      console.error('خطأ في updateDriverLocation:', error);
    }
  };

  // مراقبة الرحلات النشطة
  useEffect(() => {
    if (!driverProfile?.id) return;
    
    const activeTrip = trips.find(trip => 
      trip.status === 'accepted' || trip.status === 'started' || trip.status === 'arrived'
    );
    
    if (activeTrip) {
      console.log('تعيين الرحلة النشطة من الرحلات:', activeTrip);
      
      const rideData = {
        ...activeTrip,
        customer_name: activeTrip.customer_name || activeTrip.profiles?.name || 'زبون',
        customer_phone: activeTrip.customer_phone || activeTrip.profiles?.phone || '',
        estimated_duration: activeTrip.estimated_duration || Math.ceil((activeTrip.distance_km || 5) * 1.5)
      };
      
      // التأكد من عدم إعادة تعيين نفس الرحلة
      if (!activeRide || activeRide.id !== activeTrip.id) {
        setActiveRide(rideData);
      }
      
      // تحديث الحالة بناءً على حالة الرحلة
      const newRideStatus = activeTrip.status === 'accepted' ? 'accepted' :
                          activeTrip.status === 'arrived' ? 'arrived' :
                          activeTrip.status === 'started' ? 'started' : null;
      
      if (rideStatus !== newRideStatus) {
        setRideStatus(newRideStatus);
      }
    } else if (!activeTrip && activeRide) {
      // إذا لم تعد هناك رحلة نشطة، امسح البيانات المحلية
      setActiveRide(null);
      setRideStatus(null);
    }
  }, [trips, driverProfile?.id, activeRide, rideStatus]);

  // إعداد علامات الخريطة والمسارات
  useEffect(() => {
    const markers = [];
    
    // موقع السائق
    if (currentLocation) {
      markers.push({
        id: 'driver',
        position: currentLocation,
        popup: `موقع السائق${locationPermissionDenied ? ' (موقع افتراضي)' : ''}`,
        icon: {
          html: `<div class="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white ${locationPermissionDenied ? '' : 'animate-pulse'}">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                     <path d="M8 18V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12l-4-2-4 2Z"></path>
                   </svg>
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: 'driver-marker'
        }
      });
    }
    
    // طلبات الرحلات المتاحة
    if (isOnline && !activeRide && !isTracking) {
      rideRequests.forEach((request) => {
        // نقطة البداية (موقع الزبون)
        if (request.from_coordinates) {
          markers.push({
            id: `request-pickup-${request.id}`,
            position: request.from_coordinates,
            popup: `<div class="font-tajawal p-2">
                      <div class="font-bold text-green-600 mb-1">نقطة البداية</div>
                      <div><strong>الزبون:</strong> ${request.customer_name}</div>
                      <div><strong>من:</strong> ${request.from_location}</div>
                      <div><strong>إلى:</strong> ${request.to_location}</div>
                      <div><strong>السعر:</strong> ${request.price.toLocaleString()} ل.س</div>
                    </div>`,
            icon: {
              html: `<div class="bg-green-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                         <circle cx="12" cy="10" r="3"></circle>
                       </svg>
                     </div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              className: 'pickup-marker'
            }
          });
        }

        // نقطة النهاية (وجهة الزبون)
        if (request.to_coordinates) {
          markers.push({
            id: `request-destination-${request.id}`,
            position: request.to_coordinates,
            popup: `<div class="font-tajawal p-2">
                      <div class="font-bold text-red-600 mb-1">الوجهة</div>
                      <div><strong>إلى:</strong> ${request.to_location}</div>
                      <div><strong>المسافة:</strong> ${request.distance_km.toFixed(1)} كم</div>
                    </div>`,
            icon: {
              html: `<div class="bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                         <circle cx="12" cy="10" r="3"></circle>
                       </svg>
                     </div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              className: 'destination-marker'
            }
          });
        }
      });
    }

    // الرحلة النشطة
    if (activeRide) {
      if (activeRide.from_coordinates) {
        markers.push({
          id: 'pickup',
          position: activeRide.from_coordinates,
          popup: `نقطة الانطلاق: ${activeRide.from_location}`,
          icon: {
            html: `<div class="bg-green-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                       <circle cx="12" cy="10" r="3"></circle>
                     </svg>
                   </div>`,
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
            html: `<div class="bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                       <circle cx="12" cy="10" r="3"></circle>
                     </svg>
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          }
        });
      }
    }
    
    setMapMarkers(markers);

    // إعداد المسارات
    if (isTracking && trackingData?.path) {
      // أثناء الرحلة - عرض المسار المسجل
      setMapRoute(trackingData.path.map(pos => [pos.lat, pos.lng]));
    } else if (activeRide && rideStatus === 'accepted') {
      // عند قبول الرحلة - عرض مسار السائق إلى نقطة البداية ثم إلى الوجهة
      if (currentLocation && activeRide.from_coordinates && activeRide.to_coordinates) {
        // مسار من السائق إلى البداية ثم إلى الوجهة
        setMapRoute([currentLocation, activeRide.from_coordinates, activeRide.to_coordinates]);
      } else if (activeRide.from_coordinates && activeRide.to_coordinates) {
        setMapRoute([activeRide.from_coordinates, activeRide.to_coordinates]);
      }
    } else if (activeRide && (rideStatus === 'arrived' || rideStatus === 'started')) {
      // عند الوصول أو بدء الرحلة - عرض مسار من نقطة البداية إلى الوجهة
      if (activeRide.from_coordinates && activeRide.to_coordinates) {
        setMapRoute([activeRide.from_coordinates, activeRide.to_coordinates]);
      }
    } else {
      setMapRoute(undefined);
    }
  }, [isOnline, rideRequests, currentLocation, activeRide, isTracking, trackingData, locationPermissionDenied]);

  const toggleOnlineStatus = () => {
    if (!currentLocation && !locationPermissionDenied) {
      toast({
        title: "موقعك غير محدد",
        description: "يرجى السماح بالوصول للموقع قبل تشغيل الخدمة",
        variant: "destructive"
      });
      return;
    }

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
      setIsOnline(false);
    }
    
    return result;
  };

  const updateRideStatus = async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) {
      toast({
        title: "خطأ",
        description: "لا توجد رحلة نشطة",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('تحديث حالة الرحلة إلى:', status, 'للرحلة:', activeRide.id);
      
      const updateData: any = { status };
      
      if (status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (status === 'started') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (trackingData) {
          updateData.actual_duration = Math.floor(trackingData.duration / 60);
          updateData.distance_km = trackingData.totalDistance;
          updateData.price = trackingData.totalFare;
        }
      }

      const { data: updatedTrip, error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', activeRide.id)
        .select('*')
        .single();

      if (error) {
        console.error('خطأ في تحديث قاعدة البيانات:', error);
        throw error;
      }

      console.log('تم تحديث الرحلة بنجاح:', updatedTrip);

      setRideStatus(status);
      setActiveRide(prev => ({ ...prev, ...updatedTrip }));

      if (status === 'started') {
        startTracking();
      } else if (status === 'completed') {
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
        setActiveRide(null);
        setRideStatus(null);
      }

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

    } catch (error: any) {
      console.error('خطأ في تحديث حالة الرحلة:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message || "تعذر تحديث حالة الرحلة. يرجى المحاولة مرة أخرى.",
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
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-lg font-cairo">جاري تحميل بيانات السائق...</p>
          <p className="text-sm text-slate-400 mt-2">جاري تحديد موقعك...</p>
        </div>
      </div>
    );
  }

  if (!user || !driverProfile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <p className="text-lg font-cairo mb-4">خطأ في جلب بيانات السائق</p>
          <p className="text-sm text-slate-400 mb-4">يرجى المحاولة مرة أخرى</p>
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              navigate('/auth');
            }}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-slate-900">
      <Map
        className="absolute inset-0 w-full h-full z-0"
        markers={mapMarkers}
        route={mapRoute}
        center={currentLocation || [33.5138, 36.2765]}
        zoom={currentLocation ? 14 : 11}
        toast={toast}
      />

      <div className="absolute inset-x-0 top-0 z-50">
        <DriverHeader 
          user={user}
          isOnline={isOnline}
          toggleOnlineStatus={toggleOnlineStatus}
          logout={logout}
        />
      </div>

      {trackingData && rideStatus === 'started' && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="pointer-events-auto">
            <LiveFareCounter
              currentFare={trackingData.totalFare}
              distance={trackingData.totalDistance}
              duration={trackingData.duration}
              speed={trackingData.currentSpeed}
              customerName={activeRide?.customer_name}
              isActive={true}
            />
          </div>
        </div>
      )}

      {trackingData && rideStatus !== 'started' && (
        <RealTimeTracker 
          distance={trackingData.totalDistance}
          duration={trackingData.duration}
          fare={trackingData.totalFare}
          speed={trackingData.currentSpeed}
          isTracking={trackingData.isTracking}
        />
      )}

      {activeRide && (
        <div className="absolute top-24 right-4 z-40 max-w-sm">
          <ActiveRideCard 
            activeRide={activeRide}
            rideStatus={rideStatus}
            updateRideStatus={updateRideStatus}
          />
        </div>
      )}

      <DriverPageMessages 
        activeRide={activeRide}
        isOnline={isOnline}
        rideRequestsCount={rideRequests.length}
        toggleOnlineStatus={toggleOnlineStatus}
      />

      {!activeRide && isOnline && (
        <RideRequestDrawer 
          rideRequests={rideRequests}
          acceptRide={handleAcceptRide}
          rejectRide={rejectRide}
          loading={requestsLoading || acceptanceLoading}
          driverLocation={currentLocation}
        />
      )}

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
