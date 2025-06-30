
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
      console.log('قبول الرحلة:', {
        requestId: request.id,
        driverId,
        driverName,
        customerName: request.customer_name
      });

      // التحقق من وجود السائق أولاً
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driverError || !driverData) {
        console.error('خطأ في جلب بيانات السائق:', driverError);
        throw new Error('لم يتم العثور على بيانات السائق');
      }

      console.log('بيانات السائق:', driverData);

      // تحديث الرحلة بمعرف السائق
      const { data: updatedTrip, error: updateError } = await supabase
        .from('trips')
        .update({ 
          driver_id: driverId,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', request.id)
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
        throw updateError;
      }

      console.log('تم تحديث الرحلة بنجاح:', updatedTrip);

      // إرسال إشعار للزبون
      try {
        await supabase
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
      } catch (notificationError) {
        console.error('خطأ في إرسال الإشعار:', notificationError);
        // لا نرمي خطأ هنا لأن الرحلة تم قبولها بنجاح
      }

      // تحضير بيانات الرحلة المقبولة
      const acceptedRide = {
        ...updatedTrip,
        customer_name: updatedTrip.profiles?.name || request.customer_name,
        customer_phone: updatedTrip.profiles?.phone || request.customer_phone,
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
      return { success: false, error };
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
