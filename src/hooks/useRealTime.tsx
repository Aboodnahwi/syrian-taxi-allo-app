
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRealTimeTrips = (userRole: string, userId?: string) => {
  const [trips, setTrips] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // جلب الرحلات الحالية
    const fetchTrips = async () => {
      let query = supabase.from('trips').select(`
        *,
        customer:profiles!trips_customer_id_fkey(name, phone),
        driver:profiles!trips_driver_id_fkey(name, phone)
      `);

      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'driver') {
        query = query.eq('driver_id', userId);
      }

      const { data } = await query.order('created_at', { ascending: false });
      if (data) setTrips(data);
    };

    fetchTrips();

    // الاستماع للتحديثات الحية
    const channel = supabase
      .channel('trips_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        (payload) => {
          console.log('تحديث الرحلات:', payload);
          
          if (payload.eventType === 'INSERT') {
            // إشعار بطلب جديد للسائقين
            if (userRole === 'driver') {
              toast({
                title: "طلب رحلة جديد",
                description: "يوجد طلب رحلة جديد في منطقتك",
                className: "bg-blue-50 border-blue-200 text-blue-800"
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // إشعارات تحديث حالة الرحلة
            const newTrip = payload.new as any;
            if (newTrip.status === 'accepted' && userRole === 'customer') {
              toast({
                title: "تم قبول طلبك",
                description: "السائق في الطريق إليك",
                className: "bg-green-50 border-green-200 text-green-800"
              });
            }
          }
          
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole, toast]);

  return trips;
};

export const useRealTimeDrivers = () => {
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    // جلب السائقين المتاحين
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles!drivers_user_id_fkey(name, phone)
        `)
        .eq('is_online', true);
      
      if (data) setDrivers(data);
    };

    fetchDrivers();

    // الاستماع لتحديثات السائقين
    const channel = supabase
      .channel('drivers_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        () => {
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return drivers;
};

export const useRealTimeNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // جلب الإشعارات
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setNotifications(data);
    };

    fetchNotifications();

    // الاستماع للإشعارات الجديدة
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as any, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  [userId]);

  return notifications;
};
