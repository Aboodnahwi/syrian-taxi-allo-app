
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Clock } from 'lucide-react';

interface RideRequestCardProps {
  request: any;
  acceptRide: (request: any) => void;
  rejectRide: (requestId: string) => void;
}

const RideRequestCard = ({ request, acceptRide, rejectRide }: RideRequestCardProps) => {
  const isUrgent = request.scheduled_time && new Date(request.scheduled_time) < new Date(Date.now() + 30 * 60000); // خلال 30 دقيقة

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-800">زبون جديد</span>
            {isUrgent && (
              <Badge className="bg-red-500 text-white text-xs">عاجل</Badge>
            )}
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-emerald-600">{request.price?.toLocaleString() || 'غير محدد'} ل.س</p>
            {request.distance_km && (
              <p className="text-xs text-slate-500">{request.distance_km.toFixed(1)} كم</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-slate-600">من:</span>
            <span className="font-semibold">{request.from_location}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-slate-600">إلى:</span>
            <span className="font-semibold">{request.to_location}</span>
          </div>
          {request.estimated_duration && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">وقت التوصيل المتوقع:</span>
              <span className="font-semibold">{request.estimated_duration} دقيقة</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">نوع المركبة:</span>
            <span className="font-semibold">{request.vehicle_type}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => acceptRide(request)}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            قبول الرحلة
          </Button>
          <Button 
            onClick={() => rejectRide(request.id)}
            variant="outline"
            className="px-4 border-red-200 text-red-600 hover:bg-red-50"
          >
            رفض
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideRequestCard;
