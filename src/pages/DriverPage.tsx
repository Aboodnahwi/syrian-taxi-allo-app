
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/map/Map';
import RideRequestList from '@/components/driver/RideRequestList';
import LiveFareCounter from '@/components/driver/LiveFareCounter';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRideAcceptance } from '@/hooks/driver/useRideAcceptance';

const DriverPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeColor, setRouteColor] = useState<string>('#007bff');
  const [currentFare, setCurrentFare] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);
  const [isFareCounterActive, setIsFareCounterActive] = useState(false);
  const [acceptedRideId, setAcceptedRideId] = useState<string | undefined>(undefined);

  const {
    location: geolocation,
    error: geolocationError,
  } = useGeolocation();

  const { acceptRide: acceptRideHook, completeRide, rejectRide } = useRideAcceptance();

  // Redirect if not authenticated or not a driver
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: location } });
      return;
    }

    if (user.role !== 'driver') {
      toast({
        title: "غير مسموح",
        description: "هذه الصفحة للسائقين فقط",
        variant: "destructive"
      });
      navigate('/', { replace: true });
      return;
    }
  }, [user, navigate, location, toast]);

  // Update user location
  useEffect(() => {
    if (geolocation) {
      setUserLocation([geolocation.latitude, geolocation.longitude]);
    } else if (geolocationError) {
      console.error("Geolocation error:", geolocationError);
      toast({
        title: "خطأ في تحديد الموقع",
        description: "الرجاء التأكد من تفعيل خدمات الموقع",
        variant: "destructive"
      });
    }
  }, [geolocation, geolocationError, toast]);

  // Fetch ride requests
  useEffect(() => {
    const fetchRideRequests = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          profiles (
            name,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching ride requests:", error);
        toast({
          title: "خطأ في جلب طلبات الرحلات",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setRideRequests(data || []);
      }
    };

    fetchRideRequests();
  }, [user, toast]);

  // Handle accepting a ride
  const handleAcceptRide = async (request: any): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    const result = await acceptRideHook(request, user.id, user.name);

    if (result.success && result.trip) {
      setActiveRide(result.trip);
      setAcceptedRideId(result.trip.id);
      setRideRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));
      setRideStatus('accepted');
      toast({
        title: "تم قبول الرحلة",
        description: `الرحلة إلى ${request.to_location} في انتظارك`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } else {
      toast({
        title: "فشل قبول الرحلة",
        description: "يبدو أن الرحلة قد تم قبولها من قبل سائق آخر",
        variant: "destructive"
      });
    }

    return result;
  };

  const handleRejectRide = async (requestId: string) => {
    await rejectRide(requestId);
    setRideRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
  };

  // Handle updating ride status
  const handleUpdateRideStatus = useCallback(async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) return;

    if (status === 'arrived') {
      setRideStatus('arrived');
      toast({
        title: "تم الوصول إلى الزبون",
        description: "الرجاء الانتظار حتى يصعد الزبون",
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
    } else if (status === 'started') {
      setRideStatus('started');
      setIsFareCounterActive(true);
      toast({
        title: "بدأت الرحلة",
        description: "سيتم احتساب الأجرة تلقائياً",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } else if (status === 'completed') {
      setIsFareCounterActive(false);
      setRideStatus('completed');

      const finalFare = Math.max(currentFare, 5000);

      const { success } = await completeRide(activeRide.id, finalFare);

      if (success) {
        setActiveRide(null);
        setRouteCoordinates([]);
        setCurrentFare(0);
        setDistance(0);
        setDuration(0);
        setSpeed(0);
        setRideRequests([]);
        setAcceptedRideId(undefined);
        toast({
          title: "تم إكمال الرحلة بنجاح",
          description: `تم تحصيل ${finalFare.toLocaleString()} ليرة سورية`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        toast({
          title: "خطأ في إكمال الرحلة",
          description: "حدث خطأ أثناء إكمال الرحلة",
          variant: "destructive"
        });
      }
    }
  }, [activeRide, currentFare, completeRide, toast]);

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg p-4 relative z-40">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white font-cairo">
            مرحباً أيها السائق {user?.name}
          </h1>
          <button
            onClick={signOut}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Map Container - في الخلف */}
      <div className="absolute top-0 left-0 w-full h-full z-10">
        <Map
          center={userLocation || [33.5138, 36.2765]}
          zoom={13}
          markers={[]}
          routeCoordinates={routeCoordinates}
          routeColor={routeColor}
          showUserLocation={true}
          className="w-full h-full"
        />
      </div>

      {/* Ride Requests List - في المقدمة */}
      {!activeRide && (
        <div className="relative z-30">
          <RideRequestList
            rideRequests={rideRequests}
            acceptRide={handleAcceptRide}
            rejectRide={handleRejectRide}
            acceptedRideId={acceptedRideId}
          />
        </div>
      )}

      {/* Live Fare Counter - في المقدمة */}
      {activeRide && isFareCounterActive && (
        <div className="relative z-30">
          <LiveFareCounter
            currentFare={currentFare}
            distance={distance}
            duration={duration}
            speed={speed}
            customerName={activeRide.profiles?.name}
            isActive={isFareCounterActive}
            activeRide={activeRide}
            rideStatus={rideStatus}
            onUpdateRideStatus={handleUpdateRideStatus}
          />
        </div>
      )}
    </div>
  );
};

export default DriverPage;
