
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, MapPin, Clock, Navigation } from 'lucide-react';

interface LiveFareCounterProps {
  currentFare: number;
  distance: number;
  duration: number;
  speed: number;
  customerName?: string;
  isActive: boolean;
}

const LiveFareCounter = ({ 
  currentFare, 
  distance, 
  duration, 
  speed, 
  customerName,
  isActive 
}: LiveFareCounterProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] pointer-events-auto">
      <Card className="bg-white/95 backdrop-blur-sm border-emerald-300 border-2 shadow-2xl max-w-xs mx-auto">
        <CardContent className="p-6">
          {/* الأجرة الحالية - عداد كبير */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <span className="text-sm text-slate-600 font-tajawal">الأجرة الحالية</span>
            </div>
            <div className="text-6xl font-bold text-emerald-600 font-cairo">
              {currentFare.toLocaleString()}
            </div>
            <div className="text-xl text-slate-600 font-tajawal mt-1">ليرة سورية</div>
          </div>

          {/* معلومات الرحلة */}
          <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-500">المسافة</span>
              <span className="text-lg font-bold text-blue-600">
                {distance.toFixed(2)} كم
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-slate-500">الوقت</span>
              <span className="text-lg font-bold text-purple-600">
                {formatDuration(duration)}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Navigation className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-slate-500">السرعة</span>
              <span className="text-lg font-bold text-orange-600">
                {speed.toFixed(0)} كم/س
              </span>
            </div>
          </div>

          {/* اسم الزبون */}
          {customerName && (
            <div className="text-center mt-4 p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-600">رحلة </span>
              <span className="font-semibold text-slate-800">{customerName}</span>
            </div>
          )}

          {/* مؤشر الحالة */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-tajawal text-emerald-700">
              جاري تحديث الأجرة...
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveFareCounter;
