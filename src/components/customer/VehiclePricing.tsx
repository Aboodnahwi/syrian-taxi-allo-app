
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Snowflake, Bus, Crown, Users, Bike } from 'lucide-react';
import { useVehiclePricing } from '@/hooks/useVehiclePricing';

interface VehiclePricingProps {
  distance: number;
  onSelectVehicle: (vehicleType: string, price: number) => void;
  selectedVehicle?: string;
}

const VehiclePricing = ({ distance, onSelectVehicle, selectedVehicle }: VehiclePricingProps) => {
  const { pricing, loading, calculatePrice, getVehicleDisplayName, getVehicleIcon } = useVehiclePricing();

  // معلومات الأيقونات والألوان لكل نوع مركبة
  const vehicleIcons = {
    regular: { icon: Car, color: 'bg-blue-500' },
    ac: { icon: Snowflake, color: 'bg-cyan-500' },
    public: { icon: Bus, color: 'bg-green-500' },
    vip: { icon: Crown, color: 'bg-purple-500' },
    microbus: { icon: Users, color: 'bg-orange-500' },
    bike: { icon: Bike, color: 'bg-red-500' }
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

  const getVehicleDescription = (vehicleType: string) => {
    const descriptions = {
      regular: 'سيارة عادية مريحة',
      ac: 'سيارة مكيفة للراحة',
      public: 'وسيلة اقتصادية',
      vip: 'خدمة فاخرة',
      microbus: 'للمجموعات الكبيرة',
      bike: 'سريع واقتصادي'
    };
    return descriptions[vehicleType as keyof typeof descriptions] || 'وسيلة نقل';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600 font-tajawal">جاري تحميل التسعير...</p>
        </div>
      </div>
    );
  }

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
        {pricing.map((vehicle) => {
          const vehicleInfo = vehicleIcons[vehicle.vehicle_type as keyof typeof vehicleIcons];
          if (!vehicleInfo) return null;
          
          const Icon = vehicleInfo.icon;
          const price = calculatePrice(distance, vehicle.vehicle_type);
          const estimatedTime = getEstimatedTime(vehicle.vehicle_type);
          const isSelected = selectedVehicle === vehicle.vehicle_type;

          return (
            <Card 
              key={vehicle.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => onSelectVehicle(vehicle.vehicle_type, price)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${vehicleInfo.color} text-white p-2 rounded-full`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 font-cairo">
                        {getVehicleDisplayName(vehicle.vehicle_type)}
                      </h4>
                      <p className="text-sm text-slate-600 font-tajawal">
                        {getVehicleDescription(vehicle.vehicle_type)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          ~{estimatedTime} دقيقة
                        </Badge>
                        {vehicle.vehicle_type === 'ac' && (
                          <Badge className="bg-cyan-100 text-cyan-700 text-xs">
                            مكيف
                          </Badge>
                        )}
                        {vehicle.vehicle_type === 'vip' && (
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
