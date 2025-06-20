import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Activity,
  CheckCircle
} from 'lucide-react';
import { analyticsService, DashboardStats as StatsType } from '@/services/analyticsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardStatsProps {
  className?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ className }) => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [tripStats, setTripStats] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashboardData, tripData, revenueData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getTripStats('daily'),
        analyticsService.getRevenueStats()
      ]);

      setStats(dashboardData);
      setTripStats(tripData);
      setRevenueStats(revenueData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600'
    };

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-tajawal">{title}</p>
              <p className="text-2xl font-bold text-gray-900 font-cairo mt-1">{value}</p>
              {trend && trendValue && (
                <div className={`flex items-center mt-2 text-sm ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 ml-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 ml-1" />
                  )}
                  <span className="font-tajawal">{trendValue}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 font-tajawal">خطأ في تحميل البيانات</p>
      </div>
    );
  }

  const pieData = revenueStats ? [
    { name: 'نقداً', value: revenueStats.revenueByPaymentMethod.cash, color: '#10B981' },
    { name: 'بطاقة', value: revenueStats.revenueByPaymentMethod.card, color: '#3B82F6' },
    { name: 'محفظة', value: revenueStats.revenueByPaymentMethod.wallet, color: '#8B5CF6' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* البطاقات الإحصائية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الرحلات"
          value={stats.totalTrips.toLocaleString()}
          icon={Car}
          color="blue"
        />
        
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        
        <StatCard
          title="السائقين النشطين"
          value={stats.activeDrivers}
          icon={Users}
          color="purple"
        />
        
        <StatCard
          title="متوسط التقييم"
          value={`${stats.averageRating}/5`}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* الإحصائيات التفصيلية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* معدل الإكمال */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center font-cairo">
              <CheckCircle className="w-5 h-5 ml-2" />
              معدل إكمال الرحلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600 font-cairo">
                {stats.completionRate}%
              </div>
              <Badge variant={stats.completionRate >= 80 ? "default" : "destructive"}>
                {stats.completionRate >= 80 ? "ممتاز" : "يحتاج تحسين"}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* العملاء النشطين */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center font-cairo">
              <Activity className="w-5 h-5 ml-2" />
              العملاء النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 font-cairo">
              {stats.activeCustomers}
            </div>
            <p className="text-sm text-gray-600 mt-2 font-tajawal">
              عميل نشط هذا الشهر
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trips" className="font-tajawal">الرحلات</TabsTrigger>
          <TabsTrigger value="revenue" className="font-tajawal">الإيرادات</TabsTrigger>
          <TabsTrigger value="payments" className="font-tajawal">طرق الدفع</TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">الرحلات اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tripStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="عدد الرحلات"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">الإيرادات اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tripStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar 
                    dataKey="revenue" 
                    fill="#10B981"
                    name="الإيرادات"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">توزيع طرق الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-tajawal">لا توجد بيانات دفع متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardStats;
