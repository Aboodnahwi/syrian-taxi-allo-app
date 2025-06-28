
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, Clock, DollarSign, Star } from 'lucide-react';

interface RideCompletionSummaryProps {
  rideData: {
    totalDistance: number;
    totalFare: number;
    duration: number;
    customerName: string;
    fromLocation: string;
    toLocation: string;
    averageSpeed: number;
  };
  onClose: () => void;
  onNewRide: () => void;
}

const RideCompletionSummary = ({ 
  rideData, 
  onClose, 
  onNewRide 
}: RideCompletionSummaryProps) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    return `${minutes}د`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800 font-cairo">
            تمت الرحلة بنجاح!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* معلومات الرحلة */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600">المسافة</span>
              </div>
              <span className="font-bold text-slate-800">
                {rideData.totalDistance.toFixed(2)} كم
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600">المدة</span>
              </div>
              <span className="font-bold text-slate-800">
                {formatDuration(rideData.duration)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600">السرعة المتوسطة</span>
              </div>
              <span className="font-bold text-slate-800">
                {rideData.averageSpeed.toFixed(0)} كم/س
              </span>
            </div>
          </div>

          {/* الأجرة النهائية */}
          <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-lg font-semibold text-emerald-800">
                  الأجرة المستحقة
                </span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">
                {rideData.totalFare.toLocaleString()} ل.س
              </span>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>الزبون:</strong> {rideData.customerName}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              من {rideData.fromLocation} إلى {rideData.toLocation}
            </p>
          </div>

          {/* الأزرار */}
          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              variant="outline" 
              className="flex-1"
            >
              إغلاق
            </Button>
            <Button 
              onClick={onNewRide}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              رحلة جديدة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideCompletionSummary;
