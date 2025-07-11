
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRideRequest = () => {
  const [rideRequestLoading, setRideRequestLoading] = useState(false);

  const requestRide = async (rideData: {
    from_location: string;
    to_location: string;
    from_coordinates: [number, number];
    customer_id: string;
    customer_name: string;
    customer_phone: string;
  }) => {
    setRideRequestLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('create_trip_request', {
        p_customer_id: rideData.customer_id,
        p_from_location: rideData.from_location,
        p_to_location: rideData.to_location,
        p_from_coordinates: JSON.stringify([rideData.from_coordinates[1], rideData.from_coordinates[0]]),
        p_to_coordinates: JSON.stringify([0, 0]), // Will be updated when destination is geocoded
        p_vehicle_type: 'regular',
        p_distance_km: 0, // Will be calculated
        p_price: 0 // Will be calculated
      });

      if (error) {
        console.error('Error creating trip request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in requestRide:', error);
      return { success: false, error: 'حدث خطأ أثناء طلب الرحلة' };
    } finally {
      setRideRequestLoading(false);
    }
  };

  return {
    requestRide,
    rideRequestLoading
  };
};
