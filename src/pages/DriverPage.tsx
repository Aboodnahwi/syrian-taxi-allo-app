import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Car, Users, MapPin, Clock, Settings, DollarSign, Calculator, BarChart3, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/map/Map';
import LiveFareCounter from '@/components/driver/LiveFareCounter';

interface RideRequest {
  id: string;
  created_at: string;
  from_location: string;
  to_location: string;
  customer_id: string;
  driver_id: string | null;
  price: number | null;
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';
  distance_km: number;
  customer?: {
    name: string;
    phone: string;
  };
}

interface Driver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_active: boolean;
  is_available: boolean;
  license_number: string;
  vehicle_type: string;
  vehicle_plate: string;
}

const DriverPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [driverData, setDriverData] = useState<Driver | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed' | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trackingStartTime, setTrackingStartTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchDriverData();
    fetchRideRequests();
  }, [user, navigate, toast]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);

      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setDriverData(driver);
      setIsOnline(driver?.is_available || false);
    } catch (error: any) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "خطأ في تحميل بيانات السائق",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRideRequests = async () => {
    try {
      setLoading(true);

      const { data: requests, error } = await supabase
        .from('trips')
        .select(`
          *,
          customer:profiles!trips_customer_id_fkey(name, phone)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRideRequests(requests || []);
    } catch (error: any) {
      console.error('Error fetching ride requests:', error);
      toast({
        title: "خطأ في تحميل طلبات الرحلات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnlineStatus = async () => {
    if (!driverData) return;

    try {
      setLoading(true);
      const newStatus = !isOnline;

      const { error } = await supabase
        .from('drivers')
        .update({ is_available: newStatus })
        .eq('id', driverData.id);

      if (error) throw error;

      setIsOnline(newStatus);
      setDriverData({ ...driverData, is_available: newStatus });

      toast({
        title: "تم تحديث الحالة",
        description: `تم تغيير حالتك إلى ${newStatus ? 'متاح' : 'غير متاح'}`,
      });
    } catch (error: any) {
      console.error('Error updating online status:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      setTrackingStartTime(new Date()); // تسجيل وقت بدء التتبع
      
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'accepted', 
          driver_id: driverData?.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', rideId);

      if (error) throw error;

      setActiveRide(rideRequests.find(r => r.id === rideId) || null);
      setRideStatus('accepted');
      
      toast({
        title: "تم قبول الطلب",
        description: "تم قبول طلب الرحلة بنجاح"
      });
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      toast({
        title: "خطأ في قبول الطلب",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateRideStatus = async (status: 'arrived' | 'started' | 'completed') => {
    if (!activeRide) return;

    try {
      const updateData: any = { status };
      
      if (status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (status === 'started') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', activeRide.id);

      if (error) throw error;

      setRideStatus(status);
      
      if (status === 'completed') {
        setActiveRide(null);
        setRideStatus(null);
        // إعادة تعيين السائق كمتاح
        await supabase
          .from('drivers')
          .update({ is_online: true })
          .eq('user_id', user?.id);
      }

      toast({
        title: "تم تحديث حالة الرحلة",
        description: `تم تحديث حالة الرحلة إلى ${
          status === 'arrived' ? 'وصل السائق' : 
          status === 'started' ? 'بدأت الرحلة' : 'انتهت الرحلة'
        }`,
      });
    } catch (error: any) {
      console.error('Error updating ride status:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user || !driverData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من بيانات السائق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-800 font-cairo">
                مرحباً {driverData.name}
              </h1>
              <p className="text-gray-500 text-sm font-tajawal">
                {driverData.vehicle_type} - {driverData.vehicle_plate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={isOnline ? "outline" : "secondary"}
              className={`font-cairo text-sm cursor-pointer ${isOnline ? 'text-green-600 border-green-600' : 'text-gray-500'
                }`}
              onClick={handleToggleOnlineStatus}
            >
              {isOnline ? 'أنت متصل الآن' : 'غير متصل'}
            </Badge>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-400 text-gray-700 hover:bg-gray-100 font-cairo"
            >
              <LogOut className="w-4 h-4 mr-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Live Fare Counter for accepted/started rides */}
      {(rideStatus === 'accepted' || rideStatus === 'arrived') && activeRide && (
        <LiveFareCounter
          currentFare={activeRide.price || 0}
          startTime={trackingStartTime}
          distance={activeRide.distance_km || 0}
          duration={0}
          speed={0}
          customerName={activeRide.customer?.name}
          isActive={true}
          activeRide={activeRide}
          rideStatus={rideStatus}
          onUpdateRideStatus={handleUpdateRideStatus}
        />
      )}

      {(rideStatus === 'started') && activeRide && (
        <LiveFareCounter
          currentFare={activeRide.price || 0}
          startTime={trackingStartTime}
          distance={activeRide.distance_km || 0}
          duration={0}
          speed={0}
          customerName={activeRide.customer?.name}
          isActive={true}
          activeRide={activeRide}
          rideStatus={rideStatus}
          onUpdateRideStatus={handleUpdateRideStatus}
        />
      )}

      {/* Main Content - only show when not in active ride mode */}
      {(!rideStatus || rideStatus === 'completed') && (
        <div className="container mx-auto p-6 space-y-8">
          {/* Ride Request Section */}
          <Card className="shadow-md">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg font-cairo">
                طلبات الرحلات المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {rideRequests.length === 0 ? (
                <div className="text-center py-6">
                  <AlertTriangle className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                  <p className="text-gray-600 font-cairo">
                    لا توجد طلبات رحلات متاحة حالياً.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rideRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white rounded-lg shadow-sm p-4 border"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800 font-tajawal">
                            {request.from_location} - {request.to_location}
                          </p>
                          <p className="text-gray-500 text-sm font-tajawal">
                            الزبون: {request.customer?.name || 'غير محدد'}
                          </p>
                          <p className="text-emerald-500 font-bold">
                            {request.price?.toLocaleString() || 'غير محدد'} ل.س
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-cairo"
                            onClick={() => handleAcceptRide(request.id)}
                          >
                            قبول الطلب
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-2 font-tajawal">
                        {new Date(request.created_at).toLocaleDateString('ar-SA')}{' '}
                        -{' '}
                        {new Date(request.created_at).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Info Section */}
          <Card className="shadow-md">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg font-cairo">
                معلومات السائق
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-cairo">
                    الاسم:
                  </span>
                  <span className="text-gray-800 font-tajawal">
                    {driverData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-cairo">
                    رقم الهاتف:
                  </span>
                  <span className="text-gray-800 font-tajawal">
                    {driverData.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-cairo">
                    نوع المركبة:
                  </span>
                  <span className="text-gray-800 font-tajawal">
                    {driverData.vehicle_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-cairo">
                    رقم اللوحة:
                  </span>
                  <span className="text-gray-800 font-tajawal">
                    {driverData.vehicle_plate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-cairo">
                    الحالة:
                  </span>
                  <span className={`font-tajawal ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'متاح' : 'غير متاح'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DriverPage;
