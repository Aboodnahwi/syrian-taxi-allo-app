
import { useState, useEffect } from 'react';

interface VehicleType {
  id: string;
  name: string;
  price: number;
  icon: string;
  color: string;
}

export const useVehicleTypes = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // بيانات وسائل النقل المتاحة
    const defaultVehicleTypes: VehicleType[] = [
      { 
        id: 'regular', 
        name: 'سيارة عادية', 
        price: 1000, 
        icon: '🚗', 
        color: 'bg-blue-500' 
      },
      { 
        id: 'ac', 
        name: 'سيارة مكيفة', 
        price: 1500, 
        icon: '❄️', 
        color: 'bg-cyan-500' 
      },
      { 
        id: 'public', 
        name: 'نقل عام', 
        price: 500, 
        icon: '🚌', 
        color: 'bg-green-500' 
      },
      { 
        id: 'vip', 
        name: 'سيارة VIP', 
        price: 3000, 
        icon: '🚙', 
        color: 'bg-purple-500' 
      },
      { 
        id: 'microbus', 
        name: 'ميكروباص', 
        price: 800, 
        icon: '🚐', 
        color: 'bg-orange-500' 
      },
      { 
        id: 'bike', 
        name: 'دراجة نارية', 
        price: 700, 
        icon: '🏍️', 
        color: 'bg-red-500' 
      }
    ];

    setVehicleTypes(defaultVehicleTypes);
    setLoading(false);
  }, []);

  return { vehicleTypes, loading };
};
