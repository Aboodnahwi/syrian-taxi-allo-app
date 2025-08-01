
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehiclePricing {
  id: string;
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  surge_multiplier: number;
  is_active: boolean;
}

export const useVehiclePricing = () => {
  const [pricing, setPricing] = useState<VehiclePricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('vehicle_pricing')
          .select('*')
          .eq('is_active', true)
          .order('vehicle_type');

        if (error) {
          console.error('Error fetching vehicle pricing:', error);
          // استخدام بيانات افتراضية في حالة الخطأ
          const defaultPricing: VehiclePricing[] = [
            { 
              id: 'regular', 
              vehicle_type: 'regular', 
              base_price: 1000, 
              price_per_km: 100, 
              minimum_fare: 500,
              surge_multiplier: 1.0,
              is_active: true
            },
            { 
              id: 'ac', 
              vehicle_type: 'ac', 
              base_price: 1500, 
              price_per_km: 150, 
              minimum_fare: 750,
              surge_multiplier: 1.0,
              is_active: true
            },
            { 
              id: 'public', 
              vehicle_type: 'public', 
              base_price: 500, 
              price_per_km: 75, 
              minimum_fare: 300,
              surge_multiplier: 1.0,
              is_active: true
            },
            { 
              id: 'vip', 
              vehicle_type: 'vip', 
              base_price: 3000, 
              price_per_km: 300, 
              minimum_fare: 1500,
              surge_multiplier: 1.0,
              is_active: true
            },
            { 
              id: 'microbus', 
              vehicle_type: 'microbus', 
              base_price: 800, 
              price_per_km: 120, 
              minimum_fare: 600,
              surge_multiplier: 1.0,
              is_active: true
            },
            { 
              id: 'bike', 
              vehicle_type: 'bike', 
              base_price: 700, 
              price_per_km: 80, 
              minimum_fare: 400,
              surge_multiplier: 1.0,
              is_active: true
            }
          ];
          setPricing(defaultPricing);
        } else {
          // إذا لم توجد بيانات، استخدم القيم الافتراضية
          if (!data || data.length === 0) {
            const defaultPricing: VehiclePricing[] = [
              { 
                id: 'regular', 
                vehicle_type: 'regular', 
                base_price: 1000, 
                price_per_km: 100, 
                minimum_fare: 500,
                surge_multiplier: 1.0,
                is_active: true
              },
              { 
                id: 'ac', 
                vehicle_type: 'ac', 
                base_price: 1500, 
                price_per_km: 150, 
                minimum_fare: 750,
                surge_multiplier: 1.0,
                is_active: true
              },
              { 
                id: 'public', 
                vehicle_type: 'public', 
                base_price: 500, 
                price_per_km: 75, 
                minimum_fare: 300,
                surge_multiplier: 1.0,
                is_active: true
              },
              { 
                id: 'vip', 
                vehicle_type: 'vip', 
                base_price: 3000, 
                price_per_km: 300, 
                minimum_fare: 1500,
                surge_multiplier: 1.0,
                is_active: true
              },
              { 
                id: 'microbus', 
                vehicle_type: 'microbus', 
                base_price: 800, 
                price_per_km: 120, 
                minimum_fare: 600,
                surge_multiplier: 1.0,
                is_active: true
              },
              { 
                id: 'bike', 
                vehicle_type: 'bike', 
                base_price: 700, 
                price_per_km: 80, 
                minimum_fare: 400,
                surge_multiplier: 1.0,
                is_active: true
              }
            ];
            setPricing(defaultPricing);
          } else {
            setPricing(data);
          }
        }
      } catch (error) {
        console.error('Error in useVehiclePricing:', error);
        // تعيين قيم افتراضية في حالة الخطأ
        const defaultPricing: VehiclePricing[] = [
          { 
            id: 'regular', 
            vehicle_type: 'regular', 
            base_price: 1000, 
            price_per_km: 100, 
            minimum_fare: 500,
            surge_multiplier: 1.0,
            is_active: true
          },
          { 
            id: 'ac', 
            vehicle_type: 'ac', 
            base_price: 1500, 
            price_per_km: 150, 
            minimum_fare: 750,
            surge_multiplier: 1.0,
            is_active: true
          },
          { 
            id: 'public', 
            vehicle_type: 'public', 
            base_price: 500, 
            price_per_km: 75, 
            minimum_fare: 300,
            surge_multiplier: 1.0,
            is_active: true
          },
          { 
            id: 'vip', 
            vehicle_type: 'vip', 
            base_price: 3000, 
            price_per_km: 300, 
            minimum_fare: 1500,
            surge_multiplier: 1.0,
            is_active: true
          },
          { 
            id: 'microbus', 
            vehicle_type: 'microbus', 
            base_price: 800, 
            price_per_km: 120, 
            minimum_fare: 600,
            surge_multiplier: 1.0,
            is_active: true
          },
          { 
            id: 'bike', 
            vehicle_type: 'bike', 
            base_price: 700, 
            price_per_km: 80, 
            minimum_fare: 400,
            surge_multiplier: 1.0,
            is_active: true
          }
        ];
        setPricing(defaultPricing);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  const calculatePrice = (distance: number, vehicleType: string, surge: boolean = false) => {
    const vehiclePricing = pricing.find(p => p.vehicle_type === vehicleType);
    if (!vehiclePricing) {
      // إعطاء سعر افتراضي إذا لم توجد بيانات التسعير
      return Math.max(1000, distance * 100);
    }

    let totalPrice = vehiclePricing.base_price + (distance * vehiclePricing.price_per_km);
    
    // تطبيق معامل الطلب العالي إذا لزم الأمر
    if (surge) {
      totalPrice *= vehiclePricing.surge_multiplier;
    }
    
    // التأكد من عدم انخفاض السعر عن الحد الأدنى
    return Math.max(totalPrice, vehiclePricing.minimum_fare);
  };

  const getVehicleDisplayName = (vehicleType: string) => {
    const displayNames: { [key: string]: string } = {
      'regular': 'سيارة عادية',
      'ac': 'سيارة مكيفة',
      'public': 'نقل عام',
      'vip': 'سيارة VIP',
      'microbus': 'ميكروباص',
      'bike': 'دراجة نارية'
    };
    return displayNames[vehicleType] || vehicleType;
  };

  const getVehicleIcon = (vehicleType: string) => {
    const icons: { [key: string]: string } = {
      'regular': '🚗',
      'ac': '❄️',
      'public': '🚌',
      'vip': '🚙',
      'microbus': '🚐',
      'bike': '🏍️'
    };
    return icons[vehicleType] || '🚗';
  };

  return { 
    pricing, 
    loading, 
    calculatePrice, 
    getVehicleDisplayName, 
    getVehicleIcon 
  };
};
