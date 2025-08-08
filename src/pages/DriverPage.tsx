import React, { useState, useEffect } from 'react';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import RideRequestList from '@/components/driver/RideRequestList';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import DriverHeader from '@/components/driver/DriverHeader';
import RealTimeTracker from '@/components/driver/RealTimeTracker';
import DriverPageMessages from '@/components/driver/DriverPageMessages';

interface Trip {
  id: string;
  customer_id: string;
  driver_id?: string;
  from_location: string;
  to_location: string;
  from_coordinates?: [number, number];
  to_coordinates?: [number, number];
  vehicle_type: string;
  distance_km?: number;
  price: number;
  status: string;
  scheduled_time?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  customer_rating?: number;
  driver_rating?: number;
  customer_comment?: string;
  driver_comment?: string;
  cancellation_reason?: string;
  estimated_duration?: number;
  actual_duration?: number;
  customer_name?: string;
  customer_phone?: string;
  profiles?: {
    name: string;
    phone: string;
  };
}

const DriverPage = () => {
  const { user, session, isLoading: isUserLoading } = useUser();
  const { trips, loading } = useRealTimeTrips('driver', user?.id);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [activeRide, setActiveRide] = useState<Trip | null>(null);
  const [rideRequests, setRideRequests] = useState<Trip[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !session) return;

    const fetchDriverData = async () => {
      try {
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching driver data:', error);
          return;
        }

        setIsOnline(driver?.is_online || false);
      } catch (error) {
        console.error('Error fetching driver data:', error);
      }
    };

    fetchDriverData();
  }, [user, session]);

  useEffect(() => {
    if (!trips) return;

    // Filter active ride
    const active = trips.find(trip => 
      trip.status === 'accepted' || trip.status === 'started' || trip.status === 'arrived'
    );
    setActiveRide(active || null);

    // Filter ride requests
    const requests = trips.filter(trip => trip.status === 'pending');
    setRideRequests(requests);

    // Calculate total earnings and today trips
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    const total = completedTrips.reduce((sum, trip) => sum + trip.price, 0);
    setTotalEarnings(total);

    const today = new Date();
    const todayCompletedTrips = completedTrips.filter(trip => {
      const tripDate = new Date(trip.completed_at || trip.created_at);
      return tripDate.toDateString() === today.toDateString();
    });
    setTodayTrips(todayCompletedTrips.length);
  }, [trips]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "فشل في تحديد الموقع",
            description: "الرجاء التأكد من تفعيل خدمات الموقع",
            variant: "destructive"
          });
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      toast({
        title: "الموقع غير مدعوم",
        description: "هذا المتصفح لا يدعم خدمات الموقع",
        variant: "destructive"
      });
    }
  }, [toast]);

  const toggleOnlineStatus = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_online: !isOnline })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setIsOnline(!isOnline);
    } catch (error) {
      console.error('Error updating online status:', error);
      toast({
        title: "فشل تغيير الحالة",
        description: "حدث خطأ أثناء تغيير حالة الاتصال",
        variant: "destructive"
      });
    }
  };

  const acceptRide = async (tripId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'accepted',
          driver_id: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', tripId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم قبول الرحلة",
        description: "الرحلة في انتظارك",
        
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "فشل قبول الرحلة",
        description: "حدث خطأ أثناء قبول الرحلة",
        variant: "destructive"
      });
    }
  };

  const handleLocationUpdate = (location: [number, number]) => {
    setCurrentLocation(location);
  };

  const handleUpdateRideStatus = async (status: string) => {
    if (!activeRide) return;

    try {
      let updateData: any = { status };

      if (status === 'started') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', activeRide.id);

      if (error) {
        throw error;
      }

      toast({
        title: "تم تحديث حالة الرحلة",
        description: `تم تحديث حالة الرحلة إلى ${status}`,
        
      });
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: "فشل تحديث حالة الرحلة",
        description: "حدث خطأ أثناء تحديث حالة الرحلة",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ل.س`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <DriverHeader
          isOnline={isOnline}
          onToggleOnline={toggleOnlineStatus}
          totalEarnings={totalEarnings}
          todayTrips={todayTrips}
        />

        {/* Real-time Tracker */}
        <RealTimeTracker
          isOnline={isOnline}
          activeRide={activeRide}
          onLocationUpdate={handleLocationUpdate}
        />

        {/* Active Ride Display */}
        {activeRide && (
          <ActiveRideCard
            activeRide={activeRide}
            onUpdateStatus={handleUpdateRideStatus}
            currentLocation={currentLocation}
            onNavigate={() => {}}
            onContact={() => {}}
            onMessage={() => {}}
          />
        )}

        {/* Live Fare Counter for accepted rides */}
        {activeRide && activeRide.status === 'accepted' && (
          <Card className="bg-white/90 backdrop-blur-sm border-emerald-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-4">
                  <Car className="w-6 h-6" />
                  <h3 className="text-xl font-bold">في الطريق إلى العميل</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(activeRide.price)}
                    </p>
                    <p className="text-sm text-gray-600">قيمة الرحلة</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {activeRide.distance_km?.toFixed(1) || 0} كم
                    </p>
                    <p className="text-sm text-gray-600">المسافة</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleUpdateRideStatus('arrived')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  وصلت إلى موقع العميل
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Fare Counter for started rides */}
        {activeRide && activeRide.status === 'started' && (
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                  <Car className="w-6 h-6" />
                  <h3 className="text-xl font-bold">الرحلة جارية</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(activeRide.price)}
                    </p>
                    <p className="text-xs text-gray-600">الأجرة</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {activeRide.distance_km?.toFixed(1) || 0} كم
                    </p>
                    <p className="text-xs text-gray-600">المسافة</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {Math.floor((Date.now() - new Date(activeRide.started_at || activeRide.accepted_at).getTime()) / 60000)} د
                    </p>
                    <p className="text-xs text-gray-600">المدة</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleUpdateRideStatus('completed')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  إنهاء الرحلة
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ride Requests */}
        {isOnline && !activeRide && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 text-center">
              طلبات الرحلات المتاحة
            </h2>
            
            <RideRequestList
              rideRequests={rideRequests}
              onAcceptRide={acceptRide}
              loading={loading}
            />
          </div>
        )}

        {/* Messages and Notifications */}
        <DriverPageMessages />

        {/* Offline Message */}
        {!isOnline && !activeRide && (
          <Card className="bg-gray-100/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Car className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">
                  أنت غير متصل حالياً
                </h3>
                <p className="text-gray-600">
                  قم بتفعيل الحالة المتصلة لاستقبال طلبات الرحلات
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverPage;
