
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RideRequest {
  id: string;
  customer_id: string;
  from_location: string;
  to_location: string;
  from_coordinates: [number, number];
  to_coordinates: [number, number];
  vehicle_type: string;
  price: number;
  distance_km: number;
  estimated_duration: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  urgent: boolean;
}

export const useRealTimeRideRequests = (driverLocation: [number, number] | null) => {
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRideRequests = async () => {
      try {
        console.log('جلب طلبات الرحلات المتاحة...');
        
        // جلب الطلبات المتاحة مع معلومات الزبائن - بدون تصفية حسب موقع السائق
        const { data: trips, error } = await supabase
          .from('trips')
          .select(`
            *,
            profiles!trips_customer_id_fkey (
              name,
              phone
            )
          `)
          .eq('status', 'pending')
          .is('driver_id', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('خطأ في جلب طلبات الرحلات:', error);
          setRideRequests([]);
          setLoading(false);
          return;
        }

        console.log('تم جلب الرحلات:', trips?.length || 0);

        // تحويل البيانات
        const processedRequests: RideRequest[] = (trips || []).map((trip: any) => {
          // تحويل الإحداثيات
          const fromCoords = parseCoordinates(trip.from_coordinates);
          const toCoords = parseCoordinates(trip.to_coordinates);

          if (!fromCoords || !toCoords) {
            console.warn('إحداثيات غير صالحة للرحلة:', trip.id);
            return null;
          }

          // حساب المدة المتوقعة بناءً على المسافة
          const estimatedDuration = Math.ceil((trip.distance_km || 5) * 1.5);

          // تحديد إذا كان الطلب عاجل بناءً على الوقت (آخر 10 دقائق)
          const isUrgent = new Date().getTime() - new Date(trip.created_at).getTime() > 10 * 60 * 1000;

          return {
            id: trip.id,
            customer_id: trip.customer_id,
            from_location: trip.from_location || 'غير محدد',
            to_location: trip.to_location || 'غير محدد',
            from_coordinates: fromCoords,
            to_coordinates: toCoords,
            vehicle_type: trip.vehicle_type || 'regular',
            price: trip.price || 0,
            distance_km: trip.distance_km || 0,
            estimated_duration: estimatedDuration,
            customer_name: trip.profiles?.name || 'زبون',
            customer_phone: trip.profiles?.phone || '',
            created_at: trip.created_at,
            urgent: isUrgent,
          };
        }).filter(Boolean) as RideRequest[];

        console.log('تم معالجة طلبات الرحلات:', processedRequests.length);

        // ترتيب حسب الوقت (الأحدث أولاً)
        processedRequests.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setRideRequests(processedRequests);
      } catch (error) {
        console.error('خطأ في fetchRideRequests:', error);
        setRideRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRideRequests();

    // الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel('ride-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: 'status=eq.pending'
        },
        (payload) => {
          console.log('تحديث جديد في طلبات الرحلات:', payload);
          fetchRideRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]); // إزالة driverLocation من dependencies

  return { rideRequests, loading };
};

// مساعد لتحويل الإحداثيات
const parseCoordinates = (coords: unknown): [number, number] | null => {
  if (!coords) return null;
  
  if (typeof coords === 'string') {
    try {
      const match = coords.match(/\(([^,]+),([^)]+)\)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
    } catch (error) {
      console.error('خطأ في تحليل الإحداثيات:', error);
    }
  }
  
  if (Array.isArray(coords) && coords.length === 2) {
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  
  return null;
};
