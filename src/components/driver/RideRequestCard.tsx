
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Clock, DollarSign, Navigation2 } from 'lucide-react';
import { useState } from 'react';

interface RideRequestCardProps {
  request: {
    id: string;
    customer_name: string;
    from_location: string;
    to_location: string;
    from_coordinates: [number, number];
    to_coordinates: [number, number];
    vehicle_type: string;
    price: number;
    distance_km: number;
    estimated_duration: number;
    urgent?: boolean;
    customer_phone?: string;
  };
  acceptRide: (request: any) => Promise<{ success: boolean }>;
  rejectRide: (requestId: string) => void;
  driverLocation?: [number, number];
}

const RideRequestCard = ({ request, acceptRide, rejectRide, driverLocation }: RideRequestCardProps) => {
  const [isAccepting, setIsAccepting] = useState(false);

  // حساب المسافة من السائق إلى نقطة الانطلاق
  const calculateDistanceToPickup = () => {
    if (!driverLocation) return 0;
    
    const R = 6371;
    const dLat = (request.from_coordinates[0] - driverLocation[0]) * Math.PI / 180;
    const dLon = (request.from_coordinates[1] - driverLocation[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverLocation[0] * Math.PI / 180) * Math.cos(request.from_coordinates[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distanceToPickup = calculateDistanceToPickup();
  const estimatedArrival = Math.ceil((distanceToPickup / 40) * 60); // افتراض سرعة 40 كم/س

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptRide(request);
      if (!result.success) {
        setIsAccepting(false);
      }
    } catch (error) {
      setIsAccepting(false);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-800 font-cairo">
              {request.customer_name}
            </span>
            {request.urgent && (
              <Badge className="bg-red-500 text-white text-xs">عاجل</Badge>
            )}
          </div>
          <div className="text-left">
            <p className="text-xl font-bold text-emerald-600">
              {request.price.toLocaleString()} ل.س
            </p>
            <p className="text-xs text-slate-500">
              {request.distance_km.toFixed(1)} كم
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <span className="text-slate-600">من:</span>
              <p className="font-semibold text-slate-800 font-tajawal">
                {request.from_location}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <span className="text-slate-600">إلى:</span>
              <p className="font-semibold text-slate-800 font-tajawal">
                {request.to_location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-slate-600">مدة الرحلة المتوقعة:</span>
            <span className="font-semibold text-purple-600">
              {request.estimated_duration} دقيقة
            </span>
          </div>
          
          {driverLocation && (
            <div className="flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-orange-500" />
              <span className="text-slate-600">بُعدك عن الزبون:</span>
              <span className="font-semibold text-orange-600">
                {distanceToPickup.toFixed(1)} كم (~{estimatedArrival} دقيقة)
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-cairo"
          >
            {isAccepting ? 'جاري القبول...' : 'قبول الرحلة'}
          </Button>
          <Button 
            onClick={() => rejectRide(request.id)}
            variant="outline"
            className="px-4 border-red-200 text-red-600 hover:bg-red-50"
            disabled={isAccepting}
          >
            رفض
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
          <div className="flex justify-between">
            <span>نوع المركبة: {request.vehicle_type}</span>
            {request.customer_phone && (
              <span>الهاتف: {request.customer_phone}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideRequestCard;
