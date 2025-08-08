import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  CreditCard,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DriverAccount {
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  total_earnings: number;
  commission_deducted: number;
  net_balance: number;
  total_trips: number;
  last_trip_date: string;
  account_status: 'active' | 'suspended';
}

interface DriverTransaction {
  id: string;
  driver_id: string;
  driver_name: string;
  trip_id?: string;
  amount: number;
  type: 'earning' | 'commission' | 'payment' | 'adjustment';
  description: string;
  created_at: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const DriverAccountingManager = () => {
  const [driverAccounts, setDriverAccounts] = useState<DriverAccount[]>([]);
  const [transactions, setTransactions] = useState<DriverTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<DriverAccount | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const { toast } = useToast();

  const COMMISSION_RATE = 0.10; // 10% عمولة الموقع

  useEffect(() => {
    fetchDriverAccounts();
    fetchTransactions();
  }, []);

  const fetchDriverAccounts = async () => {
    try {
      setLoading(true);
      
      // جلب الرحلات المكتملة للسائقين
      const { data: completedTrips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'completed')
        .not('driver_id', 'is', null);

      if (tripsError) throw tripsError;

      // جلب معلومات السائقين مع ملفاتهم الشخصية
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*');

      if (driversError) throw driversError;

      // جلب ملفات المستخدمين
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      console.log('Drivers data:', driversData);
      console.log('Completed trips:', completedTrips);
      console.log('Profiles data:', profilesData);

      // حساب أرصدة السائقين
      const driverAccountsMap = new Map();

      // تجميع الرحلات حسب السائق
      completedTrips?.forEach((trip: any) => {
        if (trip.driver_id) {
          const driverId = trip.driver_id;
          const tripEarning = trip.price || 0;
          const commission = tripEarning * COMMISSION_RATE;
          const netEarning = tripEarning - commission;

          // العثور على معلومات السائق
          const driverInfo = driversData?.find(d => d.id === driverId);
          const driverProfile = profilesData?.find(p => p.id === driverInfo?.user_id);
          const driverName = driverProfile?.name || 'سائق غير معروف';
          const driverPhone = driverProfile?.phone || '';

          if (driverAccountsMap.has(driverId)) {
            const account = driverAccountsMap.get(driverId);
            account.total_earnings += tripEarning;
            account.commission_deducted += commission;
            account.net_balance += netEarning;
            account.total_trips += 1;
            account.last_trip_date = trip.completed_at > account.last_trip_date 
              ? trip.completed_at 
              : account.last_trip_date;
          } else {
            driverAccountsMap.set(driverId, {
              driver_id: driverId,
              driver_name: driverName,
              driver_phone: driverPhone,
              total_earnings: tripEarning,
              commission_deducted: commission,
              net_balance: netEarning,
              total_trips: 1,
              last_trip_date: trip.completed_at,
              account_status: 'active' as const
            });
          }
        }
      });

      // إضافة السائقين الذين لم يقوموا برحلات بعد
      driversData?.forEach((driver: any) => {
        if (!driverAccountsMap.has(driver.id)) {
          const driverProfile = profilesData?.find(p => p.id === driver.user_id);
          driverAccountsMap.set(driver.id, {
            driver_id: driver.id,
            driver_name: driverProfile?.name || 'سائق',
            driver_phone: driverProfile?.phone || '',
            total_earnings: 0,
            commission_deducted: 0,
            net_balance: 0,
            total_trips: 0,
            last_trip_date: '',
            account_status: (driverProfile?.is_active ? 'active' : 'suspended') as const
          });
        }
      });

      setDriverAccounts(Array.from(driverAccountsMap.values()));
    } catch (error: any) {
      console.error('خطأ في جلب حسابات السائقين:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // جلب المعاملات من الرحلات المكتملة
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'completed')
        .not('driver_id', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // جلب معلومات السائقين والملفات الشخصية
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const transactionsList: DriverTransaction[] = [];

      trips?.forEach((trip: any) => {
        if (trip.driver_id) {
          const tripEarning = trip.price || 0;
          const commission = tripEarning * COMMISSION_RATE;
          
          // العثور على اسم السائق
          const driverInfo = driversData?.find(d => d.id === trip.driver_id);
          const driverProfile = profilesData?.find(p => p.id === driverInfo?.user_id);
          const driverName = driverProfile?.name || 'سائق غير معروف';

          // معاملة الأرباح
          transactionsList.push({
            id: `earning-${trip.id}`,
            driver_id: trip.driver_id,
            driver_name: driverName,
            trip_id: trip.id,
            amount: tripEarning,
            type: 'earning',
            description: `أرباح رحلة: ${trip.from_location} → ${trip.to_location}`,
            created_at: trip.completed_at,
            status: 'completed'
          });

          // معاملة العمولة
          transactionsList.push({
            id: `commission-${trip.id}`,
            driver_id: trip.driver_id,
            driver_name: driverName,
            trip_id: trip.id,
            amount: commission,
            type: 'commission',
            description: `عمولة الموقع (${(COMMISSION_RATE * 100)}%) - رحلة: ${trip.from_location} → ${trip.to_location}`,
            created_at: trip.completed_at,
            status: 'completed'
          });
        }
      });

      setTransactions(transactionsList);
    } catch (error: any) {
      console.error('خطأ في جلب المعاملات:', error);
      toast({
        title: "خطأ في جلب المعاملات",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const processPayment = async () => {
    if (!selectedDriver || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى التأكد من المبلغ والوصف",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      
      // إضافة معاملة الدفع
      const newTransaction: DriverTransaction = {
        id: `payment-${Date.now()}`,
        driver_id: selectedDriver.driver_id,
        driver_name: selectedDriver.driver_name,
        amount: amount,
        type: 'payment',
        description: paymentDescription || `دفعة للسائق ${selectedDriver.driver_name}`,
        created_at: new Date().toISOString(),
        status: 'completed'
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // تحديث رصيد السائق
      setDriverAccounts(prev => 
        prev.map(account => 
          account.driver_id === selectedDriver.driver_id 
            ? { ...account, net_balance: account.net_balance - amount }
            : account
        )
      );

      toast({
        title: "تم الدفع بنجاح",
        description: `تم دفع ${amount.toLocaleString()} ل.س للسائق ${selectedDriver.driver_name}`,
      });

      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentDescription('');
      setSelectedDriver(null);
    } catch (error: any) {
      console.error('خطأ في معالجة الدفع:', error);
      toast({
        title: "خطأ في الدفع",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredDrivers = driverAccounts.filter(driver => {
    const matchesSearch = 
      driver.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.driver_phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || driver.account_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter(transaction =>
    transaction.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ل.س`;
  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'لا يوجد';
  };

  // حساب الإحصائيات العامة
  const totalDriverEarnings = driverAccounts.reduce((sum, driver) => sum + driver.total_earnings, 0);
  const totalCommissions = driverAccounts.reduce((sum, driver) => sum + driver.commission_deducted, 0);
  const totalNetBalance = driverAccounts.reduce((sum, driver) => sum + driver.net_balance, 0);
  const activeDrivers = driverAccounts.filter(d => d.account_status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">جاري تحميل بيانات محاسبة السائقين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white font-cairo">محاسبة السائقين</h2>
        <Button onClick={fetchDriverAccounts}>
          <Download className="w-4 h-4 mr-2" />
          تحديث البيانات
        </Button>
      </div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">السائقون النشطون</p>
                <p className="text-2xl font-bold text-blue-400">{activeDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalDriverEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">إجمالي العمولات</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-400">الرصيد الصافي</p>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(totalNetBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والتصفية */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="البحث عن سائق..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="suspended">معلق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="accounts" className="data-[state=active]:bg-slate-700 text-white">
            حسابات السائقين
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-slate-700 text-white">
            سجل المعاملات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-cairo">حسابات السائقين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredDrivers.map((driver) => (
                  <div key={driver.driver_id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{driver.driver_name}</h3>
                      <p className="text-sm text-gray-400">{driver.driver_phone}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-blue-400">رحلات: {driver.total_trips}</span>
                        <span className="text-green-400">أرباح: {formatCurrency(driver.total_earnings)}</span>
                        <span className="text-orange-400">عمولة: {formatCurrency(driver.commission_deducted)}</span>
                      </div>
                      {driver.last_trip_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          آخر رحلة: {formatDate(driver.last_trip_date)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-purple-400">
                        {formatCurrency(driver.net_balance)}
                      </div>
                      <Badge 
                        variant={driver.account_status === 'active' ? 'default' : 'destructive'}
                        className="mb-2"
                      >
                        {driver.account_status === 'active' ? 'نشط' : 'معلق'}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowPaymentDialog(true);
                        }}
                        disabled={driver.net_balance <= 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        دفع
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-cairo">سجل المعاملات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-400">السائق: {transaction.driver_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'earning' ? 'text-green-400' : 
                        transaction.type === 'commission' ? 'text-red-400' :
                        transaction.type === 'payment' ? 'text-blue-400' : 'text-yellow-400'
                      }`}>
                        {transaction.type === 'commission' || transaction.type === 'payment' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant={
                        transaction.type === 'earning' ? 'default' : 
                        transaction.type === 'commission' ? 'destructive' :
                        transaction.type === 'payment' ? 'secondary' : 'outline'
                      }>
                        {transaction.type === 'earning' && 'أرباح'}
                        {transaction.type === 'commission' && 'عمولة'}
                        {transaction.type === 'payment' && 'دفعة'}
                        {transaction.type === 'adjustment' && 'تعديل'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة الدفع */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="font-cairo">
              دفع للسائق: {selectedDriver?.driver_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">المبلغ (ل.س)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                className="bg-slate-700 border-slate-600"
                max={selectedDriver?.net_balance}
              />
              <p className="text-sm text-gray-400 mt-1">
                الرصيد المتاح: {selectedDriver ? formatCurrency(selectedDriver.net_balance) : '0 ل.س'}
              </p>
            </div>
            <div>
              <Label htmlFor="description">وصف الدفعة</Label>
              <Input
                id="description"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="وصف اختياري"
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={processPayment} className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                تأكيد الدفع
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                className="border-slate-600"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverAccountingManager;
