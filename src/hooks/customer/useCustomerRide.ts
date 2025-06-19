
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
    console.log('[useCustomerRide] Data:', {
      userId,
      fromLocation,
      toLocation,
      fromCoordinates,
      toCoordinates,
      selectedVehicle,
      isScheduled,
      scheduleDate,
      scheduleTime
    });

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

    if (!userId) {
      console.log('[useCustomerRide] Missing user ID');
      toast({
        title: "خطأ في المصادقة",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    try {
      const scheduledTime = isScheduled ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null;
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      const price = calculatePrice(distance, selectedVehicle);

      console.log('[useCustomerRide] Calculated data:', {
        distance,
        price,
        scheduledTime
      });

      const tripData = {
        customer_id: userId,
        from_location: fromLocation,
        to_location: toLocation,
        from_coordinates: `(${fromCoordinates[0]},${fromCoordinates[1]})`,
        to_coordinates: `(${toCoordinates[0]},${toCoordinates[1]})`,
        vehicle_type: selectedVehicle,
        distance_km: distance,
        price: price,
        scheduled_time: scheduledTime,
        status: scheduledTime ? 'scheduled' : 'pending'
      };

      console.log('[useCustomerRide] Inserting trip data:', tripData);

      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select();

      if (error) {
        console.error('[useCustomerRide] Database error:', error);
        throw new Error(`خطأ في قاعدة البيانات: ${error.message}`);
      }

      console.log('[useCustomerRide] Trip created successfully:', data);

      toast({
        title: "تم إرسال طلب الرحلة",
        description: "سيتم إشعارك عند العثور على سائق مناسب",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      // إعادة تعيين البيانات
      setFromLocation('');
      setToLocation('');
      setFromCoordinates(null);
      setToCoordinates(null);
      setRoute([]);
      
    } catch (error: any) {
      console.error('[useCustomerRide] Full error details:', error);
      
      let errorMessage = "حدث خطأ غير متوقع";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `خطأ في النظام (${error.code})`;
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
