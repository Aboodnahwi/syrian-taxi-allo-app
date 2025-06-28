
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
}

export const useRideAcceptance = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const acceptRide = async (request: RideRequest, driverId: string, driverName: string) => {
    setLoading(true);
    try {
      console.log('Accepting ride:', request.id, 'Driver ID:', driverId);

      // تحديث الرحلة بمعرف السائق
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          driver_id: driverId, 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Error updating trip:', updateError);
        throw updateError;
      }

      // إرسال إشعار للزبون
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.customer_id,
          title: 'تم قبول الرحلة',
          message: `تم قبول طلب رحلتك من قبل السائق ${driverName}. السائق في طريقه إليك.`,
          type: 'ride_accepted',
          data: { trip_id: request.id, driver_name: driverName }
        });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
        // لا نرمي خطأ هنا لأن الرحلة تم قبولها بنجاح
      }

      toast({
        title: "تم قبول الرحلة",
        description: `رحلة ${request.customer_name} من ${request.from_location} إلى ${request.to_location}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return { success: true, trip: request };
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "خطأ في قبول الرحلة",
        description: "تعذر قبول الرحلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const rejectRide = async (requestId: string) => {
    // يمكن إضافة منطق رفض الرحلة هنا إذا لزم الأمر
    toast({
      title: "تم رفض الرحلة",
      description: "تم رفض طلب الرحلة",
      className: "bg-orange-50 border-orange-200 text-orange-800"
    });
  };

  return {
    acceptRide,
    rejectRide,
    loading
  };
};
