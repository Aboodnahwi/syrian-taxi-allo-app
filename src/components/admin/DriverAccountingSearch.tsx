
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  User, 
  Car, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  FileText,
  Download,
  Eye,
  Calculator,
  Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  license_plate: string;
  rating: number;
  total_trips: number;
  is_online: boolean;
  created_at: string;
}

interface DriverTrip {
  id: string;
  from_location: string;
  to_location: string;
  price: number;
  distance_km: number;
  status: string;
  created_at: string;
  completed_at: string;
  customer_rating: number;
  driver_rating: number;
  customer_name: string;
  vehicle_type: string;
}

interface DriverAccountingSummary {
  totalEarnings: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  averageRating: number;
  totalCommission: number;
  netEarnings: number;
  averageTripValue: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
}

const DriverAccountingSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [selectedDriver, setSelectedDriver] = useState<DriverInfo | null>(null);
  const [driverTrips, setDriverTrips] = useState<DriverTrip[]>([]);
  const [accountingSummary, setAccountingSummary] = useState<DriverAccountingSummary | null>(null);
  const [searchResults, setSearchResults] = useState<DriverInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  
  const { toast } = useToast();

  const searchDrivers = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم السائق أو رقم الهاتف",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          created_at,
          drivers (
            vehicle_type,
            license_plate,
            rating,
            total_trips,
            is_online
          )
        `)
        .eq('role', 'driver');

      if (searchType === 'name') {
        query = query.ilike('name', `%${searchQuery}%`);
      } else {
        query = query.ilike('phone', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const formattedResults: DriverInfo[] = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        vehicle_type: profile.drivers?.[0]?.vehicle_type || 'غير محدد',
        license_plate: profile.drivers?.[0]?.license_plate || 'غير محدد',
        rating: profile.drivers?.[0]?.rating || 0,
        total_trips: profile.drivers?.[0]?.total_trips || 0,
        is_online: profile.drivers?.[0]?.is_online || false,
        created_at: profile.created_at
      }));

      setSearchResults(formattedResults);

      if (formattedResults.length === 0) {
        toast({
          title: "لا توجد نتائج",
          description: "لم يتم العثور على سائقين بالبيانات المدخلة",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('خطأ في البحث:', error);
      toast({
        title: "خطأ في البحث",
        description: "تعذر البحث عن السائقين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectDriver = async (driver: DriverInfo) => {
    setSelectedDriver(driver);
    await fetchDriverAccountingData(driver.id);
  };

  const fetchDriverAccountingData = async (driverId: string) => {
    try {
      setLoading(true);

      // تحديد النطاق الزمني
      const now = new Date();
      let startDate = new Date();
      
      switch(dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
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
        default:
          startDate = new Date('2020-01-01'); // كل الوقت
      }

      // جلب رحلات السائق
      let tripsQuery = supabase
        .from('trips')
        .select(`
          id,
          from_location,
          to_location,
          price,
          distance_km,
          status,
          created_at,
          completed_at,
          customer_rating,
          driver_rating,
          vehicle_type,
          profiles!trips_customer_id_fkey (
            name
          )
        `)
        .eq('driver_id', driverId);

      if (dateRange !== 'all') {
        tripsQuery = tripsQuery.gte('created_at', startDate.toISOString());
      }

      const { data: trips, error: tripsError } = await tripsQuery.order('created_at', { ascending: false });

      if (tripsError) {
        throw tripsError;
      }

      // تنسيق بيانات الرحلات
      const formattedTrips: DriverTrip[] = (trips || []).map(trip => ({
        id: trip.id,
        from_location: trip.from_location,
        to_location: trip.to_location,
        price: trip.price,
        distance_km: trip.distance_km || 0,
        status: trip.status,
        created_at: trip.created_at,
        completed_at: trip.completed_at || '',
        customer_rating: trip.customer_rating || 0,
        driver_rating: trip.driver_rating || 0,
        customer_name: trip.profiles?.name || 'غير معروف',
        vehicle_type: trip.vehicle_type
      }));

      setDriverTrips(formattedTrips);

      // حساب الإحصائيات المحاسبية
      const completedTrips = formattedTrips.filter(trip => trip.status === 'completed');
      const cancelledTrips = formattedTrips.filter(trip => trip.status === 'cancelled');
      
      const totalEarnings = completedTrips.reduce((sum, trip) => sum + trip.price, 0);
      const totalCommission = totalEarnings * 0.1; // 10% عمولة
      const netEarnings = totalEarnings - totalCommission;
      
      const ratingsSum = completedTrips.reduce((sum, trip) => sum + (trip.customer_rating || 0), 0);
      const averageRating = completedTrips.length > 0 ? ratingsSum / completedTrips.length : 0;

      // حساب الأرباح حسب الفترات
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - 7);
      
      const monthStart = new Date();
      monthStart.setMonth(now.getMonth() - 1);

      const todayTrips = completedTrips.filter(trip => 
        new Date(trip.completed_at) >= today
      );
      
      const weekTrips = completedTrips.filter(trip => 
        new Date(trip.completed_at) >= weekStart
      );
      
      const monthTrips = completedTrips.filter(trip => 
        new Date(trip.completed_at) >= monthStart
      );

      const todayEarnings = todayTrips.reduce((sum, trip) => sum + trip.price, 0);
      const weekEarnings = weekTrips.reduce((sum, trip) => sum + trip.price, 0);
      const monthEarnings = monthTrips.reduce((sum, trip) => sum + trip.price, 0);

      setAccountingSummary({
        totalEarnings,
        totalTrips: formattedTrips.length,
        completedTrips: completedTrips.length,
        cancelledTrips: cancelledTrips.length,
        averageRating,
        totalCommission,
        netEarnings,
        averageTripValue: completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0,
        todayEarnings: todayEarnings * 0.9,
        weekEarnings: weekEarnings * 0.9,
        monthEarnings: monthEarnings * 0.9
      });

    } catch (error) {
      console.error('خطأ في جلب بيانات المحاسبة:', error);
      toast({
        title: "خطأ",
        description: "تعذر جلب بيانات محاسبة السائق",
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
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { label: 'مكتملة', variant: 'default' as const },
      'cancelled': { label: 'ملغية', variant: 'destructive' as const },
      'pending': { label: 'في الانتظار', variant: 'secondary' as const },
      'accepted': { label: 'مقبولة', variant: 'default' as const },
      'started': { label: 'بدأت', variant: 'default' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const exportDriverReport = () => {
    if (!selectedDriver || !accountingSummary) return;
    
    // إنشاء تقرير نصي بسيط
    const reportData = `
