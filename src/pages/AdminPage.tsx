import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Car, Users, MapPin, Clock, Settings, DollarSign, Calculator, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/map/Map';
import AdvancedPricingManager from '@/components/admin/AdvancedPricingManager';
import DriverApplicationsManager from '@/components/admin/DriverApplicationsManager';
import PricingFactorsManager from '@/components/admin/PricingFactorsManager';
import ComprehensiveAccountingManager from '@/components/admin/ComprehensiveAccountingManager';
import EnhancedVehiclePricingManager from '@/components/admin/EnhancedVehiclePricingManager';

const AdminPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trips, setTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    pendingTrips: 0,
    totalRevenue: 0
  });
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

  // تحميل البيانات والإحصائيات
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
          .limit(50);

        if (tripsError) throw tripsError;
        setTrips(tripsData || []);

        // حساب الإحصائيات
        const totalTrips = tripsData?.length || 0;
        const completedTrips = tripsData?.filter(trip => trip.status === 'completed').length || 0;
        const pendingTrips = tripsData?.filter(trip => trip.status === 'pending').length || 0;
        const totalRevenue = tripsData
          ?.filter(trip => trip.status === 'completed')
          ?.reduce((sum, trip) => sum + (trip.price || 0), 0) || 0;

        setStats({
          totalTrips,
          completedTrips,
          pendingTrips,
          totalRevenue
        });

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

  // تحضير البيانات للخريطة - تصحيح تحويل الإحداثيات
  const mapMarkers = trips
    .filter(trip => trip.from_coordinates && trip.to_coordinates)
    .map(trip => {
      try {
        // تحويل النقاط من تنسيق PostgreSQL point إلى إحداثيات
        const fromCoords = trip.from_coordinates.replace(/[()]/g, '').split(',').map(Number);
        const toCoords = trip.to_coordinates.replace(/[()]/g, '').split(',').map(Number);
        
        // التأكد من صحة الإحداثيات
        if (fromCoords.length !== 2 || toCoords.length !== 2) {
          console.warn('Invalid coordinates for trip:', trip.id);
          return null;
        }
        
        return {
          id: trip.id,
          position: [fromCoords[0], fromCoords[1]] as [number, number],
          popup: `${trip.customer?.name || 'غير محدد'} - ${trip.status === 'completed' ? 'مكتملة' : trip.status === 'pending' ? 'قيد الانتظار' : trip.status === 'in_progress' ? 'جارية' : 'ملغية'}`,
          icon: {
            html: `<div class="w-6 h-6 rounded-full ${trip.status === 'completed' ? 'bg-green-500' : trip.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">🚗</div>`,
            className: 'custom-marker',
            iconSize: [24, 24] as [number, number],
            iconAnchor: [12, 12] as [number, number]
          }
        };
      } catch (error) {
        console.error('Error processing trip coordinates:', trip.id, error);
        return null;
      }
    })
    .filter(marker => marker !== null);

  const handleSignOut = async () => {
    await signOut();
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
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-cairo">لوحة الإدارة المتقدمة</h1>
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

      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700">
              لوحة المعلومات
            </TabsTrigger>
            <TabsTrigger value="accounting" className="data-[state=active]:bg-slate-700">
              المحاسبة الشاملة
            </TabsTrigger>
            <TabsTrigger value="vehicle-pricing" className="data-[state=active]:bg-slate-700">
              إدارة وسائل النقل
            </TabsTrigger>
            <TabsTrigger value="advanced-pricing" className="data-[state=active]:bg-slate-700">
              التسعير المتقدم
            </TabsTrigger>
            <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700">
              طلبات السائقين
            </TabsTrigger>
            <TabsTrigger value="factors" className="data-[state=active]:bg-slate-700">
              عوامل التسعير
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-slate-700">
              الخريطة التفاعلية
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* الإحصائيات الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-400" />
                    إجمالي الرحلات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalTrips}</div>
                  <p className="text-slate-400 text-sm font-tajawal">جميع الرحلات</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                    <Car className="w-5 h-5 text-green-400" />
                    الرحلات المكتملة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400 mb-2">{stats.completedTrips}</div>
                  <p className="text-slate-400 text-sm font-tajawal">رحلات مكتملة</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    الرحلات المعلقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.pendingTrips}</div>
                  <p className="text-slate-400 text-sm font-tajawal">في الانتظار</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                    إجمالي الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {stats.totalRevenue.toLocaleString()} ل.س
                  </div>
                  <p className="text-slate-400 text-sm font-tajawal">من الرحلات المكتملة</p>
                </CardContent>
              </Card>
            </div>

            {/* إحصائيات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    السائقين ({drivers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">السائقين النشطين</span>
                      <span className="text-green-400">{drivers.filter(d => d.is_active).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">السائقين غير النشطين</span>
                      <span className="text-red-400">{drivers.filter(d => !d.is_active).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    الزبائن ({customers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">زبائن نشطين</span>
                      <span className="text-blue-400">{customers.filter(c => c.is_active).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">إجمالي الزبائن</span>
                      <span className="text-slate-300">{customers.length}</span>
                    </div>
                  </div>
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
                {trips.slice(0, 15).map((trip) => (
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
                        <p className="text-emerald-400 font-semibold">
                          {trip.price ? trip.price.toLocaleString() : 0} ل.س
                        </p>
                      </div>
                      <Badge 
                        className={`
                          ${trip.status === 'completed' ? 'bg-green-500' : ''}
                          ${trip.status === 'pending' ? 'bg-yellow-500' : ''}
                          ${trip.status === 'accepted' ? 'bg-blue-500' : ''}
                          ${trip.status === 'started' ? 'bg-purple-500' : ''}
                          ${trip.status === 'cancelled' ? 'bg-red-500' : ''}
                        `}
                      >
                        {trip.status === 'completed' && 'مكتملة'}
                        {trip.status === 'pending' && 'قيد الانتظار'}
                        {trip.status === 'accepted' && 'مقبولة'}
                        {trip.status === 'started' && 'جارية'}
                        {trip.status === 'cancelled' && 'ملغية'}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-xs font-tajawal">
                      {new Date(trip.created_at).toLocaleDateString('ar-SA')} - {new Date(trip.created_at).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounting">
            <ComprehensiveAccountingManager />
          </TabsContent>

          <TabsContent value="vehicle-pricing">
            <EnhancedVehiclePricingManager />
          </TabsContent>

          <TabsContent value="advanced-pricing">
            <AdvancedPricingManager />
          </TabsContent>

          <TabsContent value="drivers">
            <DriverApplicationsManager />
          </TabsContent>

          <TabsContent value="factors">
            <PricingFactorsManager />
          </TabsContent>

          <TabsContent value="map">
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
                    markers={mapMarkers}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
