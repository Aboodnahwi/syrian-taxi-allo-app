
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
  Wallet
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAccountingData();
  }, [selectedPeriod]);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      
      // حساب التواريخ حسب الفترة المحددة
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
          *
        `)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      if (tripsError) {
        console.error('خطأ في جلب الرحلات:', tripsError);
        throw tripsError;
      }

      // جلب معلومات الزبائن والسائقين
      const customerIds = [...new Set(trips?.map(trip => trip.customer_id).filter(Boolean))];
      const driverIds = [...new Set(trips?.map(trip => trip.driver_id).filter(Boolean))];

      const { data: customers } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', customerIds);

      const { data: drivers } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', driverIds);

      // إنشاء خرائط للأسماء
      const customerMap = new Map(customers?.map(c => [c.id, c.name]) || []);
      const driverMap = new Map(drivers?.map(d => [d.id, d.name]) || []);

      // حساب الإحصائيات العامة
      const totalRevenue = trips?.reduce((sum, trip) => sum + (trip.price || 0), 0) || 0;
      const siteCommissionRate = 0.10; // 10% عمولة الموقع
      const totalCommissions = totalRevenue * siteCommissionRate;
      const totalDriverEarnings = totalRevenue - totalCommissions;
      
      // حساب أرصدة السائقين
      const driverBalancesMap = new Map();
      trips?.forEach(trip => {
        if (trip.driver_id) {
          const driverId = trip.driver_id;
          const driverName = driverMap.get(driverId) || 'سائق غير معروف';
          const tripEarnings = (trip.price || 0) * 0.9; // 90% للسائق
          
          if (driverBalancesMap.has(driverId)) {
            const existing = driverBalancesMap.get(driverId);
            existing.totalEarnings += tripEarnings;
            existing.tripsCount += 1;
          } else {
            driverBalancesMap.set(driverId, {
              driver_id: driverId,
              driver_name: driverName,
              totalEarnings: tripEarnings,
              tripsCount: 1,
              lastTrip: trip.completed_at
            });
          }
        }
      });

      // حساب مدفوعات الزبائن
      const customerPaymentsMap = new Map();
      trips?.forEach(trip => {
        if (trip.customer_id) {
          const customerId = trip.customer_id;
          const customerName = customerMap.get(customerId) || 'زبون غير معروف';
          
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

      // تحديث الحالة
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
        const driverName = driverMap.get(trip.driver_id) || 'غير محدد';
        const customerName = customerMap.get(trip.customer_id) || 'غير محدد';
        
        transactionsList.push({
          id: `trip-${trip.id}`,
          amount: trip.price || 0,
          type: 'credit',
          description: `رحلة من ${trip.from_location} إلى ${trip.to_location}`,
          created_at: trip.completed_at || trip.created_at,
          user_id: trip.driver_id,
          trip_id: trip.id,
          driver_name: driverName,
          customer_name: customerName
        });
      });

      setTransactions(transactionsList);

    } catch (error: any) {
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesType;
  });

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
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {driverBalances.map((driver) => (
                  <div key={driver.driver_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{driver.driver_name}</p>
                      <p className="text-sm text-gray-600">عدد الرحلات: {driver.tripsCount}</p>
                      <p className="text-xs text-gray-500">آخر رحلة: {formatDate(driver.lastTrip)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(driver.totalEarnings)}</p>
                      <Badge variant="default">متاح للسحب</Badge>
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
    </div>
  );
};

export default ComprehensiveAccountingManager;
