import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalTrips: number;
  totalRevenue: number;
  activeDrivers: number;
  activeCustomers: number;
  averageRating: number;
  completionRate: number;
}

export interface TripStats {
  daily: { date: string; count: number; revenue: number }[];
  weekly: { week: string; count: number; revenue: number }[];
  monthly: { month: string; count: number; revenue: number }[];
}

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  usersByRole: {
    customers: number;
    drivers: number;
    admins: number;
  };
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  revenueByPaymentMethod: {
    cash: number;
    card: number;
    wallet: number;
  };
}

export const analyticsService = {
  // إحصائيات لوحة التحكم الرئيسية
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        tripsResult,
        revenueResult,
        driversResult,
        customersResult,
        ratingsResult
      ] = await Promise.all([
        // إجمالي الرحلات
        supabase
          .from('trips')
          .select('*', { count: 'exact', head: true }),
        
        // إجمالي الإيرادات
        supabase
          .from('trips')
          .select('price')
          .eq('status', 'completed'),
        
        // السائقين النشطين
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'driver')
          .eq('is_active', true),
        
        // العملاء النشطين
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer')
          .eq('is_active', true),
        
        // متوسط التقييمات
        supabase
          .from('ratings')
          .select('rating')
      ]);

      const totalTrips = tripsResult.count || 0;
      const totalRevenue = revenueResult.data?.reduce((sum, trip) => sum + trip.price, 0) || 0;
      const activeDrivers = driversResult.count || 0;
      const activeCustomers = customersResult.count || 0;
      
      const ratings = ratingsResult.data || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // حساب معدل الإكمال
      const { count: completedTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const completionRate = totalTrips > 0 ? ((completedTrips || 0) / totalTrips) * 100 : 0;

      return {
        totalTrips,
        totalRevenue,
        activeDrivers,
        activeCustomers,
        averageRating: Math.round(averageRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalTrips: 0,
        totalRevenue: 0,
        activeDrivers: 0,
        activeCustomers: 0,
        averageRating: 0,
        completionRate: 0
      };
    }
  },

  // إحصائيات الرحلات
  async getTripStats(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<TripStats[keyof TripStats]> {
    try {
      let dateFormat = '';
      let groupBy = '';
      
      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          groupBy = 'DATE(created_at)';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          groupBy = 'DATE_TRUNC(\'week\', created_at)';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          groupBy = 'DATE_TRUNC(\'month\', created_at)';
          break;
      }

      const { data, error } = await supabase
        .rpc('get_trip_stats_by_period', {
          period_type: period,
          days_back: period === 'daily' ? 30 : period === 'weekly' ? 84 : 365
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trip stats:', error);
      return [];
    }
  },

  // إحصائيات المستخدمين
  async getUserStats(): Promise<UserStats> {
    try {
      const [
        totalUsersResult,
        newUsersResult,
        activeUsersResult,
        customerCountResult,
        driverCountResult,
        adminCountResult
      ] = await Promise.all([
        // إجمالي المستخدمين
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        
        // المستخدمين الجدد هذا الشهر
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // المستخدمين النشطين
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // عدد العملاء
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer'),
        
        // عدد السائقين
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'driver'),
        
        // عدد المديرين
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')
      ]);

      return {
        totalUsers: totalUsersResult.count || 0,
        newUsersThisMonth: newUsersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        usersByRole: {
          customers: customerCountResult.count || 0,
          drivers: driverCountResult.count || 0,
          admins: adminCountResult.count || 0
        }
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalUsers: 0,
        newUsersThisMonth: 0,
        activeUsers: 0,
        usersByRole: {
          customers: 0,
          drivers: 0,
          admins: 0
        }
      };
    }
  },

  // إحصائيات الإيرادات
  async getRevenueStats(): Promise<RevenueStats> {
    try {
      const [
        totalRevenueResult,
        monthlyRevenueResult,
        paymentMethodsResult
      ] = await Promise.all([
        // إجمالي الإيرادات
        supabase
          .from('trips')
          .select('price')
          .eq('status', 'completed'),
        
        // الإيرادات الشهرية
        supabase
          .from('trips')
          .select('price')
          .eq('status', 'completed')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // الإيرادات حسب طريقة الدفع
        supabase
          .from('payment_transactions')
          .select('amount, method')
          .eq('status', 'completed')
      ]);

      const totalRevenue = totalRevenueResult.data?.reduce((sum, trip) => sum + trip.price, 0) || 0;
      const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, trip) => sum + trip.price, 0) || 0;
      const totalTrips = totalRevenueResult.data?.length || 0;
      const averageOrderValue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

      // تجميع الإيرادات حسب طريقة الدفع
      const paymentMethods = paymentMethodsResult.data || [];
      const revenueByPaymentMethod = {
        cash: 0,
        card: 0,
        wallet: 0
      };

      paymentMethods.forEach(payment => {
        if (payment.method in revenueByPaymentMethod) {
          revenueByPaymentMethod[payment.method as keyof typeof revenueByPaymentMethod] += payment.amount;
        }
      });

      return {
        totalRevenue,
        monthlyRevenue,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        revenueByPaymentMethod
      };
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageOrderValue: 0,
        revenueByPaymentMethod: {
          cash: 0,
          card: 0,
          wallet: 0
        }
      };
    }
  },

  // تقرير الأداء للسائق
  async getDriverPerformance(driverId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const [
        tripsResult,
        ratingsResult,
        revenueResult
      ] = await Promise.all([
        // الرحلات
        supabase
          .from('trips')
          .select('*')
          .eq('driver_id', driverId)
          .gte('created_at', startDate.toISOString()),
        
        // التقييمات
        supabase
          .from('ratings')
          .select('rating')
          .eq('rated_id', driverId)
          .gte('created_at', startDate.toISOString()),
        
        // الإيرادات
        supabase
          .from('trips')
          .select('price')
          .eq('driver_id', driverId)
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString())
      ]);

      const trips = tripsResult.data || [];
      const ratings = ratingsResult.data || [];
      const revenue = revenueResult.data?.reduce((sum, trip) => sum + trip.price, 0) || 0;

      const completedTrips = trips.filter(trip => trip.status === 'completed').length;
      const cancelledTrips = trips.filter(trip => trip.status === 'cancelled').length;
      const completionRate = trips.length > 0 ? (completedTrips / trips.length) * 100 : 0;
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

      return {
        totalTrips: trips.length,
        completedTrips,
        cancelledTrips,
        completionRate: Math.round(completionRate * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue: revenue,
        averageRevenuePerTrip: completedTrips > 0 ? revenue / completedTrips : 0
      };
    } catch (error) {
      console.error('Error fetching driver performance:', error);
      return null;
    }
  }
};