تقرير محاسبة السائق
===================
الاسم: ${selectedDriver.name}
الهاتف: ${selectedDriver.phone}
رقم اللوحة: ${selectedDriver.license_plate}
نوع المركبة: ${selectedDriver.vehicle_type}

الإحصائيات:
===========
إجمالي الأرباح: ${formatCurrency(accountingSummary.totalEarnings)}
صافي الأرباح: ${formatCurrency(accountingSummary.netEarnings)}
العمولة: ${formatCurrency(accountingSummary.totalCommission)}
عدد الرحلات: ${accountingSummary.totalTrips}
الرحلات المكتملة: ${accountingSummary.completedTrips}
متوسط التقييم: ${accountingSummary.averageRating.toFixed(1)}

الأرباح حسب الفترة:
==================
اليوم: ${formatCurrency(accountingSummary.todayEarnings)}
هذا الأسبوع: ${formatCurrency(accountingSummary.weekEarnings)}
هذا الشهر: ${formatCurrency(accountingSummary.monthEarnings)}
    `;

    const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver-report-${selectedDriver.name}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* قسم البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            محاسبة السائقين المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="ادخل اسم السائق أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchDrivers()}
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">البحث بالاسم</SelectItem>
                <SelectItem value="phone">البحث بالهاتف</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={searchDrivers} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              بحث
            </Button>
          </div>

          {/* نتائج البحث */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h3 className="font-semibold">نتائج البحث:</h3>
              {searchResults.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => selectDriver(driver)}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{driver.license_plate}</p>
                    <Badge variant={driver.is_online ? 'default' : 'secondary'}>
                      {driver.is_online ? 'متصل' : 'غير متصل'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* تفاصيل السائق المحدد */}
      {selectedDriver && (
        <>
          {/* معلومات السائق */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات السائق
                </span>
                <div className="flex gap-2">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الوقت</SelectItem>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="week">هذا الأسبوع</SelectItem>
                      <SelectItem value="month">هذا الشهر</SelectItem>
                      <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                      <SelectItem value="year">هذا العام</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => fetchDriverAccountingData(selectedDriver.id)}
                    disabled={loading}
                    variant="outline"
                  >
                    تحديث
                  </Button>
                  <Button onClick={exportDriverReport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    تصدير التقرير
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <User className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-bold text-lg">{selectedDriver.name}</p>
                  <p className="text-sm text-gray-600">{selectedDriver.phone}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Car className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-bold">{selectedDriver.license_plate}</p>
                  <p className="text-sm text-gray-600">{selectedDriver.vehicle_type}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="font-bold">{selectedDriver.rating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">التقييم</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-bold">{selectedDriver.total_trips}</p>
                  <p className="text-sm text-gray-600">إجمالي الرحلات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الإحصائيات المحاسبية */}
          {accountingSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  الإحصائيات المحاسبية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-xl text-green-600">
                      {formatCurrency(accountingSummary.netEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">صافي الأرباح</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-bold text-xl text-blue-600">{accountingSummary.completedTrips}</p>
                    <p className="text-sm text-gray-600">رحلات مكتملة</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="font-bold text-xl text-orange-600">
                      {formatCurrency(accountingSummary.averageTripValue)}
                    </p>
                    <p className="text-sm text-gray-600">متوسط قيمة الرحلة</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Clock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="font-bold text-xl text-red-600">{accountingSummary.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">متوسط التقييم</p>
                  </div>
                </div>

                {/* الأرباح حسب الفترات */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(accountingSummary.todayEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">أرباح اليوم</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(accountingSummary.weekEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">أرباح الأسبوع</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(accountingSummary.monthEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">أرباح الشهر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تفاصيل الرحلات */}
          {driverTrips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  تفاصيل الرحلات ({driverTrips.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {driverTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {trip.from_location} → {trip.to_location}
                        </p>
                        <p className="text-sm text-gray-600">
                          الزبون: {trip.customer_name} | المسافة: {trip.distance_km} كم
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(trip.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(trip.price)}
                        </p>
                        {getStatusBadge(trip.status)}
                        {trip.customer_rating > 0 && (
                          <p className="text-sm text-yellow-600 mt-1">
                            ⭐ {trip.customer_rating}/5
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      )}
    </div>
  );
};

export default DriverAccountingSearch;
