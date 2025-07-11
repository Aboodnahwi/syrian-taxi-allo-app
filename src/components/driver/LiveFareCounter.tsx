
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, MapPin, Clock, Navigation, User, Play, Square, Calendar } from 'lucide-react';

interface LiveFareCounterProps {
  currentFare: number;
  distance: number;
  duration: number;
  speed: number;
  customerName?: string;
  isActive: boolean;
  rideStatus?: 'started' | 'completed' | null;
  onStartRide?: () => void;
  onEndRide?: () => void;
}

const LiveFareCounter = ({ 
  currentFare, 
  distance, 
  duration, 
  speed, 
  customerName,
  isActive,
  rideStatus,
  onStartRide,
  onEndRide
}: LiveFareCounterProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('ar-SA'),
      time: now.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
  };

  if (!isActive) return null;

  const { date, time } = getCurrentDateTime();

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <Card className="bg-white border-emerald-500 border-3 shadow-2xl max-w-lg mx-auto">
          <CardContent className="p-6">
            {/* التاريخ والوقت */}
            <div className="flex items-center justify-between mb-4 bg-slate-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-tajawal text-slate-700">{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-tajawal text-slate-700">{time}</span>
              </div>
            </div>

            {/* العداد الرئيسي للأجرة */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="bg-emerald-500 p-3 rounded-full">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <span className="text-lg text-slate-700 font-tajawal font-bold">الأجرة الحالية</span>
              </div>
              <div className="relative">
                <div className="text-6xl font-bold text-emerald-600 font-cairo mb-2">
                  {currentFare.toLocaleString()}
                </div>
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
                  LIVE
                </div>
              </div>
              <div className="text-xl text-slate-600 font-tajawal mt-1">ليرة سورية</div>
            </div>

            {/* اسم الزبون */}
            {customerName && (
              <div className="text-center mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-600 font-tajawal">رحلة الزبون</span>
                </div>
                <div className="text-lg font-bold text-blue-800 font-cairo">{customerName}</div>
              </div>
            )}

            {/* معلومات الرحلة */}
            <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-200 pt-4 mb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs text-slate-500 font-tajawal">المسافة</span>
                <span className="text-lg font-bold text-blue-600 font-cairo">
                  {distance.toFixed(2)}
                </span>
                <span className="text-xs text-blue-500">كيلومتر</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs text-slate-500 font-tajawal">الوقت</span>
                <span className="text-lg font-bold text-purple-600 font-cairo">
                  {formatDuration(duration)}
                </span>
                <span className="text-xs text-purple-500">دقيقة:ثانية</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Navigation className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xs text-slate-500 font-tajawal">السرعة</span>
                <span className="text-lg font-bold text-orange-600 font-cairo">
                  {speed.toFixed(0)}
                </span>
                <span className="text-xs text-orange-500">كم/ساعة</span>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3 mb-4">
              {rideStatus !== 'started' && onStartRide && (
                <Button 
                  onClick={onStartRide}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-tajawal"
                >
                  <Play className="w-4 h-4 ml-2" />
                  بدء الرحلة
                </Button>
              )}
              
              {rideStatus === 'started' && onEndRide && (
                <Button 
                  onClick={onEndRide}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-tajawal"
                >
                  <Square className="w-4 h-4 ml-2" />
                  إنهاء الرحلة
                </Button>
              )}
            </div>

            {/* مؤشر الحالة النشطة */}
            <div className="flex items-center justify-center gap-3 bg-emerald-50 p-3 rounded-lg">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-tajawal text-emerald-700 font-bold">
                جاري تحديث الأجرة والمسافة...
              </span>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveFareCounter;
