
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DollarSign, User, TrendingUp, TrendingDown, Calculator, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DriverAccount {
  driver_id: string;
  driver_name: string;
  total_earnings: number;
  platform_commission: number;
  net_balance: number;
  total_trips: number;
  commission_rate: number;
}

interface Transaction {
  id: string;
  trip_id: string;
  driver_name: string;
  customer_name: string;
  trip_fare: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
  from_location: string;
  to_location: string;
}

const DriverAccountingManager = () => {
  const [drivers, setDrivers] = useState<DriverAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDriverAccounts();
    loadTransactions();
    loadCommissionRate();
  }, []);

  const loadCommissionRate = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'platform_commission_rate')
        .single();

      if (data) {
        setCommissionRate(parseFloat(data.setting_value));
      }
    } catch (error) {
      console.log('استخدام نسبة العمولة الافتراضية');
    }
  };

  const updateCommissionRate = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'platform_commission_rate',
          setting_value: commissionRate.toString(),
          description: 'نسبة عمولة المنصة من أرباح السائقين'
        });

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث نسبة العمولة إلى ${commissionRate}%`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      loadDriverAccounts();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadDriverAccounts = async () => {
    try {
      setLoading(true);

      // جلب بيانات السائقين وحساباتهم
      const { data: driversData, error: driversError } = await supabase
        .from('trips')
        .select(`
          driver_id,
          price,
          status,
          profiles!trips_driver_id_fkey (name)
        `)
        .eq('status', 'completed')
        .not('driver_id', 'is', null);

      if (driversError) throw driversError;

      // تجميع البيانات لكل سائق
      const driverAccountsMap = new Map<string, DriverAccount>();

      driversData?.forEach((trip) => {
        if (!trip.driver_id || !trip.profiles) return;

        const driverId = trip.driver_id;
        const driverName = trip.profiles.name || 'سائق غير معروف';
        const tripFare = trip.price || 0;
        const commissionAmount = (tripFare * commissionRate) / 100;
        const netAmount = tripFare - commissionAmount;

        if (driverAccountsMap.has(driverId)) {
          const account = driverAccountsMap.get(driverId)!;
          account.total_earnings += tripFare;
          account.platform_commission += commissionAmount;
          account.net_balance += netAmount;
          account.total_trips += 1;
        } else {
          driverAccountsMap.set(driverId, {
            driver_id: driverId,
            driver_name: driverName,
            total_earnings: tripFare,
            platform_commission: commissionAmount,
            net_balance: netAmount,
            total_trips: 1,
            commission_rate: commissionRate
          });
        }
      });

      setDrivers(Array.from(driverAccountsMap.values()));
    } catch (error: any) {
      console.error('خطأ في تحميل حسابات السائقين:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          price,
          created_at,
          from_location,
          to_location,
          customer:profiles!trips_customer_id_fkey (name),
          driver:profiles!trips_driver_id_fkey (name, id)
        `)
        .eq('status', 'completed')
        .not('driver_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedTransactions = data?.map(trip => ({
        id: trip.id,
        trip_id: trip.id,
        driver_name: trip.driver?.name || 'سائق غير معروف',
        customer_name: trip.customer?.name || 'زبون غير معروف',
        trip_fare: trip.price || 0,
        commission_amount: ((trip.price || 0) * commissionRate) / 100,
        net_amount: (trip.price || 0) - (((trip.price || 0) * commissionRate) / 100),
        created_at: trip.created_at,
        from_location: trip.from_location || '',
        to_location: trip.to_location || ''
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error('خطأ في تحميل المعاملات:', error);
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedDriver && transaction.driver_name !== selectedDriver) return false;
    return transaction.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPlatformEarnings = drivers.reduce((sum, driver) => sum + driver.platform_commission, 0);
  const totalDriverEarnings = drivers.reduce((sum, driver) => sum + driver.net_balance, 0);
  const totalTrips = drivers.reduce((sum, driver) => sum + driver.total_trips, 0);

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-cairo flex items-center gap-3">
            <Calculator className="w-8 h-8" />
            نظام محاسبة السائقين
          </CardTitle>
          <p className="text-green-100 font-tajawal text-lg">
            إدارة شاملة لحسابات السائقين والعمولات
          </p>
        </CardHeader>
      </Card>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              إجمالي أرباح المنصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {totalPlatformEarnings.toLocaleString()} ل.س
            </div>
            <p className="text-slate-400 text-sm font-tajawal">العمولة المحصلة</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              أرباح السائقين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {totalDriverEarnings.toLocaleString()} ل.س
            </div>
            <p className="text-slate-400 text-sm font-tajawal">صافي الأرباح</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              عدد السائقين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {drivers.length}
            </div>
            <p className="text-slate-400 text-sm font-tajawal">سائق نشط</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-cairo text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              نسبة العمولة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {commissionRate}%
            </div>
            <p className="text-slate-400 text-sm font-tajawal">من كل رحلة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* إعدادات العمولة */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white font-cairo flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-400" />
              إعدادات العمولة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300 font-tajawal">نسبة عمولة المنصة (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="15"
              />
            </div>
            <Button 
              onClick={updateCommissionRate}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              تحديث نسبة العمولة
            </Button>
            <div className="text-sm text-slate-400 font-tajawal">
              <p>مثال: إذا كانت قيمة الرحلة 10,000 ل.س</p>
              <p>عمولة المنصة: {((10000 * commissionRate) / 100).toLocaleString()} ل.س</p>
              <p>صافي السائق: {(10000 - (10000 * commissionRate) / 100).toLocaleString()} ل.س</p>
            </div>
          </CardContent>
        </Card>

        {/* حسابات السائقين */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-cairo flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                حسابات السائقين
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="البحث عن سائق..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button variant="outline" size="icon" className="border-slate-600">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {filteredDrivers.map((driver) => (
                <div key={driver.driver_id} className="border border-slate-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-medium font-cairo">{driver.driver_name}</h3>
                      <p className="text-slate-400 text-sm font-tajawal">
                        {driver.total_trips} رحلة مكتملة
                      </p>
                    </div>
                    <Badge className="bg-green-500">
                      نشط
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-400">
                        {driver.total_earnings.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">إجمالي الأرباح</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        -{driver.platform_commission.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">عمولة المنصة</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        {driver.net_balance.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">صافي الرصيد</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* سجل المعاملات المفصل */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white font-cairo flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            سجل المعاملات المفصل ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="border border-slate-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-white font-medium font-tajawal">
                    {transaction.from_location} ← {transaction.to_location}
                  </p>
                  <p className="text-slate-400 text-sm font-tajawal">
                    السائق: {transaction.driver_name} | الزبون: {transaction.customer_name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">
                    {transaction.trip_fare.toLocaleString()} ل.س
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(transaction.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
              
              <Separator className="bg-slate-600 my-2" />
              
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-blue-400 font-medium">
                    {transaction.trip_fare.toLocaleString()}
                  </div>
                  <div className="text-slate-500">قيمة الرحلة</div>
                </div>
                <div>
                  <div className="text-red-400 font-medium">
                    -{transaction.commission_amount.toLocaleString()}
                  </div>
                  <div className="text-slate-500">عمولة المنصة</div>
                </div>
                <div>
                  <div className="text-green-400 font-medium">
                    {transaction.net_amount.toLocaleString()}
                  </div>
                  <div className="text-slate-500">صافي السائق</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverAccountingManager;
