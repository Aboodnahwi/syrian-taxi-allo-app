import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Car, Users, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/map/Map';

const AdminPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trips, setTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // التحقق من صلاحية الوصول
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (user.role !== 'admin') {
      toast({
        title: "غير مسموح",
        description: "ليس لديك صلاحية للوصول لهذه الصفحة",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
  }, [user, navigate, toast]);

  // تحميل البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // جلب الرحلات
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select(`
            *,
            customer:profiles!trips_customer_id_fkey(name, phone),
            driver:profiles!trips_driver_id_fkey(name, phone)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (tripsError) throw tripsError;
        setTrips(tripsData || []);

        // جلب السائقين
        const { data: driversData, error: driversError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'driver');

        if (driversError) throw driversError;
        setDrivers(driversData || []);

        // جلب الزبائن
        const { data: customersData, error: customersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer');

        if (customersError) throw customersError;
        setCustomers(customersData || []);

      } catch (error: any) {
        console.error('Error fetching admin data:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, toast]);

  // تحضير البيانات للخريطة
  const mapMarkers = trips
    .filter(trip => trip.from_coordinates && trip.to_coordinates)
    .map(trip => {
      // تحويل النقاط من تنسيق PostgreSQL point إلى إحداثيات
      const fromCoords = trip.from_coordinates.replace(/[()]/g, '').split(',').map(Number);
      const toCoords = trip.to_coordinates.replace(/[()]/g, '').split(',').map(Number);
      
      return {
        id: trip.id,
        from: [fromCoords[0], fromCoords[1]] as [number, number],
        to: [toCoords[0], toCoords[1]] as [number, number],
        status: trip.status,
        customer: trip.customer?.name || 'غير محدد',
        driver: trip.driver?.name || 'لا يوجد سائق',
        created_at: trip.created_at
      };
    });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-cairo">لوحة الإدارة</h1>
              <p className="text-slate-300 font-tajawal">مرحباً {user.name}</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 grid lg:grid-cols-3 gap-6">
        {/* الإحصائيات */}
        <div className="lg:col-span-1 space-y-6">
          {/* إحصائيات عامة */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" />
                  الرحلات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400 mb-2">{trips.length}</div>
                <p className="text-slate-400 text-sm font-tajawal">إجمالي الرحلات</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  السائقين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400 mb-2">{drivers.length}</div>
                <p className="text-slate-400 text-sm font-tajawal">إجمالي السائقين</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  الزبائن
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-400 mb-2">{customers.length}</div>
                <p className="text-slate-400 text-sm font-tajawal">إجمالي الزبائن</p>
              </CardContent>
            </Card>
          </div>

          {/* آخر الرحلات */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                آخر الرحلات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {trips.slice(0, 10).map((trip) => (
                <div key={trip.id} className="border border-slate-600 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-white font-medium font-tajawal truncate">
                        {trip.from_location} ← {trip.to_location}
                      </p>
                      <p className="text-slate-400 text-sm font-tajawal">
                        الزبون: {trip.customer?.name || 'غير محدد'}
                      </p>
                      {trip.driver && (
                        <p className="text-slate-400 text-sm font-tajawal">
                          السائق: {trip.driver.name}
                        </p>
                      )}
                    </div>
                    <Badge 
                      className={`
                        ${trip.status === 'completed' ? 'bg-green-500' : ''}
                        ${trip.status === 'pending' ? 'bg-yellow-500' : ''}
                        ${trip.status === 'in_progress' ? 'bg-blue-500' : ''}
                        ${trip.status === 'cancelled' ? 'bg-red-500' : ''}
                      `}
                    >
                      {trip.status === 'completed' && 'مكتملة'}
                      {trip.status === 'pending' && 'قيد الانتظار'}
                      {trip.status === 'in_progress' && 'جارية'}
                      {trip.status === 'cancelled' && 'ملغية'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-xs font-tajawal">
                    {new Date(trip.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* الخريطة التفاعلية */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-400" />
                الخريطة التفاعلية - الرحلات المباشرة
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[600px] p-0">
              <div className="h-full rounded-lg overflow-hidden">
                <Map
                  center={[33.5138, 36.2765]} // دمشق
                  zoom={11}
                  markers={mapMarkers.map(marker => ({
                    id: marker.id,
                    position: marker.from,
                    type: 'pickup',
                    title: `من: ${marker.customer}`,
                    description: `الحالة: ${marker.status}`
                  }))}
                  routes={mapMarkers.map(marker => ({
                    id: marker.id,
                    from: marker.from,
                    to: marker.to,
                    color: marker.status === 'completed' ? '#10b981' : 
                           marker.status === 'in_progress' ? '#3b82f6' : '#eab308'
                  }))}
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
