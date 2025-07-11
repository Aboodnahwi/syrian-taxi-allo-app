
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Car, User, Phone } from 'lucide-react';

interface RideStatusDisplayProps {
  rideStatus: 'pending' | 'accepted' | 'arrived' | 'started' | 'completed';
  driverName?: string;
  driverPhone?: string;
  estimatedArrival?: number;
  currentLocation?: string;
}

const RideStatusDisplay = ({
  rideStatus,
  driverName,
  driverPhone,
  estimatedArrival,
  currentLocation
}: RideStatusDisplayProps) => {
  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'pending':
        return {
          title: 'البحث عن سائق',
          message: 'نحن نبحث عن أقرب سائق متاح لك...',
          color: 'bg-yellow-500',
          icon: <Clock className="w-6 h-6 text-white" />
        };
      case 'accepted':
        return {
          title: 'تم قبول الرحلة',
          message: 'السائق في طريقه إليك الآن',
          color: 'bg-blue-500',
          icon: <Car className="w-6 h-6 text-white" />
        };
      case 'arrived':
        return {
          title: 'وصل السائق',
          message: 'السائق وصل إلى موقعك',
          color: 'bg-green-500',
          icon: <MapPin className="w-6 h-6 text-white" />
        };
      case 'started':
        return {
          title: 'بدأت الرحلة',
          message: 'أنت الآن في طريقك إلى الوجهة',
          color: 'bg-emerald-500',
          icon: <Car className="w-6 h-6 text-white" />
        };
      case 'completed':
        return {
          title: 'انتهت الرحلة',
          message: 'وصلت إلى وجهتك بأمان',
          color: 'bg-purple-500',
          icon: <MapPin className="w-6 h-6 text-white" />
        };
      default:
        return {
          title: 'حالة غير معروفة',
          message: '',
          color: 'bg-gray-500',
          icon: <Clock className="w-6 h-6 text-white" />
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-auto">
      <Card className="bg-white border-2 border-slate-200 shadow-2xl max-w-sm mx-auto">
        <CardContent className="p-6">
          {/* حالة الرحلة */}
          <div className="text-center mb-6">
            <div className={`${statusInfo.color} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
              {statusInfo.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-tajawal mb-2">
              {statusInfo.title}
            </h3>
            <p className="text-slate-600 font-tajawal">
              {statusInfo.message}
            </p>
          </div>

          {/* معلومات السائق */}
          {(rideStatus === 'accepted' || rideStatus === 'arrived' || rideStatus === 'started') && driverName && (
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-tajawal">السائق</p>
                  <p className="font-bold text-slate-800 font-tajawal">{driverName}</p>
                </div>
              </div>
              
              {driverPhone && (
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-tajawal">رقم الهاتف</p>
                    <p className="font-bold text-slate-800 font-cairo" dir="ltr">{driverPhone}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الوقت المتوقع للوصول */}
          {estimatedArrival && rideStatus === 'accepted' && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500 font-tajawal">الوقت المتوقع للوصول</p>
                  <p className="font-bold text-blue-800 font-cairo">{estimatedArrival} دقيقة</p>
                </div>
              </div>
            </div>
          )}

          {/* الموقع الحالي */}
          {currentLocation && rideStatus === 'started' && (
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-slate-500 font-tajawal">الموقع الحالي</p>
                  <p className="font-bold text-emerald-800 font-tajawal">{currentLocation}</p>
                </div>
              </div>
            </div>
          )}

          {/* مؤشر التحميل للحالات التي تتطلب انتظار */}
          {(rideStatus === 'pending' || rideStatus === 'accepted') && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RideStatusDisplay;
