
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehicleType {
  id: string;
  name: string;
  base_price: number;
  per_km_price: number;
  icon: string;
  color: string;
}

export const useVehicleTypes = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        // Try to fetch from app_settings first
        const { data: settings, error: settingsError } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'vehicle_types')
          .maybeSingle();

        if (settings && settings.setting_value) {
          const types = JSON.parse(settings.setting_value);
          setVehicleTypes(types);
        } else {
          // Default vehicle types if not found in database
          const defaultTypes = [
            {
              id: 'sedan',
              name: 'سيارة عادية',
              base_price: 1000,
              per_km_price: 200,
              icon: '🚗',
              color: 'from-blue-500 to-blue-600'
            },
            {
              id: 'ac_sedan',
              name: 'سيارة مكيفة',
              base_price: 1500,
              per_km_price: 300,
              icon: '❄️',
              color: 'from-cyan-500 to-cyan-600'
            },
            {
              id: 'taxi',
              name: 'تكسي عادي',
              base_price: 800,
              per_km_price: 150,
              icon: '🚕',
              color: 'from-yellow-500 to-yellow-600'
            },
            {
              id: 'van',
              name: 'فان',
              base_price: 2000,
              per_km_price: 400,
              icon: '🚐',
              color: 'from-green-500 to-green-600'
            }
          ];
          setVehicleTypes(defaultTypes);
        }
      } catch (error) {
        console.error('Error fetching vehicle types:', error);
        // Set default types on error
        const defaultTypes = [
          {
            id: 'sedan',
            name: 'سيارة عادية',
            base_price: 1000,
            per_km_price: 200,
            icon: '🚗',
            color: 'from-blue-500 to-blue-600'
          },
          {
            id: 'ac_sedan',
            name: 'سيارة مكيفة',
            base_price: 1500,
            per_km_price: 300,
            icon: '❄️',
            color: 'from-cyan-500 to-cyan-600'
          },
          {
            id: 'taxi',
            name: 'تكسي عادي',
            base_price: 800,
            per_km_price: 150,
            icon: '🚕',
            color: 'from-yellow-500 to-yellow-600'
          }
        ];
        setVehicleTypes(defaultTypes);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypes();
  }, []);

  return { vehicleTypes, loading };
};
