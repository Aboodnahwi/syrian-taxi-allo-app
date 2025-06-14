
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Phone } from 'lucide-react';

interface ActiveRideCardProps {
  activeRide: any;
  rideStatus: 'accepted' | 'arrived' | 'started' | 'completed' | null;
  updateRideStatus: (status: 'arrived' | 'started' | 'completed') => void;
}

const ActiveRideCard = ({ activeRide, rideStatus, updateRideStatus }: ActiveRideCardProps) => {
  if (!activeRide) return null;

  return (
    <div className="absolute top-20 left-4 right-4 z-30">
      <Card className="bg-white/95 backdrop-blur-sm border-emerald-200 border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-800 font-cairo text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            رحلة نشطة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600 font-tajawal">الزبون:</span>
              <p className="font-semibold text-slate-800">{activeRide.customerName}</p>
            </div>
            <div>
              <span className="text-slate-600 font-tajawal">السعر:</span>
              <p className="font-semibold text-emerald-600">{activeRide.price.toLocaleString()} ل.س</p>
            </div>
            <div>
              <span className="text-slate-600 font-tajawal">من:</span>
              <p className="font-semibold text-slate-800">{activeRide.from}</p>
            </div>
            <div>
              <span className="text-slate-600 font-tajawal">إلى:</span>
              <p className="font-semibold text-slate-800">{activeRide.to}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {rideStatus === 'accepted' && (
              <Button 
                onClick={() => updateRideStatus('arrived')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                وصلت للزبون
              </Button>
            )}
            {rideStatus === 'arrived' && (
              <Button 
                onClick={() => updateRideStatus('started')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                بدء الرحلة
              </Button>
            )}
            {rideStatus === 'started' && (
              <Button 
                onClick={() => updateRideStatus('completed')}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
              >
                انتهاء الرحلة
              </Button>
            )}
            <Button 
              variant="outline"
              className="px-3 border-slate-300 hover:bg-slate-50"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveRideCard;
