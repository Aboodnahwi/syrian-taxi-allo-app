
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import DriverHeader from '@/components/driver/DriverHeader';
import RideRequestList from '@/components/driver/RideRequestList';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import RideCompletionSummary from '@/components/driver/RideCompletionSummary';
import DriverPageMessages from '@/components/driver/DriverPageMessages';
import RealTimeTracker from '@/components/driver/RealTimeTracker';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Navigation, 
  User, 
  Star,
  Phone,
  MessageSquare,
  CheckCircle
} from 'lucide-react';

interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  governorate: string;
  avatar_url: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

interface DriverData {
  id: string;
  user_id: string;
  license_number: string;
  license_plate: string;
  vehicle_type: string;
  vehicle_color: string | null;
  vehicle_model: string | null;
  is_online: boolean | null;
  current_location: any | null;
  rating: number | null;
  total_trips: number | null;
  created_at: string;
  updated_at: string;
}

interface RideRequest {
  id: string;
  customer_id: string;
  from_location: string;
  to_location: string;
  from_coordinates: any;
  to_coordinates: any;
  vehicle_type: string;
  distance_km: number;
  price: number;
  status: string;
  created_at: string;
}

interface DriverStats {
  totalEarnings: number;
  todayEarnings: number;
  todayTrips: number;
}

const DriverPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    todayTrips: 0,
  });

  const [activeRide, setActiveRide] = useState<any>(null);
  const [completedRide, setCompletedRide] = useState<any>(null);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDriverData();
      subscribeToRideRequests();
      getCurrentLocation();
    }
  }, [user]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);

      // Fetch Driver Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;
      setDriverProfile(profile);

      // Fetch Driver Data
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (driverError) throw driverError;
      setDriverData(driver);

      // Fetch Driver Stats
      const { data: stats, error: statsError } = await supabase
        .from('trips')
        .select(`
          id,
          price
        `)
        .eq('driver_id', driver.id)
        .eq('status', 'completed');

      if (statsError) throw statsError;

      const totalCount = stats?.length || 0;
      const totalSum = stats?.reduce((acc, trip) => acc + (trip.price || 0), 0) || 0;

      setDriverStats({
        totalEarnings: totalSum,
        todayEarnings: 5000, // Replace with actual today earnings
        todayTrips: 5, // Replace with actual today trips
      });

      // Fetch Active Ride
       const { data: activeRideData, error: activeRideError } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driver.id)
        .not('status', 'in', ['completed', 'cancelled'])
        .single();

      if (activeRideError && activeRideError.code !== 'PGRST116') {
        console.error('Error fetching active ride:', activeRideError);
      }

      if (activeRideData) {
        setActiveRide(activeRideData);
      }

    } catch (error: any) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch driver data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRideRequests = () => {
    supabase
      .channel('ride_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: 'status=eq.pending' },
        (payload) => {
          if (payload.new) {
            setRideRequests((prevRequests) => [...prevRequests, payload.new as RideRequest]);
          }
        }
      )
      .subscribe();
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Error getting current location:', error);
          toast({
            title: "Location Error",
            description: "Failed to get current location",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
    }
  };

  const handleLocationUpdate = async (location: any) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ current_location: location })
        .eq('id', driverData?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driverData) return;

    try {
      const newStatus = !driverData.is_online;
      const { error } = await supabase
        .from('drivers')
        .update({ is_online: newStatus })
        .eq('id', driverData.id);

      if (error) throw error;

      setDriverData({ ...driverData, is_online: newStatus });
      toast({
        title: "Status Updated",
        description: `Your status is now ${newStatus ? 'Online' : 'Offline'}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error toggling online status:', error);
      toast({
        title: "Status Update Failed",
        description: "Failed to update online status",
        variant: "destructive"
      });
    }
  };

  const updateDriverStatus = async (status: string) => {
    if (!driverData) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_online: status === 'online' })
        .eq('id', driverData.id);

      if (error) throw error;

      setDriverData({ ...driverData, is_online: status === 'online' });
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  const acceptRide = async (ride: RideRequest) => {
    if (!driverData) return;

    try {
      setRequestsLoading(true);
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'accepted',
          driver_id: driverData.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', ride.id);

      if (error) throw error;

      setRideRequests((prevRequests) => prevRequests.filter((req) => req.id !== ride.id));
      setActiveRide(ride);
      await updateDriverStatus('offline');

      toast({
        title: "Ride Accepted",
        description: `You have accepted ride to ${ride.to_location}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Accept Ride Failed",
        description: "Failed to accept ride",
        variant: "destructive"
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const rejectRide = async (requestId: string) => {
    setRideRequests((prevRequests) => prevRequests.filter((req) => req.id !== requestId));
  };

  const updateRideStatus = async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) return;

    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'arrived') {
        updates.arrived_at = new Date().toISOString();
      } else if (status === 'started') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        
        // Create ride completion data
        const rideCompletionData = {
          totalDistance: activeRide.distance_km || 0,
          totalFare: activeRide.price || 0,
          duration: 1800, // 30 minutes default
          customerName: 'زبون',
          fromLocation: activeRide.from_location,
          toLocation: activeRide.to_location,
          averageSpeed: 30
        };
        
        setCompletedRide(rideCompletionData);
        setShowCompletionSummary(true);
        setActiveRide(null);
        await updateDriverStatus('online');
      }

      const { error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', activeRide.id);

      if (error) throw error;

      if (status !== 'completed') {
        setActiveRide({ ...activeRide, ...updates });
      }

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث حالة الرحلة إلى ${getStatusText(status)}`,
        variant: "default"
      });

    } catch (error) {
      console.error('خطأ في تحديث حالة الرحلة:', error);
      toast({
        title: "خطأ في التحديث",
        description: "تعذر تحديث حالة الرحلة",
        variant: "destructive"
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'arrived': return 'وصلت';
      case 'started': return 'بدأت';
      case 'completed': return 'مكتملة';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ل.س`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل بيانات السائق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DriverHeader 
        name={driverProfile?.name || 'السائق'}
        isOnline={driverData?.is_online || false}
        onToggleOnline={toggleOnlineStatus}
        totalEarnings={driverStats.totalEarnings}
        todayTrips={driverStats.todayTrips}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الجانب الأيمن - الخريطة والمعلومات */}
          <div className="lg:col-span-2 space-y-6">
            {/* RealTimeTracker يتضمن خريطة تفاعلية */}
            <RealTimeTracker 
              userId={driverData?.id || ''}
              isOnline={driverData?.is_online || false}
              activeRide={activeRide}
              onLocationUpdate={handleLocationUpdate}
            />

            {/* معلومات الرحلة النشطة أو إحصائيات السائق */}
            {activeRide ? (
              <ActiveRideCard
                rideData={activeRide}
                onUpdateStatus={updateRideStatus}
                currentLocation={currentLocation}
                onNavigate={() => {/* منطق التنقل */}}
                onContact={() => {/* منطق الاتصال */}}
                onMessage={() => {/* منطق المراسلة */}}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-slate-600">أرباح اليوم</p>
                        <p className="text-2xl font-bold text-green-600">
                          {driverStats.todayEarnings.toLocaleString()} ل.س
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-slate-600">التقييم</p>
                        <p className="text-2xl font-bold text-slate-800">
                          {driverData?.rating?.toFixed(1) || '5.0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Live Fare Counter during active rides */}
            {activeRide && activeRide.status === 'accepted' && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">في انتظار وصولك للزبون</span>
                  </div>
                  <Badge variant="secondary">متجه للزبون</Badge>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">الأجرة</p>
                    <p className="font-bold text-green-600">{activeRide.price?.toLocaleString()} ل.س</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المسافة</p>
                    <p className="font-bold">{activeRide.distance_km || 0} كم</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المدة</p>
                    <p className="font-bold">-- دقيقة</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">السرعة</p>
                    <p className="font-bold">-- كم/س</p>
                  </div>
                </div>
              </div>
            )}

            {activeRide && activeRide.status === 'started' && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">الرحلة جارية</span>
                  </div>
                  <Badge className="bg-green-500">نشطة</Badge>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">الأجرة</p>
                    <p className="font-bold text-green-600">{activeRide.price?.toLocaleString()} ل.س</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المسافة</p>
                    <p className="font-bold">{activeRide.distance_km || 0} كم</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المدة</p>
                    <p className="font-bold">-- دقيقة</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">السرعة</p>
                    <p className="font-bold">-- كم/س</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* الجانب الأيسر - طلبات الرحلات والرسائل */}
          <div className="space-y-6">
            <RideRequestList 
              rideRequests={rideRequests}
              acceptRide={acceptRide}
              rejectRide={rejectRide}
            />
            
            <DriverPageMessages 
              activeRide={activeRide}
              isOnline={driverData?.is_online || false}
              rideRequestsCount={rideRequests.length}
              toggleOnlineStatus={toggleOnlineStatus}
            />
          </div>
        </div>
      </div>

      {/* نافذة ملخص الرحلة المكتملة */}
      {showCompletionSummary && completedRide && (
        <RideCompletionSummary
          rideData={completedRide}
          onClose={() => {
            setShowCompletionSummary(false);
            setCompletedRide(null);
          }}
          onNewRide={() => {
            setShowCompletionSummary(false);
            setCompletedRide(null);
          }}
        />
      )}
    </div>
  );
};

export default DriverPage;
