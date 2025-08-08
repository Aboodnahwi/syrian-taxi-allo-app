
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, Car, Clock, DollarSign, Star, Navigation, Phone, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/map/Map';
import RideRequestList from '@/components/driver/RideRequestList';
import ActiveRideCard from '@/components/driver/ActiveRideCard';
import RideCompletionSummary from '@/components/driver/RideCompletionSummary';
import DriverHeader from '@/components/driver/DriverHeader';
import DriverStatusBadge from '@/components/driver/DriverStatusBadge';
import DriverPageMessages from '@/components/driver/DriverPageMessages';
import { useRealTimeRideRequests } from '@/hooks/driver/useRealTimeRideRequests';
import { useRideAcceptance } from '@/hooks/driver/useRideAcceptance';
import { useActiveRideTracking } from '@/hooks/driver/useActiveRideTracking';

interface Driver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_online: boolean;
  is_active: boolean;
  is_available: boolean;
  current_location: [number, number] | null;
  rating: number;
  total_trips: number;
  license_plate: string;
  vehicle_type: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate: string;
  license_number: string;
  created_at: string;
  updated_at: string;
}

type RideStatus = 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';

interface RideRequest {
  id: string;
  customer_id: string;
  driver_id?: string;
  from_location: string;
  to_location: string;
  from_coordinates: string;
  to_coordinates: string;
  vehicle_type: string;
  price: number;
  distance_km: number;
  status: RideStatus;
  created_at: string;
  customer?: {
    name: string;
    phone: string;
  };
}

const DriverPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapRef = useRef<any>();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([33.5138, 36.2765]);
  
  const { 
    rideRequests, 
    activeRide, 
    completedRide 
  } = useRealTimeRideRequests(driver?.user_id || '');
  
  const { acceptRide, rejectRide } = useRideAcceptance(driver?.user_id || '');
  const { updateRideStatus } = useActiveRideTracking();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (user.role !== 'driver') {
      toast({
        title: "غير مسموح",
        description: "ليس لديك صلاحية للوصول لهذه الصفحة",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        const { data: driverData, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Map the database data to our Driver interface
        const mappedDriver: Driver = {
          id: driverData.id,
          user_id: driverData.user_id,
          name: user.name || 'سائق',
          phone: user.phone || '',
          is_online: driverData.is_online || false,
          is_active: true,
          is_available: driverData.is_online || false,
          current_location: driverData.current_location ? 
            [parseFloat(driverData.current_location.split(',')[0]), parseFloat(driverData.current_location.split(',')[1])] : 
            null,
          rating: driverData.rating || 5.0,
          total_trips: driverData.total_trips || 0,
          license_plate: driverData.license_plate || '',
          vehicle_type: driverData.vehicle_type || '',
          vehicle_model: driverData.vehicle_model || '',
          vehicle_color: driverData.vehicle_color || '',
          vehicle_plate: driverData.license_plate || '',
          license_number: driverData.license_number || '',
          created_at: driverData.created_at,
          updated_at: driverData.updated_at
        };

        setDriver(mappedDriver);
        
        if (mappedDriver.current_location) {
          setCurrentLocation(mappedDriver.current_location);
        }
      } catch (error: any) {
        console.error('خطأ في جلب بيانات السائق:', error);
        toast({
          title: "خطأ في جلب البيانات",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [user, toast]);

  const toggleOnlineStatus = async (online: boolean) => {
    if (!driver) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_online: online,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', driver.user_id);

      if (error) throw error;

      setDriver(prev => prev ? { ...prev, is_online: online, is_available: online } : null);
      
      toast({
        title: online ? "أصبحت متاحاً" : "أصبحت غير متاح",
        description: online ? "يمكن للعملاء الآن رؤيتك وطلب رحلات" : "لن يتمكن العملاء من رؤيتك",
      });
    } catch (error: any) {
      console.error('خطأ في تحديث الحالة:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateLocation = async (newLocation: [number, number]) => {
    if (!driver) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          current_location: `(${newLocation[0]},${newLocation[1]})`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', driver.user_id);

      if (error) throw error;
      
      setCurrentLocation(newLocation);
      setDriver(prev => prev ? { ...prev, current_location: newLocation } : null);
    } catch (error: any) {
      console.error('خطأ في تحديث الموقع:', error);
    }
  };

  if (!user || user.role !== 'driver') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="font-cairo">جاري التحقق من بيانات السائق...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Car className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4 font-cairo">مرحباً بك كسائق!</h2>
            <p className="text-slate-300 mb-6 font-tajawal">يبدو أنك لم تكمل ملفك الشخصي كسائق بعد.</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              العودة لإكمال التسجيل
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      <DriverHeader driver={driver} onToggleOnline={toggleOnlineStatus} />
      
      <div className="container mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  خريطة الرحلات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px]">
                  <Map
                    ref={mapRef}
                    center={currentLocation}
                    zoom={13}
                    markers={[
                      {
                        id: 'driver',
                        position: currentLocation,
                        popup: 'موقعك الحالي',
                        icon: {
                          html: '<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">🚗</div>',
                          className: 'driver-marker',
                          iconSize: [24, 24] as [number, number],
                          iconAnchor: [12, 12] as [number, number]
                        }
                      }
                    ]}
                    onLocationSelect={updateLocation}
                    className="w-full h-full rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {activeRide && (
              <ActiveRideCard 
                ride={activeRide}
                driverLocation={currentLocation}
                onUpdateStatus={updateRideStatus}
              />
            )}
          </div>

          <div className="space-y-6">
            <DriverStatusBadge 
              isOnline={driver.is_online}
              rating={driver.rating}
              totalTrips={driver.total_trips}
            />

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-cairo text-white">معلومات المركبة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">نوع المركبة:</span>
                  <span className="text-white font-medium">{driver.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم اللوحة:</span>
                  <span className="text-white font-medium">{driver.license_plate}</span>
                </div>
                {driver.vehicle_model && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">الموديل:</span>
                    <span className="text-white font-medium">{driver.vehicle_model}</span>
                  </div>
                )}
                {driver.vehicle_color && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">اللون:</span>
                    <span className="text-white font-medium">{driver.vehicle_color}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <DriverPageMessages userId={driver.user_id} />
          </div>
        </div>

        {completedRide && (
          <RideCompletionSummary 
            ride={completedRide}
            onClose={() => window.location.reload()}
          />
        )}
      </div>

      {rideRequests.length > 0 && (
        <RideRequestList
          rideRequests={rideRequests}
          acceptRide={acceptRide}
          rejectRide={rejectRide}
        />
      )}
    </div>
  );
};

export default DriverPage;
