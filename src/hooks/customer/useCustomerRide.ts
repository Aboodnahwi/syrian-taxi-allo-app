
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCustomerRideProps {
  userId: string;
  fromLocation: string;
  toLocation: string;
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  selectedVehicle: string;
  calculatePrice: (distance: number, vehicleType: string) => number;
  calculateDirectDistance: (from: [number, number], to: [number, number]) => number;
  toast: (options: any) => void;
  setFromLocation: (location: string) => void;
  setToLocation: (location: string) => void;
  setFromCoordinates: (coords: [number, number] | null) => void;
  setToCoordinates: (coords: [number, number] | null) => void;
  setRoute: (route: Array<[number, number]>) => void;
}

export const useCustomerRide = ({
  userId,
  fromLocation,
  toLocation,
  fromCoordinates,
  toCoordinates,
  selectedVehicle,
  calculatePrice,
  calculateDirectDistance,
  toast,
  setFromLocation,
  setToLocation,
  setFromCoordinates,
  setToCoordinates,
  setRoute
}: UseCustomerRideProps) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const requestRide = useCallback(async () => {
    console.log('[useCustomerRide] Starting ride request...');
    
    try {
      // التحقق من البيانات المطلوبة
      if (!fromLocation || !toLocation || !fromCoordinates || !toCoordinates) {
        console.log('[useCustomerRide] Missing location data');
        toast({
          title: "بيانات ناقصة",
          description: "يرجى تحديد نقطة الانطلاق والوجهة",
          variant: "destructive"
        });
        return;
      }

      if (isScheduled && (!scheduleDate || !scheduleTime)) {
        console.log('[useCustomerRide] Missing schedule data');
        toast({
          title: "بيانات ناقصة",
          description: "يرجى تحديد تاريخ ووقت الرحلة المجدولة",
          variant: "destructive"
        });
        return;
      }

      // التحقق من الجلسة الحالية
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[useCustomerRide] Session error:', sessionError);
        throw new Error('خطأ في المصادقة: ' + sessionError.message);
      }

      if (!session || !session.user) {
        console.error('[useCustomerRide] No valid session');
        throw new Error('يرجى تسجيل الدخول أولاً');
      }

      // حساب البيانات
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      const price = calculatePrice(distance, selectedVehicle);
      const scheduledTime = isScheduled ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null;

      console.log('[useCustomerRide] Calculated data:', {
        distance: distance.toFixed(2),
        price,
        scheduledTime,
        userId: session.user.id
      });

      // التحقق من صحة التاريخ المجدول
      if (scheduledTime) {
        const scheduledDateTime = new Date(scheduledTime);
        const now = new Date();
        
        if (scheduledDateTime <= now) {
          throw new Error('يجب أن يكون وقت الرحلة في المستقبل');
        }
      }

      // إعداد بيانات الرحلة
      const tripData = {
        customer_id: session.user.id,
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        from_coordinates: `(${fromCoordinates[0]},${fromCoordinates[1]})`,
        to_coordinates: `(${toCoordinates[0]},${toCoordinates[1]})`,
        vehicle_type: selectedVehicle,
        distance_km: Math.round(distance * 100) / 100, // تقريب إلى رقمين عشريين
        price: Math.round(price),
        scheduled_time: scheduledTime,
        status: scheduledTime ? 'scheduled' : 'pending'
      };

      console.log('[useCustomerRide] Inserting trip data:', tripData);

      // إرسال الطلب إلى قاعدة البيانات
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) {
        console.error('[useCustomerRide] Database error:', error);
        
        // معالجة أخطاء محددة
        if (error.code === '42501') {
          throw new Error('ليس لديك صلاحية لإنشاء رحلة. يرجى المحاولة مرة أخرى.');
        } else if (error.code === '23505') {
          throw new Error('يوجد طلب مماثل قيد المعالجة');
        } else {
          throw new Error(`خطأ في إنشاء الرحلة: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('لم يتم إنشاء الرحلة بنجاح');
      }

      console.log('[useCustomerRide] Trip created successfully:', data);

      // عرض رسالة نجاح
      toast({
        title: "تم إرسال طلب الرحلة بنجاح ✅",
        description: isScheduled 
          ? `تم جدولة رحلتك لـ ${new Date(scheduledTime!).toLocaleDateString('ar-SY')} في ${new Date(scheduledTime!).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`
          : "سيتم إشعارك عند العثور على سائق مناسب",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      // إعادة تعيين البيانات
      setFromLocation('');
      setToLocation('');
      setFromCoordinates(null);
      setToCoordinates(null);
      setRoute([]);
      setIsScheduled(false);
      setScheduleDate('');
      setScheduleTime('');
      
    } catch (error: any) {
      console.error('[useCustomerRide] Error in requestRide:', error);
      
      let errorMessage = "حدث خطأ غير متوقع";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في إرسال الطلب",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [
    userId,
    fromLocation,
    toLocation,
    fromCoordinates,
    toCoordinates,
    isScheduled,
    scheduleDate,
    scheduleTime,
    selectedVehicle,
    calculatePrice,
    calculateDirectDistance,
    toast,
    setFromLocation,
    setToLocation,
    setFromCoordinates,
    setToCoordinates,
    setRoute
  ]);

  return {
    isScheduled,
    setIsScheduled,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    requestRide
  };
};
