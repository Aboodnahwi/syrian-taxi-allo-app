
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, DollarSign, Navigation } from 'lucide-react';

interface RealTimeTrackerProps {
  distance: number;
  duration: number;
  fare: number;
  speed: number;
  isTracking: boolean;
}

const RealTimeTracker = ({ 
  distance, 
  duration, 
  fare, 
  speed, 
  isTracking 
}: RealTimeTrackerProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isTracking) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <Card className="bg-white/95 backdrop-blur-sm border-emerald-200 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-600 font-tajawal">المسافة</span>
              <span className="text-lg font-bold text-blue-600">
                {distance.toFixed(2)} كم
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-slate-600 font-tajawal">الأجرة</span>
              <span className="text-lg font-bold text-emerald-600">
                {fare.toLocaleString()} ل.س
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-slate-600 font-tajawal">الوقت</span>
              <span className="text-lg font-bold text-purple-600">
                {formatDuration(duration)}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Navigation className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-slate-600 font-tajawal">السرعة</span>
              <span className="text-lg font-bold text-orange-600">
                {speed.toFixed(0)} كم/س
              </span>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-tajawal text-emerald-700">
                جاري التتبع...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeTracker;
