
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, MapPin, Clock, Navigation, User } from 'lucide-react';

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
      <Card className="bg-white/98 backdrop-blur-sm border-emerald-400 border-3 shadow-2xl max-w-md mx-auto animate-pulse">
        <CardContent className="p-8">
          {/* العداد الرئيسي للأجرة */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-emerald-500 p-3 rounded-full">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <span className="text-lg text-slate-700 font-tajawal font-bold">الأجرة الحالية</span>
            </div>
            <div className="relative">
              <div className="text-8xl font-bold text-emerald-600 font-cairo mb-2 animate-bounce">
                {currentFare.toLocaleString()}
              </div>
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                LIVE
              </div>
            </div>
            <div className="text-2xl text-slate-600 font-tajawal mt-2">ليرة سورية</div>
          </div>

          {/* اسم الزبون مع أيقونة */}
          {customerName && (
            <div className="text-center mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-blue-600 font-tajawal">رحلة الزبون</span>
              </div>
              <div className="text-xl font-bold text-blue-800 font-cairo">{customerName}</div>
            </div>
          )}

          {/* معلومات الرحلة في شبكة */}
          <div className="grid grid-cols-3 gap-6 text-center border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-blue-100 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-slate-500 font-tajawal">المسافة</span>
              <span className="text-xl font-bold text-blue-600 font-cairo">
                {distance.toFixed(2)}
              </span>
              <span className="text-xs text-blue-500">كيلومتر</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-slate-500 font-tajawal">الوقت</span>
              <span className="text-xl font-bold text-purple-600 font-cairo">
                {formatDuration(duration)}
              </span>
              <span className="text-xs text-purple-500">دقيقة:ثانية</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="bg-orange-100 p-3 rounded-full">
                <Navigation className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs text-slate-500 font-tajawal">السرعة</span>
              <span className="text-xl font-bold text-orange-600 font-cairo">
                {speed.toFixed(0)}
              </span>
              <span className="text-xs text-orange-500">كم/ساعة</span>
            </div>
          </div>

          {/* مؤشر الحالة النشطة */}
          <div className="flex items-center justify-center gap-3 mt-6 bg-emerald-50 p-4 rounded-lg">
            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-lg font-tajawal text-emerald-700 font-bold">
              جاري تحديث الأجرة والمسافة...
            </span>
            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-center text-xs text-slate-600">
              <p>العداد يعمل وفقاً لمعايير الإدارة</p>
              <p className="mt-1">المسافة × السعر + الوقت + عوامل الذروة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveFareCounter;
