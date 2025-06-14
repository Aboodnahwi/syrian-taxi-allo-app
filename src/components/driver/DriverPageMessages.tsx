
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface DriverPageMessagesProps {
  activeRide: any;
  isOnline: boolean;
  rideRequestsCount: number;
  toggleOnlineStatus: () => void;
}

const DriverPageMessages = ({ activeRide, isOnline, rideRequestsCount, toggleOnlineStatus }: DriverPageMessagesProps) => {
  return (
    <>
      {/* رسالة عدم وجود طلبات */}
      {!activeRide && isOnline && rideRequestsCount === 0 && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <Card className="bg-white/90 backdrop-blur-sm border-0">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-slate-800 font-semibold font-cairo mb-2">لا توجد طلبات حالياً</h3>
              <p className="text-slate-600 font-tajawal text-sm">
                ستظهر الطلبات الجديدة هنا عندما يطلبها الزبائن
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* رسالة عدم الاتصال */}
      {!isOnline && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-600">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-white font-semibold font-cairo mb-2">غير متصل</h3>
              <p className="text-slate-300 font-tajawal text-sm mb-4">
                اضغط على "متصل" في الأعلى لبدء استقبال الطلبات
              </p>
              <Button 
                onClick={toggleOnlineStatus}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                بدء العمل
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default DriverPageMessages;
