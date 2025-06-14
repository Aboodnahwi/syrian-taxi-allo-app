
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Trip {
  id: string;
  customer_id: string;
  driver_id?: string;
  from_location: string;
  to_location: string;
  from_coordinates?: [number, number];
  to_coordinates?: [number, number];
  vehicle_type: string;
  distance_km?: number;
  price: number;
  status: string;
  scheduled_time?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  customer_rating?: number;
  driver_rating?: number;
  customer_comment?: string;
  driver_comment?: string;
  cancellation_reason?: string;
  estimated_duration?: number;
  actual_duration?: number;
}

export const useRealTimeTrips = (userType: 'customer' | 'driver', userId?: string) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const fetchTrips = async () => {
      try {
        let query = supabase
          .from('trips')
          .select('*');

        if (userType === 'customer') {
          query = query.eq('customer_id', userId);
        } else if (userType === 'driver') {
          query = query.eq('driver_id', userId);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error('[useRealTimeTrips] Error fetching trips:', error);
          throw error;
        }

        console.log('[useRealTimeTrips] Fetched trips:', data?.length || 0);
        setTrips(data || []);
      } catch (error) {
        console.error('[useRealTimeTrips] Error in fetchTrips:', error);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: userType === 'customer' ? `customer_id=eq.${userId}` : `driver_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useRealTimeTrips] Real-time update:', payload);
          fetchTrips(); // Refetch data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType, userId]);

  return { trips, loading };
};
