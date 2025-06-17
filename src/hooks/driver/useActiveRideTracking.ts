
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

interface RideTrackingData {
  tripId: string;
  startPosition: Position;
  endPosition?: Position;
  currentPosition: Position;
  path: Position[];
  totalDistance: number;
  totalFare: number;
  startTime: number;
  endTime?: number;
  isTracking: boolean;
}

export const useActiveRideTracking = (activeRide: any) => {
  const { toast } = useToast();
  const [trackingData, setTrackingData] = useState<RideTrackingData | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<Position[]>([]);

  // حساب المسافة بين نقطتين (بالكيلومتر)
  const calculateDistance = useCallback((pos1: Position, pos2: Position): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // حساب الأجرة بناءً على المسافة
  const calculateFare = useCallback((distance: number, vehicleType: string): number => {
    const baseFare = 1000; // أجرة الأساس
    const perKmRate = vehicleType === 'vip' ? 300 : vehicleType === 'ac' ? 200 : 150;
    return baseFare + (distance * perKmRate);
  }, []);

  // بدء تتبع الرحلة
  const startTracking = useCallback(() => {
    if (!activeRide) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const startPos: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        };

        const initialData: RideTrackingData = {
          tripId: activeRide.id,
          startPosition: startPos,
          currentPosition: startPos,
          path: [startPos],
          totalDistance: 0,
          totalFare: calculateFare(0, activeRide.vehicle_type || 'regular'),
          startTime: Date.now(),
          isTracking: true
        };

        setTrackingData(initialData);
        pathRef.current = [startPos];

        // بدء تتبع الموقع
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newPos: Position = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: Date.now()
            };

            setTrackingData(prev => {
              if (!prev) return null;

              const lastPos = pathRef.current[pathRef.current.length - 1];
              const segmentDistance = calculateDistance(lastPos, newPos);
              const newTotalDistance = prev.totalDistance + segmentDistance;
              const newFare = calculateFare(newTotalDistance, activeRide.vehicle_type || 'regular');

              pathRef.current.push(newPos);

              return {
                ...prev,
                currentPosition: newPos,
                path: [...pathRef.current],
                totalDistance: newTotalDistance,
                totalFare: newFare
              };
            });
          },
          (error) => {
            console.error('Error tracking location:', error);
            toast({
              title: "خطأ في التتبع",
              description: "تعذر تتبع الموقع",
              variant: "destructive"
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
          }
        );

        toast({
          title: "تم بدء التتبع",
          description: "بدأ تتبع الرحلة بنجاح",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      },
      (error) => {
        console.error('Error getting initial position:', error);
        toast({
          title: "خطأ في الموقع",
          description: "تعذر الحصول على الموقع الحالي",
          variant: "destructive"
        });
      }
    );
  }, [activeRide, calculateDistance, calculateFare, toast]);

  // إنهاء تتبع الرحلة
  const stopTracking = useCallback(async () => {
    if (!trackingData) return;

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const endPos: Position = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      };

      const finalData = {
        ...trackingData,
        endPosition: endPos,
        endTime: Date.now(),
        isTracking: false
      };

      setTrackingData(finalData);

      // إرسال الإشعارات
      await sendRideCompletionNotifications(finalData);

      toast({
        title: "انتهت الرحلة",
        description: `المسافة: ${finalData.totalDistance.toFixed(2)} كم - الأجرة: ${finalData.totalFare.toLocaleString()} ل.س`,
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
    });
  }, [trackingData, toast]);

  // إرسال الإشعارات
  const sendRideCompletionNotifications = async (rideData: RideTrackingData) => {
    try {
      // إشعار للزبون
      await supabase.rpc('send_notification', {
        p_user_id: activeRide.customer_id,
        p_title: 'انتهت الرحلة',
        p_message: `المسافة المقطوعة: ${rideData.totalDistance.toFixed(2)} كم\nالأجرة المستحقة: ${rideData.totalFare.toLocaleString()} ل.س`,
        p_type: 'ride_completed',
        p_data: {
          trip_id: rideData.tripId,
          distance: rideData.totalDistance,
          fare: rideData.totalFare,
          duration: rideData.endTime! - rideData.startTime
        }
      });

      // إشعار للسائق
      await supabase.rpc('send_notification', {
        p_user_id: activeRide.driver_id,
        p_title: 'تم إنهاء الرحلة',
        p_message: `تم إنهاء الرحلة بنجاح\nالأجرة المحصلة: ${rideData.totalFare.toLocaleString()} ل.س`,
        p_type: 'ride_completed',
        p_data: {
          trip_id: rideData.tripId,
          distance: rideData.totalDistance,
          fare: rideData.totalFare
        }
      });

      console.log('Notifications sent successfully');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  // تنظيف التتبع عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    trackingData,
    startTracking,
    stopTracking,
    isTracking: trackingData?.isTracking || false
  };
};
