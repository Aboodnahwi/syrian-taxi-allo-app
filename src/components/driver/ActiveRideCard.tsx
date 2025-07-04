
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Phone, Navigation, MapPin, Clock } from 'lucide-react';

interface ActiveRideCardProps {
  activeRide: any;
  rideStatus: 'accepted' | 'arrived' | 'started' | 'completed' | null;
  updateRideStatus: (status: 'arrived' | 'started' | 'completed') => void;
}

const ActiveRideCard = ({ activeRide, rideStatus, updateRideStatus }: ActiveRideCardProps) => {
  if (!activeRide) return null;

  // استخراج البيانات بشكل أكثر دقة
  const customerName = activeRide.customer_name || 
                      activeRide.customerName || 
                      activeRide.profiles?.name || 
                      'زبون';
  
  const fromLocation = activeRide.from_location || activeRide.from || 'غير محدد';
  const toLocation = activeRide.to_location || activeRide.to || 'غير محدد';
  const price = activeRide.price || 0;
  const distance = activeRide.distance_km || 0;
  const estimatedDuration = activeRide.estimated_duration || 
                           (distance > 0 ? Math.ceil(distance * 1.5) : 15);
  const customerPhone = activeRide.customer_phone || 
                       activeRide.profiles?.phone || '';

  console.log('ActiveRideCard - Complete ride data:', {
    activeRide,
    customerName,
    fromLocation,
    toLocation,
    price,
    distance,
    estimatedDuration
  });

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-emerald-200 border-2 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-emerald-800 font-cairo text-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          رحلة نشطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* معلومات الزبون والأجرة */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600 font-tajawal">الزبون:</span>
            <p className="font-semibold text-slate-800">{customerName}</p>
          </div>
          <div>
            <span className="text-slate-600 font-tajawal">السعر:</span>
            <p className="font-semibold text-emerald-600 text-lg">{price.toLocaleString()} ل.س</p>
          </div>
        </div>

        {/* معلومات المسافة والوقت */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {distance > 0 && (
            <div>
              <span className="text-slate-600 font-tajawal">المسافة:</span>
              <p className="font-semibold text-blue-600">{distance.toFixed(1)} كم</p>
            </div>
          )}
          <div>
            <span className="text-slate-600 font-tajawal">الوقت المتوقع:</span>
            <p className="font-semibold text-purple-600">{estimatedDuration} دقيقة</p>
          </div>
        </div>

        {/* مواقع الانطلاق والوصول */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-500 mt-1" />
            <div className="flex-1">
              <span className="text-xs text-slate-500">من:</span>
              <p className="font-semibold text-slate-800 text-sm">{fromLocation}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 mt-1" />
            <div className="flex-1">
              <span className="text-xs text-slate-500">إلى:</span>
              <p className="font-semibold text-slate-800 text-sm">{toLocation}</p>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          {rideStatus === 'accepted' && (
            <Button 
              onClick={() => updateRideStatus('arrived')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-cairo"
            >
              أنا ذاهب باتجاه الزبون
            </Button>
          )}
          {rideStatus === 'arrived' && (
            <Button 
              onClick={() => updateRideStatus('started')}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-cairo"
            >
              بدء الرحلة
            </Button>
          )}
          {rideStatus === 'started' && (
            <Button 
              onClick={() => updateRideStatus('completed')}
              className="flex-1 bg-violet-500 hover:bg-violet-600 text-white font-cairo"
            >
              انتهاء الرحلة
            </Button>
          )}
          {customerPhone && (
            <Button 
              variant="outline"
              className="px-3 border-slate-300 hover:bg-slate-50"
              onClick={() => window.open(`tel:${customerPhone}`)}
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* معلومات الحالة */}
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <span className="text-sm font-semibold text-slate-700">
            {rideStatus === 'accepted' && 'في الطريق للزبون'}
            {rideStatus === 'arrived' && 'وصلت للزبون - في انتظار البدء'}
            {rideStatus === 'started' && 'الرحلة جارية'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveRideCard;
