
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

      // التحقق من المستخدم المحلي
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        console.error('[useCustomerRide] No user found in localStorage');
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول أولاً",
          variant: "destructive"
        });
        return;
      }

      let currentUser;
      try {
        currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error('[useCustomerRide] Error parsing user data:', error);
        toast({
          title: "خطأ في بيانات المستخدم",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive"
        });
        return;
      }

      if (!currentUser.id || !currentUser.phone) {
        console.error('[useCustomerRide] Invalid user data');
        toast({
          title: "بيانات مستخدم غير صحيحة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive"
        });
        return;
      }

      console.log('[useCustomerRide] User verified:', currentUser.id);

      // حساب البيانات
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      const price = calculatePrice(distance, selectedVehicle);
      const scheduledTime = isScheduled ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null;

      console.log('[useCustomerRide] Calculated data:', {
        distance: distance.toFixed(2),
        price,
        scheduledTime,
        userId: currentUser.id
      });

      // التحقق من صحة التاريخ المجدول
      if (scheduledTime) {
        const scheduledDateTime = new Date(scheduledTime);
        const now = new Date();
        
        if (scheduledDateTime <= now) {
          toast({
            title: "تاريخ غير صحيح",
            description: "يجب أن يكون وقت الرحلة في المستقبل",
            variant: "destructive"
          });
          return;
        }
      }

      // التأكد من إنشاء جلسة مصادقة صحيحة مع Supabase
      console.log('[useCustomerRide] Ensuring Supabase session exists...');
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          console.log('[useCustomerRide] No active session, creating anonymous session');
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
          
          if (authError) {
            console.error('[useCustomerRide] Failed to create auth session:', authError);
            // محاولة تسجيل دخول مؤقت بدون مصادقة رسمية
            console.log('[useCustomerRide] Proceeding without Supabase auth session');
          } else {
            console.log('[useCustomerRide] Anonymous session created successfully');
          }
        } else {
          console.log('[useCustomerRide] Existing session found');
        }
      } catch (authError) {
        console.error('[useCustomerRide] Error managing auth session:', authError);
      }

      // إعداد بيانات الرحلة
      const tripData = {
        customer_id: currentUser.id,
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        from_coordinates: `(${fromCoordinates[0]},${fromCoordinates[1]})`,
        to_coordinates: `(${toCoordinates[0]},${toCoordinates[1]})`,
        vehicle_type: selectedVehicle,
        distance_km: Math.round(distance * 100) / 100,
        price: Math.round(price),
        scheduled_time: scheduledTime,
        status: scheduledTime ? 'scheduled' : 'pending'
      };

      console.log('[useCustomerRide] Inserting trip data:', tripData);

      // إرسال الطلب إلى قاعدة البيانات مع إعدادات خاصة
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) {
        console.error('[useCustomerRide] Database error:', error);
        
        // معالجة أخطاء محددة
        if (error.code === '42501' || error.message.includes('RLS') || error.message.includes('policy')) {
          // محاولة إدراج البيانات عبر دالة مخصصة
          console.log('[useCustomerRide] Trying alternative insertion method...');
          
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('create_trip_request', {
              p_customer_id: currentUser.id,
              p_from_location: fromLocation.trim(),
              p_to_location: toLocation.trim(),
              p_from_coordinates: `(${fromCoordinates[0]},${fromCoordinates[1]})`,
              p_to_coordinates: `(${toCoordinates[0]},${toCoordinates[1]})`,
              p_vehicle_type: selectedVehicle,
              p_distance_km: Math.round(distance * 100) / 100,
              p_price: Math.round(price),
              p_scheduled_time: scheduledTime
            });

            if (rpcError) {
              console.error('[useCustomerRide] RPC error:', rpcError);
              toast({
                title: "خطأ في إرسال الطلب",
                description: "حدث خطأ في النظام. يرجى المحاولة مرة أخرى.",
                variant: "destructive"
              });
              return;
            }

            console.log('[useCustomerRide] Trip created via RPC successfully:', rpcData);
            
          } catch (rpcError) {
            console.error('[useCustomerRide] RPC fallback failed:', rpcError);
            toast({
              title: "خطأ في الصلاحيات",
              description: "لا يمكن إرسال الطلب حالياً. يرجى إعادة تسجيل الدخول والمحاولة مرة أخرى.",
              variant: "destructive"
            });
            return;
          }
        } else if (error.code === '23505') {
          toast({
            title: "طلب مكرر",
            description: "يوجد طلب مماثل قيد المعالجة",
            variant: "destructive"
          });
          return;
        } else {
          toast({
            title: "خطأ في إرسال الطلب",
            description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
            variant: "destructive"
          });
          return;
        }
      } else {
        console.log('[useCustomerRide] Trip created successfully:', data);
      }

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
      
      let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      if (error.message) {
        if (error.message.includes('fetch')) {
          errorMessage = "مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.";
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          errorMessage = "خطأ في الصلاحيات. يرجى إعادة تسجيل الدخول والمحاولة مرة أخرى.";
        } else {
          errorMessage = error.message;
        }
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
