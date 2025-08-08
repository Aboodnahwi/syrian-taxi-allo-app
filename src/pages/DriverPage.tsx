
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Car } from 'lucide-react';
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
  from_coordinates: [number, number];
  to_coordinates: [number, number];
  vehicle_type: string;
  price: number;
  distance_km: number;
  status: RideStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
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
  const [activeRide, setActiveRide] = useState<any>(null);
  const [completedRide, setCompletedRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);
  
  const { rideRequests } = useRealTimeRideRequests(currentLocation);
  const { acceptRide, rejectRide } = useRideAcceptance();

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

        // Parse location coordinates safely
        let parsedLocation: [number, number] | null = null;
        if (driverData.current_location) {
          try {
            const locationStr = String(driverData.current_location);
            const cleanLocationStr = locationStr.replace(/[()]/g, '');
            const coordinates = cleanLocationStr.split(',');
            if (coordinates.length === 2) {
              const lat = parseFloat(coordinates[0].trim());
              const lng = parseFloat(coordinates[1].trim());
              if (!isNaN(lat) && !isNaN(lng)) {
                parsedLocation = [lat, lng];
              }
            }
          } catch (e) {
            console.error('Error parsing location:', e);
          }
        }

        // Map the database data to our Driver interface
        const mappedDriver: Driver = {
          id: driverData.id,
          user_id: driverData.user_id,
          name: user.name || 'سائق',
          phone: user.phone || '',
          is_online: driverData.is_online || false,
          is_active: true,
          is_available: driverData.is_online || false,
          current_location: parsedLocation,
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
        
        if (parsedLocation) {
          setCurrentLocation(parsedLocation);
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

  const updateLocation = async (lat: number, lng: number, address: string) => {
    if (!driver) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          current_location: `(${lat},${lng})`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', driver.user_id);

      if (error) throw error;
      
      setCurrentLocation([lat, lng]);
      setDriver(prev => prev ? { ...prev, current_location: [lat, lng] } : null);
    } catch (error: any) {
      console.error('خطأ في تحديث الموقع:', error);
    }
  };

  const updateRideStatus = async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) return;

    try {
      const { error } = await supabase
        .from('trips')
        .update({
          status: status,
          ...(status === 'started' && { started_at: new Date().toISOString() }),
          ...(status === 'completed' && { 
            completed_at: new Date().toISOString(),
            status: 'completed'
          })
        })
        .eq('id', activeRide.id);

      if (error) throw error;

      setRideStatus(status);

      if (status === 'completed') {
        setCompletedRide(activeRide);
        setActiveRide(null);
        setRideStatus(null);
      }

      toast({
        title: "تم تحديث حالة الرحلة",
        description: status === 'arrived' ? 'تم تأكيد الوصول للزبون' : 
                    status === 'started' ? 'تم بدء الرحلة' : 
                    'تم إنهاء الرحلة بنجاح'
      });
    } catch (error: any) {
      console.error('خطأ في تحديث حالة الرحلة:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAcceptRide = async (request: RideRequest): Promise<{ success: boolean }> => {
    if (!driver) return { success: false };

    const result = await acceptRide(request, driver.id, driver.name);
    if (result.success && result.trip) {
      setActiveRide(result.trip);
      setRideStatus('accepted');
      return { success: true };
    }
    return { success: false };
  };

  const handleRejectRide = async (requestId: string): Promise<void> => {
    await rejectRide(requestId);
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
      <DriverHeader 
        user={user}
        isOnline={driver.is_online}
        toggleOnlineStatus={() => toggleOnlineStatus(!driver.is_online)}
        logout={() => navigate('/auth')}
      />
      
      <div className="container mx-auto p-4 space-y-6 pt-20">
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
                activeRide={activeRide}
                rideStatus={rideStatus}
                updateRideStatus={updateRideStatus}
              />
            )}
          </div>

          <div className="space-y-6">
            <DriverStatusBadge 
              isOnline={driver.is_online}
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

            <DriverPageMessages 
              activeRide={activeRide}
              isOnline={driver.is_online}
              rideRequestsCount={rideRequests.length}
              toggleOnlineStatus={() => toggleOnlineStatus(!driver.is_online)}
            />
          </div>
        </div>

        {completedRide && (
          <RideCompletionSummary 
            completedRide={completedRide}
            onClose={() => window.location.reload()}
          />
        )}
      </div>

      {rideRequests.length > 0 && (
        <RideRequestList
          rideRequests={rideRequests}
          acceptRide={handleAcceptRide}
          rejectRide={handleRejectRide}
        />
      )}
    </div>
  );
};

export default DriverPage;
