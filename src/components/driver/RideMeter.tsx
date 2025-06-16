
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, DollarSign, MapPin } from 'lucide-react';

interface RideMeterProps {
  isActive: boolean;
  basePrice: number;
  pricePerKm: number;
  onRideComplete: (distance: number, totalPrice: number) => void;
}

const RideMeter = ({ isActive, basePrice, pricePerKm, onRideComplete }: RideMeterProps) => {
  const [distance, setDistance] = useState(0);
  const [totalPrice, setTotalPrice] = useState(basePrice);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isActive && !startTime) {
      setStartTime(new Date());
    } else if (!isActive) {
      setStartTime(null);
      setDistance(0);
      setTotalPrice(basePrice);
    }
  }, [isActive, startTime, basePrice]);

  // محاكاة حساب المسافة (في التطبيق الحقيقي ستأتي من GPS)
  useEffect(() => {
    if (!isActive || !startTime) return;

    const interval = setInterval(() => {
      // محاكاة زيادة المسافة بمعدل 0.1 كم كل 10 ثواني (سرعة 36 كم/ساعة)
      setDistance(prev => {
        const newDistance = prev + 0.1;
        const newPrice = basePrice + (newDistance * pricePerKm);
        setTotalPrice(Math.round(newPrice));
        return newDistance;
      });
    }, 10000); // كل 10 ثواني

    return () => clearInterval(interval);
  }, [isActive, startTime, basePrice, pricePerKm]);

  const handleCompleteRide = () => {
    onRideComplete(distance, totalPrice);
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40">
      <Card className="bg-white/95 backdrop-blur-sm border-emerald-200 border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-800 font-cairo text-lg flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            عداد الرحلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600 font-semibold font-tajawal">المسافة</span>
              </div>
              <p className="text-2xl font-bold text-blue-800">{distance.toFixed(1)} كم</p>
            </div>
            
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold font-tajawal">السعر</span>
              </div>
              <p className="text-2xl font-bold text-emerald-800">{totalPrice.toLocaleString()} ل.س</p>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600 font-tajawal">
            السعر الأساسي: {basePrice.toLocaleString()} ل.س + {pricePerKm.toLocaleString()} ل.س/كم
          </div>

          <Button 
            onClick={handleCompleteRide}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white"
          >
            إنهاء الرحلة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideMeter;
