
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, TrendingDown, Eye, Calculator } from 'lucide-react';

interface DriverFinancials {
  driverId: string;
  driverName: string;
  totalTrips: number;
  totalRevenue: number;
  platformCommission: number;
  driverEarnings: number;
  avgTripValue: number;
  lastTripDate: string;
  currentBalance: number;
  monthlyEarnings: number;
  completionRate: number;
}

interface TripDetail {
  id: string;
  date: string;
  from_location: string;
  to_location: string;
  price: number;
  platformCommission: number;
  driverEarning: number;
  customerName: string;
  distance: number;
  status: string;
}

const DriverAccountingManager = () => {
  const [driversFinancials, setDriversFinancials] = useState<DriverFinancials[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [driverTrips, setDriverTrips] = useState<TripDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState(15);
  const { toast } = useToast();

  useEffect(() => {
    fetchDriversFinancials();
    fetchCommissionRate();
  }, []);

  const fetchCommissionRate = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'platform_commission_rate')
        .single();
      
      if (data) {
        setCommissionRate(parseFloat(data.setting_value));
      }
    } catch (error) {
      console.error('خطأ في جلب نسبة العمولة:', error);
    }
  };

  const fetchDriversFinancials = async () => {
    setLoading(true);
    try {
      // جلب جميع الرحلات المكتملة مع بيانات السائق والزبون
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          driver_id,
          customer_id,
          price,
          distance_km,
          completed_at,
          from_location,
          to_location,
          status
        `)
        .eq('status', 'completed')
        .not('driver_id', 'is', null);

      if (tripsError) throw tripsError;

      // جلب أسماء السائقين
      const driverIds = [...new Set(trips?.map(trip => trip.driver_id).filter(Boolean))];
      const { data: drivers, error: driversError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', driverIds);

      if (driversError) throw driversError;

      // جلب أسماء الزبائن
      const customerIds = [...new Set(trips?.map(trip => trip.customer_id))];
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', customerIds);

      if (customersError) throw customersError;

      // إنشاء خرائط للأسماء
      const driverNamesMap = drivers?.reduce((acc, driver) => {
        acc[driver.id] = driver.name;
        return acc;
      }, {} as Record<string, string>) || {};

      const customerNamesMap = customers?.reduce((acc, customer) => {
        acc[customer.id] = customer.name;
        return acc;
      }, {} as Record<string, string>) || {};

      // تجميع البيانات المالية لكل سائق
      const financialsByDriver = trips?.reduce((acc, trip) => {
        if (!trip.driver_id) return acc;

        const driverId = trip.driver_id;
        const price = trip.price || 0;
        const commission = (price * commissionRate) / 100;
        const earning = price - commission;

        if (!acc[driverId]) {
          acc[driverId] = {
            driverId,
            driverName: driverNamesMap[driverId] || 'سائق غير معروف',
            totalTrips: 0,
            totalRevenue: 0,
            platformCommission: 0,
            driverEarnings: 0,
            avgTripValue: 0,
            lastTripDate: '',
            currentBalance: 0,
            monthlyEarnings: 0,
            completionRate: 0
          };
        }

        acc[driverId].totalTrips += 1;
        acc[driverId].totalRevenue += price;
        acc[driverId].platformCommission += commission;
        acc[driverId].driverEarnings += earning;
        
        // آخر رحلة
        if (!acc[driverId].lastTripDate || trip.completed_at > acc[driverId].lastTripDate) {
          acc[driverId].lastTripDate = trip.completed_at;
        }

        // الأرباح الشهرية (الشهر الحالي)
        const tripDate = new Date(trip.completed_at);
        const currentDate = new Date();
        if (tripDate.getMonth() === currentDate.getMonth() && 
            tripDate.getFullYear() === currentDate.getFullYear()) {
          acc[driverId].monthlyEarnings += earning;
        }

        return acc;
      }, {} as Record<string, DriverFinancials>) || {};

      // حساب المتوسطات
      Object.values(financialsByDriver).forEach(driver => {
        driver.avgTripValue = driver.totalTrips > 0 ? driver.totalRevenue / driver.totalTrips : 0;
        driver.currentBalance = driver.driverEarnings; // الرصيد الحالي = مجموع الأرباح
        driver.completionRate = 100; // يمكن تحسينه لاحقاً
      });

      setDriversFinancials(Object.values(financialsByDriver));

    } catch (error: any) {
      console.error('خطأ في جلب البيانات المالية:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverTrips = async (driverId: string) => {
    setLoading(true);
    try {
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          completed_at,
          from_location,
          to_location,
          price,
          distance_km,
          status,
          customer_id
        `)
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (tripsError) throw tripsError;

      // جلب أسماء الزبائن
      const customerIds = trips?.map(trip => trip.customer_id) || [];
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', customerIds);

      const customerNamesMap = customers?.reduce((acc, customer) => {
        acc[customer.id] = customer.name;
        return acc;
      }, {} as Record<string, string>) || {};

      const tripDetails: TripDetail[] = trips?.map(trip => {
        const price = trip.price || 0;
        const commission = (price * commissionRate) / 100;
        const earning = price - commission;

        return {
          id: trip.id,
          date: trip.completed_at,
          from_location: trip.from_location,
          to_location: trip.to_location,
          price,
          platformCommission: commission,
          driverEarning: earning,
          customerName: customerNamesMap[trip.customer_id] || 'زبون غير معروف',
          distance: trip.distance_km || 0,
          status: trip.status
        };
      }) || [];

      setDriverTrips(tripDetails);
    } catch (error: any) {
      console.error('خطأ في جلب رحلات السائق:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ل.س`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SY');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-cairo">محاسبة السائقين</h2>
          <p className="text-slate-600 font-tajawal">إدارة الحسابات المالية للسائقين</p>
        </div>
        <Button onClick={fetchDriversFinancials} disabled={loading}>
          تحديث البيانات
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* إحصائيات عامة */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مجموع السائقين</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cairo">{driversFinancials.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cairo text-green-600">
                  {formatCurrency(driversFinancials.reduce((acc, d) => acc + d.totalRevenue, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">عمولة المنصة</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cairo text-blue-600">
                  {formatCurrency(driversFinancials.reduce((acc, d) => acc + d.platformCommission, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أرباح السائقين</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cairo text-orange-600">
                  {formatCurrency(driversFinancials.reduce((acc, d) => acc + d.driverEarnings, 0))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* قائمة السائقين */}
          <Card>
            <CardHeader>
              <CardTitle>حسابات السائقين</CardTitle>
              <CardDescription>تفاصيل الحسابات المالية لجميع السائقين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driversFinancials.map((driver) => (
                  <div key={driver.driverId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold font-cairo text-lg">{driver.driverName}</h3>
                        <p className="text-sm text-slate-600">
                          آخر رحلة: {driver.lastTripDate ? formatDate(driver.lastTripDate) : 'لا توجد رحلات'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 font-cairo">
                          {formatCurrency(driver.currentBalance)}
                        </div>
                        <p className="text-sm text-slate-600">الرصيد الحالي</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">عدد الرحلات</p>
                        <p className="font-bold font-cairo">{driver.totalTrips}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">إجمالي الإيرادات</p>
                        <p className="font-bold font-cairo text-blue-600">
                          {formatCurrency(driver.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">عمولة المنصة ({commissionRate}%)</p>
                        <p className="font-bold font-cairo text-red-600">
                          {formatCurrency(driver.platformCommission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">صافي الأرباح</p>
                        <p className="font-bold font-cairo text-green-600">
                          {formatCurrency(driver.driverEarnings)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <Badge variant="secondary">
                        متوسط قيمة الرحلة: {formatCurrency(driver.avgTripValue)}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setSelectedDriver(driver.driverId);
                          fetchDriverTrips(driver.driverId);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                ))}

                {driversFinancials.length === 0 && !loading && (
                  <div className="text-center py-8 text-slate-600">
                    لا توجد بيانات مالية للسائقين
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedDriver && (
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل رحلات السائق</CardTitle>
                <CardDescription>
                  السائق: {driversFinancials.find(d => d.driverId === selectedDriver)?.driverName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {driverTrips.map((trip) => (
                    <div key={trip.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-bold">{trip.from_location} → {trip.to_location}</p>
                          <p className="text-sm text-slate-600">
                            الزبون: {trip.customerName} | المسافة: {trip.distance.toFixed(1)} كم
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(trip.date)}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-lg font-cairo">
                            {formatCurrency(trip.price)}
                          </p>
                          <p className="text-sm text-red-600">
                            عمولة: -{formatCurrency(trip.platformCommission)}
                          </p>
                          <p className="text-sm text-green-600 font-bold">
                            صافي: {formatCurrency(trip.driverEarning)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {driverTrips.length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-600">
                      اختر سائقاً لعرض تفاصيل رحلاته
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverAccountingManager;
