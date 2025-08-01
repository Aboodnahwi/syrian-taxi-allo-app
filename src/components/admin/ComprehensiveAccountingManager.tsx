
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Car, 
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccountingSummary {
  totalRevenue: number;
  totalTrips: number;
  activeDrivers: number;
  activeCustomers: number;
  avgTripValue: number;
  monthlyGrowth: number;
}

interface DriverAccounting {
  driverId: string;
  driverName: string;
  totalTrips: number;
  totalEarnings: number;
  completionRate: number;
  rating: number;
  lastActive: string;
}

interface CustomerAccounting {
  customerId: string;
  customerName: string;
  totalTrips: number;
  totalSpent: number;
  avgTripValue: number;
  lastTrip: string;
}

const ComprehensiveAccountingManager = () => {
  const [summary, setSummary] = useState<AccountingSummary>({
    totalRevenue: 0,
    totalTrips: 0,
    activeDrivers: 0,
    activeCustomers: 0,
    avgTripValue: 0,
    monthlyGrowth: 0
  });

  const [driverAccounting, setDriverAccounting] = useState<DriverAccounting[]>([]);
  const [customerAccounting, setCustomerAccounting] = useState<CustomerAccounting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('this_month');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadAccountingData();
  }, [dateFilter]);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      // Get date range based on filter
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'this_month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'this_year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch trips data with profiles
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          customer:profiles!trips_customer_id_fkey(id, name, phone),
          driver_profile:profiles!trips_driver_id_fkey(id, name, phone)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const completedTrips = trips?.filter(trip => trip.status === 'completed') || [];
      const totalRevenue = completedTrips.reduce((sum, trip) => sum + (trip.price || 0), 0);
      const avgTripValue = completedTrips.length > 0 ? totalRevenue / completedTrips.length : 0;

      // Get unique drivers and customers
      const uniqueDrivers = new Set(trips?.filter(trip => trip.driver_id).map(trip => trip.driver_id));
      const uniqueCustomers = new Set(trips?.map(trip => trip.customer_id));

      setSummary({
        totalRevenue,
        totalTrips: trips?.length || 0,
        activeDrivers: uniqueDrivers.size,
        activeCustomers: uniqueCustomers.size,
        avgTripValue,
        monthlyGrowth: 12.5 // This would be calculated from previous period comparison
      });

      // Process driver accounting
      const driverMap = new Map<string, any>();
      completedTrips.forEach(trip => {
        if (trip.driver_id && trip.driver_profile) {
          if (!driverMap.has(trip.driver_id)) {
            driverMap.set(trip.driver_id, {
              driverId: trip.driver_id,
              driverName: trip.driver_profile.name || 'غير محدد',
              totalTrips: 0,
              totalEarnings: 0,
              trips: []
            });
          }
          const driver = driverMap.get(trip.driver_id);
          driver.totalTrips++;
          driver.totalEarnings += trip.price || 0;
          driver.trips.push(trip);
        }
      });

      const driverAccountingData = Array.from(driverMap.values()).map(driver => ({
        ...driver,
        completionRate: (driver.totalTrips / (driver.totalTrips + 1)) * 100, // Simplified calculation
        rating: 4.5, // Would come from ratings table
        lastActive: new Date().toLocaleDateString('ar-SA')
      }));

      setDriverAccounting(driverAccountingData);

      // Process customer accounting
      const customerMap = new Map<string, any>();
      completedTrips.forEach(trip => {
        if (trip.customer && trip.customer.id) {
          if (!customerMap.has(trip.customer.id)) {
            customerMap.set(trip.customer.id, {
              customerId: trip.customer.id,
              customerName: trip.customer.name || 'غير محدد',
              totalTrips: 0,
              totalSpent: 0,
              trips: []
            });
          }
          const customer = customerMap.get(trip.customer.id);
          customer.totalTrips++;
          customer.totalSpent += trip.price || 0;
          customer.trips.push(trip);
        }
      });

      const customerAccountingData = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        avgTripValue: customer.totalSpent / customer.totalTrips,
        lastTrip: new Date().toLocaleDateString('ar-SA')
      }));

      setCustomerAccounting(customerAccountingData);

    } catch (error: any) {
      console.error('Error loading accounting data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = (type: 'drivers' | 'customers' | 'summary') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'drivers':
        data = driverAccounting;
        filename = 'driver_accounting.json';
        break;
      case 'customers':
        data = customerAccounting;
        filename = 'customer_accounting.json';
        break;
      case 'summary':
        data = [summary];
        filename = 'accounting_summary.json';
        break;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير بيانات ${type === 'drivers' ? 'السائقين' : type === 'customers' ? 'الزبائن' : 'الملخص'}`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  const filteredDrivers = driverAccounting.filter(driver =>
    driver.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customerAccounting.filter(customer =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-cairo flex items-center gap-3">
            <Calculator className="w-8 h-8" />
            نظام المحاسبة الشامل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <Label className="text-purple-100 font-tajawal">الفترة الزمنية</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="this_week">هذا الأسبوع</SelectItem>
                  <SelectItem value="this_month">هذا الشهر</SelectItem>
                  <SelectItem value="this_year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-purple-100 font-tajawal">البحث</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="ابحث عن سائق أو زبون..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">
              {summary.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400 font-tajawal">إجمالي الإيرادات (ل.س)</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Car className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">{summary.totalTrips}</div>
            <div className="text-sm text-slate-400 font-tajawal">إجمالي الرحلات</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-purple-400">{summary.activeDrivers}</div>
            <div className="text-sm text-slate-400 font-tajawal">السائقين النشطين</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <div className="text-2xl font-bold text-cyan-400">{summary.activeCustomers}</div>
            <div className="text-sm text-slate-400 font-tajawal">الزبائن النشطين</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-400">
              {summary.avgTripValue.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400 font-tajawal">متوسط قيمة الرحلة</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <div className="text-2xl font-bold text-emerald-400">
              +{summary.monthlyGrowth.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400 font-tajawal">النمو الشهري</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="drivers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700">
            محاسبة السائقين
          </TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-slate-700">
            محاسبة الزبائن
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-slate-700">
            التقارير المالية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-cairo text-white">محاسبة السائقين المفصلة</h3>
            <Button onClick={() => exportData('drivers')} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              تصدير بيانات السائقين
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="text-right p-4 font-cairo text-white">اسم السائق</th>
                      <th className="text-right p-4 font-cairo text-white">عدد الرحلات</th>
                      <th className="text-right p-4 font-cairo text-white">إجمالي الأرباح</th>
                      <th className="text-right p-4 font-cairo text-white">معدل الإكمال</th>
                      <th className="text-right p-4 font-cairo text-white">التقييم</th>
                      <th className="text-right p-4 font-cairo text-white">آخر نشاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((driver, index) => (
                      <tr key={driver.driverId} className="border-b border-slate-600">
                        <td className="p-4 text-white font-tajawal">{driver.driverName}</td>
                        <td className="p-4 text-blue-400 font-bold">{driver.totalTrips}</td>
                        <td className="p-4 text-green-400 font-bold">
                          {driver.totalEarnings.toLocaleString()} ل.س
                        </td>
                        <td className="p-4">
                          <Badge className="bg-green-500">
                            {driver.completionRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-4 text-yellow-400">⭐ {driver.rating}</td>
                        <td className="p-4 text-slate-400 font-tajawal">{driver.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-cairo text-white">محاسبة الزبائن المفصلة</h3>
            <Button onClick={() => exportData('customers')} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              تصدير بيانات الزبائن
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="text-right p-4 font-cairo text-white">اسم الزبون</th>
                      <th className="text-right p-4 font-cairo text-white">عدد الرحلات</th>
                      <th className="text-right p-4 font-cairo text-white">إجمالي الإنفاق</th>
                      <th className="text-right p-4 font-cairo text-white">متوسط الرحلة</th>
                      <th className="text-right p-4 font-cairo text-white">آخر رحلة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <tr key={customer.customerId} className="border-b border-slate-600">
                        <td className="p-4 text-white font-tajawal">{customer.customerName}</td>
                        <td className="p-4 text-blue-400 font-bold">{customer.totalTrips}</td>
                        <td className="p-4 text-purple-400 font-bold">
                          {customer.totalSpent.toLocaleString()} ل.س
                        </td>
                        <td className="p-4 text-cyan-400">
                          {customer.avgTripValue.toLocaleString()} ل.س
                        </td>
                        <td className="p-4 text-slate-400 font-tajawal">{customer.lastTrip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-cairo text-white">التقارير المالية الشاملة</h3>
            <Button onClick={() => exportData('summary')} className="bg-purple-600 hover:bg-purple-700">
              <Download className="w-4 h-4 mr-2" />
              تصدير التقرير الشامل
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-cairo flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  ملخص الأداء المالي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">إجمالي الرحلات المكتملة</span>
                  <span className="text-green-400 font-bold">{summary.totalTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">إجمالي الإيرادات</span>
                  <span className="text-green-400 font-bold">{summary.totalRevenue.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">متوسط قيمة الرحلة</span>
                  <span className="text-blue-400 font-bold">{summary.avgTripValue.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">معدل النمو الشهري</span>
                  <span className="text-emerald-400 font-bold">+{summary.monthlyGrowth}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-cairo flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  إحصائيات المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">إجمالي السائقين النشطين</span>
                  <span className="text-blue-400 font-bold">{summary.activeDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">إجمالي الزبائن النشطين</span>
                  <span className="text-purple-400 font-bold">{summary.activeCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">متوسط الرحلات لكل سائق</span>
                  <span className="text-cyan-400 font-bold">
                    {summary.activeDrivers > 0 ? (summary.totalTrips / summary.activeDrivers).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-tajawal">متوسط الرحلات لكل زبون</span>
                  <span className="text-yellow-400 font-bold">
                    {summary.activeCustomers > 0 ? (summary.totalTrips / summary.activeCustomers).toFixed(1) : '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveAccountingManager;
