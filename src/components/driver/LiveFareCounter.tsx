
import React from 'react';
import { DollarSign, Clock, MapPin, Square, Map as MapIcon, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LiveFareCounterProps {
  currentFare: number;
  startTime: Date;
  distance: number;
}

interface EnhancedLiveFareCounterProps extends LiveFareCounterProps {
  duration?: number;
  speed?: number;
  customerName?: string;
  isActive?: boolean;
  activeRide?: any;
  rideStatus?: 'accepted' | 'arrived' | 'started' | 'completed' | null;
  onUpdateRideStatus?: (status: 'arrived' | 'started' | 'completed') => Promise<void>;
}

const LiveFareCounter: React.FC<EnhancedLiveFareCounterProps> = ({
  currentFare,
  startTime,
  distance,
  duration = 0,
  speed = 0,
  customerName,
  isActive = false,
  activeRide,
  rideStatus,
  onUpdateRideStatus
}) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [showCounter, setShowCounter] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // إذا لم يكن نشطًا، إخفاء المكون
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* شريط التبديل العلوي */}
      <div className="bg-white shadow-lg p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 font-cairo">عداد الرحلة</h2>
        <div className="flex gap-2">
          <Button
            variant={showCounter ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCounter(true)}
            className="text-sm font-cairo"
          >
            <Calculator className="w-4 h-4 mr-1" />
            العداد
          </Button>
          <Button
            variant={!showCounter ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCounter(false)}
            className="text-sm font-cairo"
          >
            <MapIcon className="w-4 h-4 mr-1" />
            الخريطة
          </Button>
        </div>
      </div>

      {/* محتوى العداد أو إخفاؤه */}
      {showCounter ? (
        <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-br from-emerald-600 to-blue-600">
          {/* معلومات الزبون */}
          {customerName && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 w-full max-w-md">
              <p className="text-white text-center font-cairo text-lg">
                الزبون: <span className="font-bold">{customerName}</span>
              </p>
            </div>
          )}

          {/* العداد الرئيسي */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl w-full max-w-md mb-6">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* الأجرة الحالية */}
                <div>
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                  <div className="text-5xl font-bold text-emerald-600 mb-2">
                    {currentFare.toLocaleString()}
                  </div>
                  <div className="text-lg text-slate-600 font-cairo">ليرة سورية</div>
                </div>

                {/* المعلومات الإضافية */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                  <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-xl font-bold text-slate-800">
                      {duration > 0 ? formatTime(duration) : formatTime(elapsedTime)}
                    </div>
                    <div className="text-sm text-slate-600 font-cairo">الوقت</div>
                  </div>
                  
                  <div className="text-center">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-xl font-bold text-slate-800">
                      {distance.toFixed(1)}
                    </div>
                    <div className="text-sm text-slate-600 font-cairo">كيلومتر</div>
                  </div>
                </div>

                {/* السرعة إذا كانت متاحة */}
                {speed > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800">{speed.toFixed(1)} كم/س</div>
                      <div className="text-sm text-slate-600 font-cairo">السرعة الحالية</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* حالة الرحلة */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 w-full max-w-md">
            <div className="flex items-center justify-center gap-2">
              <Square className="w-4 h-4 text-red-400" />
              <span className="text-white font-cairo text-lg">
                {rideStatus === 'accepted' && 'في الطريق للزبون'}
                {rideStatus === 'arrived' && 'وصلت للزبون - في انتظار البدء'}
                {rideStatus === 'started' && 'الرحلة جارية'}
              </span>
            </div>
          </div>

          {/* أزرار التحكم */}
          {onUpdateRideStatus && (
            <div className="w-full max-w-md space-y-3">
              {rideStatus === 'accepted' && (
                <Button 
                  onClick={() => onUpdateRideStatus('arrived')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-cairo text-lg py-4"
                  size="lg"
                >
                  أنا ذاهب باتجاه الزبون
                </Button>
              )}
              {rideStatus === 'arrived' && (
                <Button 
                  onClick={() => onUpdateRideStatus('started')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-cairo text-lg py-4"
                  size="lg"
                >
                  بدء الرحلة
                </Button>
              )}
              {rideStatus === 'started' && (
                <Button 
                  onClick={() => onUpdateRideStatus('completed')}
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white font-cairo text-lg py-4"
                  size="lg"
                >
                  انتهاء الرحلة
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // عرض الخريطة (نحتاج لتمرير خريطة من المكون الرئيسي)
        <div className="flex-1 bg-slate-200 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <MapIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="font-cairo text-lg">الخريطة التفاعلية</p>
            <p className="text-sm">سيتم دمج الخريطة هنا</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFareCounter;
