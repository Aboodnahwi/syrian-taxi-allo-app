
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehiclePricing {
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
}

export const useVehiclePricing = () => {
  const [pricing, setPricing] = useState<VehiclePricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        // جلب التسعير من قاعدة البيانات
        const { data: vehiclePricingData, error } = await supabase
          .from('vehicle_pricing')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('خطأ في جلب التسعير:', error);
          // استخدام البيانات الافتراضية في حال حدوث خطأ
          const defaultPricing: VehiclePricing[] = [
            { vehicle_type: 'regular', base_price: 1000, price_per_km: 100, minimum_fare: 500 },
            { vehicle_type: 'ac', base_price: 1500, price_per_km: 150, minimum_fare: 750 },
            { vehicle_type: 'public', base_price: 500, price_per_km: 75, minimum_fare: 300 },
            { vehicle_type: 'vip', base_price: 3000, price_per_km: 300, minimum_fare: 1500 },
            { vehicle_type: 'microbus', base_price: 800, price_per_km: 120, minimum_fare: 600 },
            { vehicle_type: 'bike', base_price: 700, price_per_km: 80, minimum_fare: 400 }
          ];
          setPricing(defaultPricing);
        } else if (vehiclePricingData && vehiclePricingData.length > 0) {
          // استخدام البيانات من قاعدة البيانات
          setPricing(vehiclePricingData);
        } else {
          // لا توجد بيانات في قاعدة البيانات، استخدام البيانات الافتراضية
          const defaultPricing: VehiclePricing[] = [
            { vehicle_type: 'regular', base_price: 1000, price_per_km: 100, minimum_fare: 500 },
            { vehicle_type: 'ac', base_price: 1500, price_per_km: 150, minimum_fare: 750 },
            { vehicle_type: 'public', base_price: 500, price_per_km: 75, minimum_fare: 300 },
            { vehicle_type: 'vip', base_price: 3000, price_per_km: 300, minimum_fare: 1500 },
            { vehicle_type: 'microbus', base_price: 800, price_per_km: 120, minimum_fare: 600 },
            { vehicle_type: 'bike', base_price: 700, price_per_km: 80, minimum_fare: 400 }
          ];
          setPricing(defaultPricing);
        }
      } catch (error) {
        console.error('خطأ في جلب التسعير:', error);
        // استخدام البيانات الافتراضية
        const defaultPricing: VehiclePricing[] = [
          { vehicle_type: 'regular', base_price: 1000, price_per_km: 100, minimum_fare: 500 },
          { vehicle_type: 'ac', base_price: 1500, price_per_km: 150, minimum_fare: 750 },
          { vehicle_type: 'public', base_price: 500, price_per_km: 75, minimum_fare: 300 },
          { vehicle_type: 'vip', base_price: 3000, price_per_km: 300, minimum_fare: 1500 },
          { vehicle_type: 'microbus', base_price: 800, price_per_km: 120, minimum_fare: 600 },
          { vehicle_type: 'bike', base_price: 700, price_per_km: 80, minimum_fare: 400 }
        ];
        setPricing(defaultPricing);
      } finally {
        setLoading(false);
      }
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
