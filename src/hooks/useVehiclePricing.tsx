
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVehiclePricing = () => {
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      const { data, error } = await supabase
        .from('vehicle_pricing')
        .select('*')
        .order('base_price', { ascending: true });

      if (!error && data) {
        setPricing(data);
      }
      setLoading(false);
    };

    fetchPricing();
  }, []);

  const calculatePrice = (distance: number, vehicleType: string) => {
    const vehiclePricing = pricing.find(p => p.vehicle_type === vehicleType);
    if (!vehiclePricing) return 1000;

    const totalPrice = vehiclePricing.base_price + (distance * vehiclePricing.price_per_km);
    return Math.max(totalPrice, vehiclePricing.minimum_fare);
  };

  return { pricing, loading, calculatePrice };
};
