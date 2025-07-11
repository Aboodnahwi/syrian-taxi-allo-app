
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, MapPin, Clock, Navigation, User, Play, Stop, Flag } from 'lucide-react';

interface LiveFareCounterProps {
  currentFare: number;
  distance: number;
  duration: number;
  speed: number;
  customerName?: string;
  isActive: boolean;
  activeRide?: any;
  rideStatus?: 'accepted' | 'arrived' | 'started' | 'completed' | null;
  onUpdateRideStatus?: (status: 'arrived' | 'started' | 'completed') => void;
}

const LiveFareCounter = ({ 
  currentFare, 
  distance, 
  duration, 
  speed, 
  customerName,
  isActive,
  activeRide,
  rideStatus,
  onUpdateRideStatus
}: LiveFareCounterProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('ar-SA'),
      time: now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime();

  if (!isActive || !activeRide) return null;

  const getStatusButton = () => {
    if (rideStatus === 'accepted') {
      return (
        <Button 
          onClick={() => onUpdateRideStatus?.('arrived')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-2xl py-6 font-cairo"
          size="lg"
        >
          <Navigation className="w-8 h-8 ml-3" />
          وصلت إلى الزبون
        </Button>
      );
    } else if (rideStatus === 'arrived') {
      return (
        <Button 
          onClick={() => onUpdateRideStatus?.('started')}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-2xl py-6 font-cairo"
          size="lg"
        >
          <Play className="w-8 h-8 ml-3" />
          بدء الرحلة
        </Button>
      );
    } else if (rideStatus === 'started') {
      return (
        <Button 
          onClick={() => onUpdateRideStatus?.('completed')}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-2xl py-6 font-cairo"
          size="lg"
        >
          <Flag className="w-8 h-8 ml-3" />
          إنهاء الرحلة
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white/98 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white border-emerald-400 border-4 shadow-2xl">
        <CardContent className="p-12">
          {/* التاريخ والوقت */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg">
              <div className="text-xl font-cairo text-slate-700">
                التاريخ: {date}
              </div>
              <div className="text-xl font-cairo text-slate-700">
                الوقت: {time}
              </div>
            </div>
          </div>

          {/* العداد الرئيسي للأجرة */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="bg-emerald-500 p-6 rounded-full shadow-lg">
                <DollarSign className="w-16 h-16 text-white" />
              </div>
              <span className="text-3xl text-slate-700 font-tajawal font-bold">الأجرة الحالية</span>
            </div>
            <div className="relative mb-6">
              <div className="text-9xl font-bold text-emerald-600 font-cairo animate-pulse">
                {currentFare.toLocaleString()}
              </div>
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-6 py-3 rounded-full text-xl animate-pulse shadow-lg">
                LIVE
              </div>
            </div>
            <div className="text-4xl text-slate-600 font-tajawal mt-4">ليرة سورية</div>
          </div>

          {/* اسم الزبون */}
          {customerName && (
            <div className="text-center mb-8 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-center gap-4 mb-4">
                <User className="w-8 h-8 text-blue-600" />
                <span className="text-xl text-blue-600 font-tajawal font-bold">رحلة الزبون</span>
              </div>
              <div className="text-3xl font-bold text-blue-800 font-cairo">{customerName}</div>
            </div>
          )}

          {/* معلومات الرحلة */}
          <div className="grid grid-cols-3 gap-8 text-center border-t-2 border-slate-200 pt-8 mb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-blue-100 p-6 rounded-full shadow-md">
                <MapPin className="w-10 h-10 text-blue-600" />
              </div>
              <span className="text-lg text-slate-500 font-tajawal">المسافة</span>
              <span className="text-4xl font-bold text-blue-600 font-cairo">
                {distance.toFixed(2)}
              </span>
              <span className="text-lg text-blue-500">كيلومتر</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="bg-purple-100 p-6 rounded-full shadow-md">
                <Clock className="w-10 h-10 text-purple-600" />
              </div>
              <span className="text-lg text-slate-500 font-tajawal">الوقت</span>
              <span className="text-4xl font-bold text-purple-600 font-cairo">
                {formatDuration(duration)}
              </span>
              <span className="text-lg text-purple-500">دقيقة:ثانية</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="bg-orange-100 p-6 rounded-full shadow-md">
                <Navigation className="w-10 h-10 text-orange-600" />
              </div>
              <span className="text-lg text-slate-500 font-tajawal">السرعة</span>
              <span className="text-4xl font-bold text-orange-600 font-cairo">
                {speed.toFixed(0)}
              </span>
              <span className="text-lg text-orange-500">كم/ساعة</span>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="space-y-6">
            {getStatusButton()}
            
            {/* مؤشر الحالة النشطة */}
            <div className="flex items-center justify-center gap-4 bg-emerald-50 p-6 rounded-lg border-2 border-emerald-200">
              <div className="w-6 h-6 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-2xl font-tajawal text-emerald-700 font-bold">
                {rideStatus === 'accepted' && 'في الطريق إلى الزبون...'}
                {rideStatus === 'arrived' && 'وصلت إلى الزبون'}
                {rideStatus === 'started' && 'جاري تحديث الأجرة والمسافة...'}
              </span>
              <div className="w-6 h-6 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center text-lg text-slate-600">
              <p className="font-tajawal">العداد يعمل وفقاً لمعايير الإدارة</p>
              <p className="mt-2 font-tajawal">المسافة × السعر + الوقت + عوامل الذروة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveFareCounter;
