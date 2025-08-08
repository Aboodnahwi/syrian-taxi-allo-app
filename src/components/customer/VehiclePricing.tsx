
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Snowflake, Bus, Crown, Users, Bike } from 'lucide-react';

interface VehiclePricingProps {
  distance: number;
  onSelectVehicle: (vehicleType: string, price: number) => void;
  selectedVehicle?: string;
}

const VehiclePricing = ({ distance, onSelectVehicle, selectedVehicle }: VehiclePricingProps) => {
  // معلومات وسائل النقل مع التسعير
  const vehicleTypes = [
    {
      type: 'regular',
      name: 'سيارة عادية',
      icon: Car,
      basePrice: 1000,
      pricePerKm: 100,
      minFare: 500,
      color: 'bg-blue-500',
      description: 'سيارة عادية مريحة'
    },
    {
      type: 'ac',
      name: 'سيارة مكيفة',
      icon: Snowflake,
      basePrice: 1500,
      pricePerKm: 150,
      minFare: 750,
      color: 'bg-cyan-500',
      description: 'سيارة مكيفة للراحة'
    },
    {
      type: 'public',
      name: 'نقل عام',
      icon: Bus,
      basePrice: 500,
      pricePerKm: 75,
      minFare: 300,
      color: 'bg-green-500',
      description: 'وسيلة اقتصادية'
    },
    {
      type: 'vip',
      name: 'سيارة VIP',
      icon: Crown,
      basePrice: 3000,
      pricePerKm: 300,
      minFare: 1500,
      color: 'bg-purple-500',
      description: 'خدمة فاخرة'
    },
    {
      type: 'microbus',
      name: 'ميكروباص',
      icon: Users,
      basePrice: 800,
      pricePerKm: 120,
      minFare: 600,
      color: 'bg-orange-500',
      description: 'للمجموعات الكبيرة'
    },
    {
      type: 'bike',
      name: 'دراجة نارية',
      icon: Bike,
      basePrice: 700,
      pricePerKm: 80,
      minFare: 400,
      color: 'bg-red-500',
      description: 'سريع واقتصادي'
    }
  ];

  const calculatePrice = (vehicle: any) => {
    const totalPrice = vehicle.basePrice + (distance * vehicle.pricePerKm);
    return Math.max(totalPrice, vehicle.minFare);
  };

  const getEstimatedTime = (vehicleType: string) => {
    const speeds = {
      regular: 40,
      ac: 40,
      public: 30,
      vip: 45,
      microbus: 35,
      bike: 50
    };
    const speed = speeds[vehicleType as keyof typeof speeds] || 40;
    return Math.ceil((distance / speed) * 60);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 font-cairo mb-2">
          اختر وسيلة النقل المناسبة
        </h3>
        <p className="text-sm text-slate-600 font-tajawal">
          المسافة: {distance.toFixed(1)} كم
        </p>
      </div>

      <div className="grid gap-3">
        {vehicleTypes.map((vehicle) => {
          const Icon = vehicle.icon;
          const price = calculatePrice(vehicle);
          const estimatedTime = getEstimatedTime(vehicle.type);
          const isSelected = selectedVehicle === vehicle.type;

          return (
            <Card 
              key={vehicle.type}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => onSelectVehicle(vehicle.type, price)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${vehicle.color} text-white p-2 rounded-full`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 font-cairo">
                        {vehicle.name}
                      </h4>
                      <p className="text-sm text-slate-600 font-tajawal">
                        {vehicle.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          ~{estimatedTime} دقيقة
                        </Badge>
                        {vehicle.type === 'ac' && (
                          <Badge className="bg-cyan-100 text-cyan-700 text-xs">
                            مكيف
                          </Badge>
                        )}
                        {vehicle.type === 'vip' && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            فاخر
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600 font-cairo">
                      {price.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">ليرة سورية</div>
                    
                    <Button
                      size="sm"
                      className={`mt-2 ${
                        isSelected 
                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                          : 'bg-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'محدد' : 'اختيار'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-bold text-slate-700 font-cairo mb-2">
          معلومات التسعير:
        </h4>
        <ul className="text-sm text-slate-600 space-y-1 font-tajawal">
          <li>• السعر يشمل: الأجرة الأساسية + سعر الكيلومتر</li>
          <li>• الحد الأدنى للأجرة مطبق حسب نوع المركبة</li>
          <li>• الأوقات الذروة قد تتضمن رسوم إضافية</li>
          <li>• التسعير وفقاً لمعايير الإدارة</li>
        </ul>
      </div>
    </div>
  );
};

export default VehiclePricing;
