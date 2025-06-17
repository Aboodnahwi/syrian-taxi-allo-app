
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
    if (!driverLocation) return;

    const fetchRideRequests = async () => {
      try {
        // جلب الطلبات المتاحة مع معلومات الزبائن
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
          console.error('Error fetching ride requests:', error);
          toast({
            title: "خطأ في جلب الطلبات",
            description: "تعذر جلب طلبات الرحلات",
            variant: "destructive"
          });
          return;
        }

        // تحويل البيانات وحساب المسافة من موقع السائق
        const processedRequests: RideRequest[] = (trips || []).map((trip: any) => {
          // تحويل الإحداثيات
          const fromCoords = parseCoordinates(trip.from_coordinates);
          const toCoords = parseCoordinates(trip.to_coordinates);

          if (!fromCoords || !toCoords) return null;

          // حساب المسافة من موقع السائق إلى نقطة الانطلاق
          const distanceToPickup = calculateDistance(
            driverLocation[0], driverLocation[1],
            fromCoords[0], fromCoords[1]
          );

          return {
            id: trip.id,
            customer_id: trip.customer_id,
            from_location: trip.from_location,
            to_location: trip.to_location,
            from_coordinates: fromCoords,
            to_coordinates: toCoords,
            vehicle_type: trip.vehicle_type,
            price: trip.price,
            distance_km: trip.distance_km || 0,
            estimated_duration: trip.estimated_duration || 0,
            customer_name: trip.profiles?.name || 'زبون',
            customer_phone: trip.profiles?.phone || '',
            created_at: trip.created_at,
            urgent: distanceToPickup < 2, // عاجل إذا كان قريب
          };
        }).filter(Boolean) as RideRequest[];

        // ترتيب حسب القرب من السائق
        processedRequests.sort((a, b) => {
          const distA = calculateDistance(
            driverLocation[0], driverLocation[1],
            a.from_coordinates[0], a.from_coordinates[1]
          );
          const distB = calculateDistance(
            driverLocation[0], driverLocation[1],
            b.from_coordinates[0], b.from_coordinates[1]
          );
          return distA - distB;
        });

        setRideRequests(processedRequests);
      } catch (error) {
        console.error('Error in fetchRideRequests:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء جلب الطلبات",
          variant: "destructive"
        });
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
        () => {
          console.log('New ride request or update detected');
          fetchRideRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverLocation, toast]);

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
      console.error('Error parsing coordinates:', error);
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

// حساب المسافة بين نقطتين
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
