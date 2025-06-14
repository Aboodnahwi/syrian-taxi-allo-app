
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

// Helper function to safely convert coordinates
const parseCoordinates = (coords: unknown): [number, number] | undefined => {
  if (!coords) return undefined;
  
  if (typeof coords === 'string') {
    try {
      // Handle point format like "(lat,lng)"
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
  
  return undefined;
};

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
        
        // Transform the data to match our Trip interface
        const transformedTrips: Trip[] = (data || []).map((trip: any) => ({
          id: trip.id,
          customer_id: trip.customer_id,
          driver_id: trip.driver_id,
          from_location: trip.from_location,
          to_location: trip.to_location,
          from_coordinates: parseCoordinates(trip.from_coordinates),
          to_coordinates: parseCoordinates(trip.to_coordinates),
          vehicle_type: trip.vehicle_type,
          distance_km: trip.distance_km,
          price: trip.price,
          status: trip.status,
          scheduled_time: trip.scheduled_time,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
          accepted_at: trip.accepted_at,
          started_at: trip.started_at,
          completed_at: trip.completed_at,
          cancelled_at: trip.cancelled_at,
          customer_rating: trip.customer_rating,
          driver_rating: trip.driver_rating,
          customer_comment: trip.customer_comment,
          driver_comment: trip.driver_comment,
          cancellation_reason: trip.cancellation_reason,
          estimated_duration: trip.estimated_duration,
          actual_duration: trip.actual_duration
        }));
        
        setTrips(transformedTrips);
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
