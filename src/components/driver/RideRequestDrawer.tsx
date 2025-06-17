
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, User, MapPin, Clock, Phone } from 'lucide-react';

interface RideRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  from_location: string;
  to_location: string;
  from_coordinates: [number, number];
  to_coordinates: [number, number];
  price: number;
  distance_km: number;
  estimated_duration: number;
  vehicle_type: string;
  urgent: boolean;
  created_at: string;
}

interface RideRequestDrawerProps {
  rideRequests: RideRequest[];
  acceptRide: (request: RideRequest) => void;
  rejectRide: (requestId: string) => void;
  loading: boolean;
}

const RideRequestDrawer = ({ rideRequests, acceptRide, rejectRide, loading }: RideRequestDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-white/95 backdrop-blur-sm p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-2">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      {/* لسان التحكم */}
      <div className="flex justify-center">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-lg rounded-t-lg rounded-b-none px-8 py-2"
          size="sm"
        >
          <span className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            طلبات الرحلات ({rideRequests.length})
          </span>
        </Button>
      </div>

      {/* محتوى الدرج */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 max-h-[70vh] overflow-y-auto">
          <div className="p-4 space-y-3">
            {rideRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 font-tajawal">لا توجد طلبات متاحة حالياً</p>
                <p className="text-sm text-slate-500 mt-1">ستصلك إشعار عند وجود طلبات جديدة</p>
              </div>
            ) : (
              rideRequests.map((request) => (
                <Card key={request.id} className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-slate-600" />
                        <span className="font-semibold text-slate-800">{request.customer_name}</span>
                        {request.urgent && (
                          <Badge className="bg-red-500 text-white text-xs">قريب منك</Badge>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-emerald-600">{request.price.toLocaleString()} ل.س</p>
                        <p className="text-xs text-slate-500">{request.distance_km.toFixed(1)} كم</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-600">من:</span>
                        <span className="font-semibold flex-1">{request.from_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-slate-600">إلى:</span>
                        <span className="font-semibold flex-1">{request.to_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">المدة المتوقعة:</span>
                        <span className="font-semibold">{request.estimated_duration} دقيقة</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => acceptRide(request)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        size="sm"
                      >
                        قبول الرحلة
                      </Button>
                      <Button 
                        onClick={() => rejectRide(request.id)}
                        variant="outline"
                        className="px-4 border-red-200 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        رفض
                      </Button>
                      {request.customer_phone && (
                        <Button 
                          variant="outline"
                          className="px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                          size="sm"
                          onClick={() => window.open(`tel:${request.customer_phone}`)}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RideRequestDrawer;
