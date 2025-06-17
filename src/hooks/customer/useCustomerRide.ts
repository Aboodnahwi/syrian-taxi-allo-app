
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
    if (!fromLocation || !toLocation || !fromCoordinates || !toCoordinates) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد نقطة الانطلاق والوجهة",
        variant: "destructive"
      });
      return;
    }
    if (isScheduled && (!scheduleDate || !scheduleTime)) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد تاريخ ووقت الرحلة المجدولة",
        variant: "destructive"
      });
      return;
    }

    // التحقق من المستخدم المصادق عليه محلياً
    const authenticatedUser = localStorage.getItem('authenticated_user');
    if (!authenticatedUser) {
      toast({
        title: "خطأ في المصادقة",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    try {
      const user = JSON.parse(authenticatedUser);
      const scheduledTime = isScheduled ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null;
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      const price = calculatePrice(distance, selectedVehicle);

      console.log("[useCustomerRide] Creating trip with user_id:", user.id);

      const { data, error } = await supabase
        .from('trips')
        .insert({
          customer_id: user.id,
          from_location: fromLocation,
          to_location: toLocation,
          from_coordinates: `(${fromCoordinates[0]},${fromCoordinates[1]})`,
          to_coordinates: `(${toCoordinates[0]},${toCoordinates[1]})`,
          vehicle_type: selectedVehicle,
          distance_km: distance,
          price: price,
          scheduled_time: scheduledTime,
          status: scheduledTime ? 'scheduled' : 'pending'
        })
        .select();

      if (error) {
        console.error("[useCustomerRide] Error creating trip:", error);
        throw error;
      }

      console.log("[useCustomerRide] Trip created successfully:", data);

      toast({
        title: "تم إرسال طلب الرحلة",
        description: "سيتم إشعارك عند العثور على سائق مناسب",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      setFromLocation('');
      setToLocation('');
      setFromCoordinates(null);
      setToCoordinates(null);
      setRoute([]);
    } catch (error: any) {
      console.error("[useCustomerRide] Error in requestRide:", error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  }, [
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
