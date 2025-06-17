
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, DollarSign } from 'lucide-react';

interface RideTrackingDisplayProps {
  trackingData: {
    totalDistance: number;
    totalFare: number;
    startTime: number;
    isTracking: boolean;
  } | null;
}

const RideTrackingDisplay = ({ trackingData }: RideTrackingDisplayProps) => {
  if (!trackingData || !trackingData.isTracking) return null;

  const formatDuration = (startTime: number) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <Card className="bg-white/95 backdrop-blur-sm border-emerald-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-600 font-tajawal">المسافة</span>
              <span className="text-lg font-bold text-slate-800">
                {trackingData.totalDistance.toFixed(2)} كم
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-slate-600 font-tajawal">الأجرة</span>
              <span className="text-lg font-bold text-emerald-600">
                {trackingData.totalFare.toLocaleString()} ل.س
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-slate-600 font-tajawal">الوقت</span>
              <span className="text-lg font-bold text-purple-600">
                {formatDuration(trackingData.startTime)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideTrackingDisplay;
