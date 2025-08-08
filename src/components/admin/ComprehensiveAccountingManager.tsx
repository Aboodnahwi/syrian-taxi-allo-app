
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Car, 
  Calendar,
  Download,
  Search,
  Filter,
  Eye,
  CreditCard,
  Wallet,
  UserCheck,
  Receipt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
  user_id: string;
  trip_id?: string;
  driver_name?: string;
  customer_name?: string;
}

interface AccountingSummary {
  totalRevenue: number;
  totalCommissions: number;
  totalDriverEarnings: number;
  totalCustomerPayments: number;
  activeDrivers: number;
  totalTrips: number;
}

interface DriverDetails {
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  totalEarnings: number;
  totalCommissions: number;
  tripsCount: number;
  lastTrip: string;
  trips: any[];
}

const ComprehensiveAccountingManager = () => {
  const [summary, setSummary] = useState<AccountingSummary>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalDriverEarnings: 0,
    totalCustomerPayments: 0,
    activeDrivers: 0,
    totalTrips: 0
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [driverBalances, setDriverBalances] = useState<any[]>([]);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAccountingData();
  }, [selectedPeriod]);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const startDate = new Date();
      
      switch(selectedPeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // جلب الرحلات المكتملة
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          customer:profiles!trips_customer_id_fkey(name, phone),
          driver:drivers!trips_driver_id_fkey(
            id,
            user_id,
            profiles:profiles!drivers_user_id_fkey(name, phone)
          )
        `)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      if (tripsError) {
        console.error('خطأ في جلب الرحلات:', tripsError);
        throw tripsError;
      }

      const totalRevenue = trips?.reduce((sum, trip) => sum + (trip.price || 0), 0) || 0;
      const siteCommissionRate = 0.10;
      const totalCommissions = totalRevenue * siteCommissionRate;
      const totalDriverEarnings = totalRevenue - totalCommissions;
      
      // حساب أرصدة السائقين
      const driverBalancesMap = new Map();
      trips?.forEach(trip => {
        if (trip.driver_id && trip.driver) {
          const driverId = trip.driver_id;
          const driverName = trip.driver.profiles?.name || 'سائق غير معروف';
          const driverPhone = trip.driver.profiles?.phone || '';
          const tripEarnings = (trip.price || 0) * 0.9;
          const tripCommission = (trip.price || 0) * 0.1;
          
          if (driverBalancesMap.has(driverId)) {
            const existing = driverBalancesMap.get(driverId);
            existing.totalEarnings += tripEarnings;
            existing.totalCommissions += tripCommission;
            existing.tripsCount += 1;
            existing.trips.push(trip);
          } else {
            driverBalancesMap.set(driverId, {
              driver_id: driverId,
              driver_name: driverName,
              driver_phone: driverPhone,
              totalEarnings: tripEarnings,
              totalCommissions: tripCommission,
              tripsCount: 1,
              lastTrip: trip.completed_at,
              trips: [trip]
            });
          }
        }
      });

      // حساب مدفوعات الزبائن
      const customerPaymentsMap = new Map();
      trips?.forEach(trip => {
        if (trip.customer_id && trip.customer) {
          const customerId = trip.customer_id;
          const customerName = trip.customer?.name || 'زبون غير معروف';
          
          if (customerPaymentsMap.has(customerId)) {
            const existing = customerPaymentsMap.get(customerId);
            existing.totalPaid += trip.price || 0;
            existing.tripsCount += 1;
          } else {
            customerPaymentsMap.set(customerId, {
              customer_id: customerId,
              customer_name: customerName,
              totalPaid: trip.price || 0,
              tripsCount: 1,
              lastTrip: trip.completed_at
            });
          }
        }
      });

      setSummary({
        totalRevenue,
        totalCommissions,
        totalDriverEarnings,
        totalCustomerPayments: totalRevenue,
        activeDrivers: driverBalancesMap.size,
        totalTrips: trips?.length || 0
      });

      setDriverBalances(Array.from(driverBalancesMap.values()));
      setCustomerPayments(Array.from(customerPaymentsMap.values()));

      // إنشاء قائمة المعاملات
      const transactionsList: Transaction[] = [];
      trips?.forEach(trip => {
        if (trip.driver && trip.customer) {
          transactionsList.push({
            id: `trip-${trip.id}`,
            amount: trip.price || 0,
            type: 'credit',
            description: `رحلة من ${trip.from_location} إلى ${trip.to_location}`,
            created_at: trip.completed_at || trip.created_at,
            user_id: trip.driver_id,
            trip_id: trip.id,
            driver_name: trip.driver.profiles?.name,
            customer_name: trip.customer?.name
          });
        }
      });

      setTransactions(transactionsList);

    } catch (error) {
      console.error('خطأ في جلب بيانات المحاسبة:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "تعذر جلب بيانات المحاسبة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewDriverDetails = (driver: any) => {
    setSelectedDriver(driver);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const filteredDrivers = driverBalances.filter(driver => 
    driver.driver_name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.driver_phone.includes(driverSearchTerm)
  );

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ل.س`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات المحاسبة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">المحاسبة الشاملة</h2>
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAccountingData}>
            <Download className="w-4 h-4 mr-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">عمولة الموقع</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">أرباح السائقين</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalDriverEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">السائقون النشطون</p>
                <p className="text-2xl font-bold text-purple-600">{summary.activeDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">إجمالي الرحلات</p>
                <p className="text-2xl font-bold text-red-600">{summary.totalTrips}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">متوسط الرحلة</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(summary.totalTrips > 0 ? summary.totalRevenue / summary.totalTrips : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="drivers">أرصدة السائقين</TabsTrigger>
          <TabsTrigger value="customers">مدفوعات الزبائن</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="البحث في المعاملات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المعاملات</SelectItem>
                    <SelectItem value="credit">وارد</SelectItem>
                    <SelectItem value="debit">صادر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        السائق: {transaction.driver_name} | الزبون: {transaction.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                        {transaction.type === 'credit' ? 'وارد' : 'صادر'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أرصدة السائقين</CardTitle>
              <div className="flex gap-4">
                <Input
                  placeholder="البحث عن سائق..."
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredDrivers.map((driver) => (
                  <div key={driver.driver_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{driver.driver_name}</p>
                      <p className="text-sm text-gray-600">الهاتف: {driver.driver_phone}</p>
                      <p className="text-sm text-gray-600">عدد الرحلات: {driver.tripsCount}</p>
                      <p className="text-xs text-gray-500">آخر رحلة: {formatDate(driver.lastTrip)}</p>
                    </div>
                    <div className="text-right flex flex-col gap-2">
                      <div>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(driver.totalEarnings)}</p>
                        <p className="text-sm text-red-600">عمولة الموقع: {formatCurrency(driver.totalCommissions)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => viewDriverDetails(driver)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مدفوعات الزبائن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customerPayments.map((customer) => (
                  <div key={customer.customer_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{customer.customer_name}</p>
                      <p className="text-sm text-gray-600">عدد الرحلات: {customer.tripsCount}</p>
                      <p className="text-xs text-gray-500">آخر رحلة: {formatDate(customer.lastTrip)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(customer.totalPaid)}</p>
                      <Badge variant="secondary">إجمالي المدفوعات</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ملخص الفترة المحددة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>إجمالي الرحلات:</span>
                  <span className="font-bold">{summary.totalTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي الإيرادات:</span>
                  <span className="font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>عمولة الموقع (10%):</span>
                  <span className="font-bold text-blue-600">{formatCurrency(summary.totalCommissions)}</span>
                </div>
                <div className="flex justify-between">
                  <span>أرباح السائقين (90%):</span>
                  <span className="font-bold text-orange-600">{formatCurrency(summary.totalDriverEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط قيمة الرحلة:</span>
                  <span className="font-bold">{formatCurrency(summary.totalTrips > 0 ? summary.totalRevenue / summary.totalTrips : 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحليل الأداء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>عدد السائقين النشطين:</span>
                  <span className="font-bold">{summary.activeDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط الرحلات لكل سائق:</span>
                  <span className="font-bold">
                    {summary.activeDrivers > 0 ? Math.round(summary.totalTrips / summary.activeDrivers) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط أرباح السائق:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(summary.activeDrivers > 0 ? summary.totalDriverEarnings / summary.activeDrivers : 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* نافذة تفاصيل السائق */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>تفاصيل حساب السائق: {selectedDriver.driver_name}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedDriver(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ملخص الحساب */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">إجمالي الأرباح</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedDriver.totalEarnings)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Receipt className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">عمولة الموقع</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedDriver.totalCommissions)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">عدد الرحلات</p>
                    <p className="text-xl font-bold text-blue-600">{selectedDriver.tripsCount}</p>
                  </CardContent>
                </Card>
              </div>

              {/* معلومات السائق */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">معلومات السائق:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">الاسم: </span>
                    <span>{selectedDriver.driver_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold">الهاتف: </span>
                    <span>{selectedDriver.driver_phone}</span>
                  </div>
                  <div>
                    <span className="font-semibold">متوسط الربح لكل رحلة: </span>
                    <span>{formatCurrency(selectedDriver.totalEarnings / selectedDriver.tripsCount)}</span>
                  </div>
                  <div>
                    <span className="font-semibold">آخر رحلة: </span>
                    <span>{formatDate(selectedDriver.lastTrip)}</span>
                  </div>
                </div>
              </div>

              {/* تفاصيل الرحلات */}
              <div>
                <h4 className="font-bold mb-4">تفاصيل الرحلات:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedDriver.trips.map((trip: any) => (
                    <div key={trip.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">من {trip.from_location} إلى {trip.to_location}</p>
                          <p className="text-sm text-gray-600">
                            الزبون: {trip.customer?.name} | المسافة: {trip.distance_km} كم
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(trip.completed_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(trip.price)}</p>
                          <p className="text-sm text-green-600">ربح السائق: {formatCurrency(trip.price * 0.9)}</p>
                          <p className="text-sm text-red-600">عمولة الموقع: {formatCurrency(trip.price * 0.1)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveAccountingManager;
