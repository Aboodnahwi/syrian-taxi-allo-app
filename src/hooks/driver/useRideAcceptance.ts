
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RideRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  from_location: string;
  to_location: string;
  from_coordinates: [number, number];
  to_coordinates: [number, number];
  vehicle_type: string;
  price: number;
  distance_km: number;
  estimated_duration?: number;
  customer_phone?: string;
}

export const useRideAcceptance = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const acceptRide = async (request: RideRequest, driverId: string, driverName: string) => {
    setLoading(true);
    try {
      console.log('محاولة قبول الرحلة:', {
        requestId: request.id,
        driverId,
        driverName,
        customerName: request.customer_name
      });

      // التحقق أولاً من أن الرحلة ما زالت متاحة
      const { data: existingTrip, error: checkError } = await supabase
        .from('trips')
        .select('id, status, driver_id')
        .eq('id', request.id)
        .single();

      if (checkError) {
        console.error('خطأ في التحقق من الرحلة:', checkError);
        throw new Error('تعذر التحقق من حالة الرحلة');
      }

      if (!existingTrip) {
        throw new Error('الرحلة غير موجودة');
      }

      if (existingTrip.status !== 'pending' || existingTrip.driver_id) {
        throw new Error('الرحلة لم تعد متاحة - تم قبولها من قبل سائق آخر');
      }

      // تحديث الرحلة بمعرف السائق باستخدام atomic update مع الحالة الصحيحة
      const { data: updatedTrip, error: updateError } = await supabase
        .from('trips')
        .update({ 
          driver_id: driverId,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', request.id)
        .eq('status', 'pending')
        .is('driver_id', null)
        .select(`
          *,
          profiles!trips_customer_id_fkey (
            name,
            phone
          )
        `)
        .single();

      if (updateError) {
        console.error('خطأ في تحديث الرحلة:', updateError);
        if (updateError.code === 'PGRST116') {
          throw new Error('الرحلة لم تعد متاحة - تم قبولها من قبل سائق آخر');
        }
        throw new Error('تعذر قبول الرحلة. يرجى المحاولة مرة أخرى.');
      }

      if (!updatedTrip) {
        throw new Error('الرحلة لم تعد متاحة - تم قبولها من قبل سائق آخر');
      }

      console.log('تم تحديث الرحلة بنجاح:', updatedTrip);

      // إرسال إشعار للزبون
      try {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: request.customer_id,
            title: 'تم قبول الرحلة',
            message: `تم قبول طلب رحلتك من قبل السائق ${driverName}. السائق في طريقه إليك الآن.`,
            type: 'ride_accepted',
            data: { 
              trip_id: request.id, 
              driver_name: driverName,
              driver_id: driverId
            }
          });

        if (notificationError) {
          console.error('خطأ في إرسال الإشعار:', notificationError);
        }
      } catch (notificationError) {
        console.error('خطأ في إرسال الإشعار:', notificationError);
      }

      // تحضير بيانات الرحلة المقبولة
      const acceptedRide = {
        ...updatedTrip,
        customer_name: updatedTrip.profiles?.name || request.customer_name || 'زبون',
        customer_phone: updatedTrip.profiles?.phone || request.customer_phone || '',
        estimated_duration: request.estimated_duration || Math.ceil((updatedTrip.distance_km || 5) * 1.5)
      };

      toast({
        title: "تم قبول الرحلة بنجاح",
        description: `رحلة ${acceptedRide.customer_name} من ${request.from_location} إلى ${request.to_location}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return { success: true, trip: acceptedRide };
    } catch (error: any) {
      console.error('خطأ في قبول الرحلة:', error);
      toast({
        title: "خطأ في قبول الرحلة",
        description: error.message || "تعذر قبول الرحلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const rejectRide = async (requestId: string): Promise<{ success: boolean }> => {
    console.log('رفض الرحلة:', requestId);
    toast({
      title: "تم رفض الرحلة",
      description: "تم رفض طلب الرحلة",
      className: "bg-orange-50 border-orange-200 text-orange-800"
    });
    return { success: true };
  };

  return {
    acceptRide,
    rejectRide,
    loading
  };
};
