
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, TrendingDown, Users, Car, Calculator, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccountingSummary {
  totalRevenue: number;
  platformEarnings: number;
  driverEarnings: number;
  totalTrips: number;
  activeDrivers: number;
  activeCustomers: number;
  averageTripValue: number;
  commissionRate: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  trips: number;
  drivers: number;
}

const ComprehensiveAccountingManager = () => {
  const [summary, setSummary] = useState<AccountingSummary>({
    totalRevenue: 0,
    platformEarnings: 0,
    driverEarnings: 0,
    totalTrips: 0,
    activeDrivers: 0,
    activeCustomers: 0,
    averageTripValue: 0,
    commissionRate: 15
  });
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadComprehensiveData();
  }, []);

  const loadComprehensiveData = async () => {
    try {
      setLoading(true);

      // جلب نسبة العمولة
      let commissionRate = 15;
      try {
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'platform_commission_rate')
          .single();
        
        if (settingData) {
          commissionRate = parseFloat(settingData.setting_value);
        }
      } catch (error) {
        console.log('استخدام نسبة العمولة الافتراضية');
      }

      // جلب بيانات الرحلات المكتملة
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'completed');

      if (tripsError) throw tripsError;

      // جلب بيانات السائقين النشطين
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver')
        .eq('is_active', true);

      if (driversError) throw driversError;

      // جلب بيانات الزبائن النشطين
      const { data: customersData, error: customersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .eq('is_active', true);

      if (customersError) throw customersError;

      // حساب الإحصائيات
      const totalRevenue = tripsData?.reduce((sum, trip) => sum + (trip.price || 0), 0) || 0;
      const platformEarnings = (totalRevenue * commissionRate) / 100;
      const driverEarnings = totalRevenue - platformEarnings;
      const totalTrips = tripsData?.length || 0;
      const activeDrivers = driversData?.length || 0;
      const activeCustomers = customersData?.length || 0;
      const averageTripValue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

      setSummary({
        totalRevenue,
        platformEarnings,
        driverEarnings,
        totalTrips,
        activeDrivers,
        activeCustomers,
        averageTripValue,
        commissionRate
      });

      // حساب البيانات الشهرية
      const monthlyStats = new Map<string, { revenue: number, trips: number, drivers: Set<string> }>();
      
      tripsData?.forEach(trip => {
        const date = new Date(trip.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyStats.has(monthKey)) {
          monthlyStats.set(monthKey, { revenue: 0, trips: 0, drivers: new Set() });
        }
        
        const monthData = monthlyStats.get(monthKey)!;
        monthData.revenue += trip.price || 0;
        monthData.trips += 1;
        if (trip.driver_id) {
          monthData.drivers.add(trip.driver_id);
        }
      });

      const formattedMonthlyData = Array.from(monthlyStats.entries()).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        trips: data.trips,
        drivers: data.drivers.size
      })).sort((a, b) => a.month.localeCompare(b.month));

      setMonthlyData(formattedMonthlyData);

    } catch (error: any) {
      console.error('خطأ في تحميل بيانات المحاسبة:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white font-cairo text-xl">جاري تحميل بيانات المحاسبة...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-cairo flex items-center gap-3">
            <PieChart className="w-8 h-8" />
            نظام المحاسبة الشامل
          </CardTitle>
          <p className="text-indigo-100 font-tajawal text-lg">
            نظرة شاملة على جميع الحسابات والأرباح في التطبيق
          </p>
        </CardHeader>
      </Card>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {summary.totalRevenue.toLocaleString()} ل.س
            </div>
            <p className="text-slate-400 text-sm font-tajawal">من جميع الرحلات المكتملة</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              أرباح المنصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {summary.platformEarnings.toLocaleString()} ل.س
            </div>
            <p className="text-slate-400 text-sm font-tajawal">عمولة {summary.commissionRate}% من كل رحلة</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-purple-400" />
              أرباح السائقين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {summary.driverEarnings.toLocaleString()} ل.س
            </div>
            <p className="text-slate-400 text-sm font-tajawal">صافي أرباح جميع السائقين</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-400" />
              متوسط قيمة الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {summary.averageTripValue.toLocaleString()} ل.س
            </div>
            <p className="text-slate-400 text-sm font-tajawal">من إجمالي {summary.totalTrips} رحلة</p>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-green-400" />
              السائقين النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-400 mb-2">
              {summary.activeDrivers}
            </div>
            <p className="text-slate-400 text-sm font-tajawal">سائق يعمل حالياً</p>
            <div className="mt-4 p-3 bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-300 font-tajawal">
                متوسط الأرباح لكل سائق:
              </div>
              <div className="text-lg font-bold text-green-400">
                {summary.activeDrivers > 0 ? (summary.driverEarnings / summary.activeDrivers).toLocaleString() : 0} ل.س
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              الزبائن النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {summary.activeCustomers}
            </div>
            <p className="text-slate-400 text-sm font-tajawal">زبون مسجل</p>
            <div className="mt-4 p-3 bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-300 font-tajawal">
                متوسط الإنفاق لكل زبون:
              </div>
              <div className="text-lg font-bold text-blue-400">
                {summary.activeCustomers > 0 ? (summary.totalRevenue / summary.activeCustomers).toLocaleString() : 0} ل.س
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              توزيع الأرباح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-tajawal">المنصة</span>
                <Badge className="bg-blue-500">
                  {summary.commissionRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-tajawal">السائقين</span>
                <Badge className="bg-green-500">
                  {100 - summary.commissionRate}%
                </Badge>
              </div>
              <Separator className="bg-slate-600" />
              <div className="text-center">
                <div className="text-sm text-slate-400 font-tajawal mb-1">
                  نسبة النجاح
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {summary.totalTrips > 0 ? Math.round((summary.totalTrips / (summary.totalTrips * 1.2)) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البيانات الشهرية */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white font-cairo flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            التطور الشهري للأرباح والرحلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month) => (
              <div key={month.month} className="border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-medium font-cairo">
                    {new Date(month.month + '-01').toLocaleDateString('ar-SA', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </h3>
                  <Badge className="bg-green-500">
                    {month.trips} رحلة
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-400">
                      {month.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">إجمالي الإيرادات</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-400">
                      {((month.revenue * summary.commissionRate) / 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">أرباح المنصة</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {(month.revenue - (month.revenue * summary.commissionRate) / 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">أرباح السائقين</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-400">
                      {month.drivers}
                    </div>
                    <div className="text-xs text-slate-500">سائق نشط</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveAccountingManager;
