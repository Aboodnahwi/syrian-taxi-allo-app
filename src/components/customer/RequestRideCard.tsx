
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, Car } from 'lucide-react';

interface RequestRideCardProps {
  onConfirm: (destination: string) => void;
  isLoading: boolean;
  location?: string;
}

const RequestRideCard: React.FC<RequestRideCardProps> = ({
  onConfirm,
  isLoading,
  location
}) => {
  const [destination, setDestination] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      onConfirm(destination);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-xl border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-right font-cairo text-slate-800">طلب رحلة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div className="flex-1 text-right">
            <p className="text-sm text-slate-600 font-tajawal">موقعك الحالي</p>
            <p className="text-sm font-semibold text-slate-800 font-tajawal">
              {location || 'يرجى تحديد الموقع على الخريطة'}
            </p>
          </div>
        </div>

        {/* Destination Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 font-tajawal">الوجهة</label>
            <Input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="أدخل وجهتك"
              className="text-right font-tajawal"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-taxi-500 to-emerald-500 hover:from-taxi-600 hover:to-emerald-600 text-white font-bold py-3 font-tajawal"
            disabled={isLoading || !destination.trim() || !location}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري البحث عن سائق...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <Car className="w-5 h-5" />
                <span>طلب رحلة</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestRideCard;
