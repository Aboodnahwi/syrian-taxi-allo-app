
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";

interface VehicleType {
  id: string;
  name: string;
  price: number;
  icon: string;
  color: string;
}

interface OrderPanelProps {
  orderOpen: boolean;
  setOrderOpen: (open: boolean) => void;
  vehicleTypes: VehicleType[];
  selectedVehicle: string;
  setSelectedVehicle: (type: string) => void;
  fromLocation: string;
  toLocation: string;
  routeDistance: number;
  estimatedPrice: number;
  isScheduled: boolean;
  setIsScheduled: (v: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleTime: string;
  setScheduleTime: (v: string) => void;
  requestRide: () => void;
}

const OrderPanel = ({
  orderOpen,
  setOrderOpen,
  vehicleTypes,
  selectedVehicle,
  setSelectedVehicle,
  fromLocation,
  toLocation,
  routeDistance,
  estimatedPrice,
  isScheduled,
  setIsScheduled,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  requestRide
}: OrderPanelProps) => {
  
  // الحصول على التاريخ والوقت الحالي
  const now = new Date();
  const todayString = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  
  // تحديد الحد الأدنى للوقت
  const minTime = scheduleDate === todayString ? currentTime : "00:00";

  // تنسيق عرض التاريخ والوقت المحدد
  const formatScheduledDateTime = () => {
    if (!scheduleDate || !scheduleTime) return null;
    
    try {
      const scheduledDate = new Date(`${scheduleDate}T${scheduleTime}`);
      const isToday = scheduleDate === todayString;
      const isTomorrow = scheduleDate === new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let dayText = '';
      if (isToday) {
        dayText = 'اليوم';
      } else if (isTomorrow) {
        dayText = 'غداً';
      } else {
        dayText = scheduledDate.toLocaleDateString('ar-SY', { 
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      }
      
      const timeText = scheduledDate.toLocaleTimeString('ar-SY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return `${dayText} في ${timeText}`;
    } catch (error) {
      return 'تاريخ غير صحيح';
    }
  };

  return (
    <Collapsible open={orderOpen} onOpenChange={setOrderOpen} className="absolute left-0 right-0 bottom-0 z-50">
      <CollapsibleTrigger
        className={`w-full flex justify-center items-center py-2 transition-all hover:bg-slate-200/80 border-t bg-white/95 shadow-lg rounded-t-2xl ${
          orderOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label={orderOpen ? "إغلاق" : "فتح لوحة طلب الرحلة"}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="w-10 h-1.5 rounded bg-slate-300 mb-0.5"></span>
          <ChevronUp className="w-6 h-6 text-slate-500 animate-bounce" />
          <span className="font-tajawal text-xs text-slate-700 mt-0.5">طلب رحلة</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className={`w-full animate-accordion-down bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-t-3xl data-[state=closed]:hidden max-h-[80vh] overflow-y-auto`}>
        <div className="flex justify-center">
          <button
            className="w-12 h-8 -mb-1 bg-slate-100 rounded-b-lg flex flex-col items-center z-10 mt-2 shadow hover:bg-slate-200"
            onClick={() => setOrderOpen(false)}
          >
            <ChevronDown className="w-6 h-6 text-slate-500" />
            <span className="font-tajawal text-[10px] text-slate-600 leading-none">إغلاق</span>
          </button>
        </div>
        <Card className="bg-transparent border-0 shadow-none rounded-t-3xl m-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-800 font-cairo text-lg">اختر نوع المركبة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {vehicleTypes.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`min-w-[120px] p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVehicle === vehicle.id
                      ? "border-taxi-500 bg-taxi-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full ${vehicle.color} flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-2xl">{vehicle.icon}</span>
                    </div>
                    <p className="text-xs font-tajawal text-slate-700 mb-1">{vehicle.name}</p>
                    <p className="text-xs font-bold text-slate-800">{vehicle.price.toLocaleString()} ل.س</p>
                  </div>
                </div>
              ))}
            </div>
            
            {fromLocation && toLocation && routeDistance > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-tajawal">المسافة:</span>
                  <span className="font-semibold text-slate-800">{routeDistance.toFixed(1)} كم</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-tajawal">السعر المتوقع:</span>
                  <span className="text-lg font-bold text-emerald-600">{estimatedPrice.toLocaleString()} ل.س</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant={!isScheduled ? "default" : "outline"} 
                onClick={() => setIsScheduled(false)} 
                className="flex-1"
              >
                اطلب الآن
              </Button>
              <Button 
                variant={isScheduled ? "default" : "outline"} 
                onClick={() => setIsScheduled(true)} 
                className="flex-1"
              >
                <Calendar className="w-4 h-4 ml-2" />
                جدولة الرحلة
              </Button>
            </div>
            
            {isScheduled && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-blue-800 font-semibold font-tajawal">حدد موعد الرحلة</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-700 font-tajawal">
                        📅 التاريخ
                      </label>
                      <input 
                        type="date" 
                        value={scheduleDate} 
                        onChange={e => setScheduleDate(e.target.value)}
                        min={todayString}
                        className="w-full bg-white border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-700 font-tajawal">
                        🕐 الوقت
                      </label>
                      <input 
                        type="time" 
                        value={scheduleTime} 
                        onChange={e => setScheduleTime(e.target.value)}
                        min={minTime}
                        className="w-full bg-white border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        required
                      />
                    </div>
                  </div>
                  
                  {scheduleDate && scheduleTime && (
                    <div className="mt-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-800 font-tajawal">
                            موعد الرحلة المحدد:
                          </p>
                          <p className="text-lg font-bold text-green-700 font-cairo">
                            {formatScheduledDateTime()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button
              onClick={requestRide}
              className="w-full btn-taxi text-lg py-4 font-semibold"
              disabled={!fromLocation || !toLocation || (isScheduled && (!scheduleDate || !scheduleTime))}
            >
              {isScheduled ? "📅 جدولة الرحلة" : "🚗 طلب الرحلة الآن"}
            </Button>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OrderPanel;
