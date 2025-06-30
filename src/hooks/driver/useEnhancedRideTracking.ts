import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface EnhancedTrackingData {
  tripId: string;
  startPosition: Position;
  currentPosition: Position;
  path: Position[];
  totalDistance: number;
  currentSpeed: number;
  averageSpeed: number;
  totalFare: number;
  startTime: number;
  duration: number;
  isTracking: boolean;
  vehicleType: string;
}

export const useEnhancedRideTracking = (activeRide: any) => {
  const { toast } = useToast();
  const [trackingData, setTrackingData] = useState<EnhancedTrackingData | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<Position[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // حساب المسافة بين نقطتين (بالكيلومتر)
  const calculateDistance = useCallback((pos1: Position, pos2: Position): number => {
    const R = 6371;
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // حساب السرعة الحالية
  const calculateSpeed = useCallback((pos1: Position, pos2: Position): number => {
    const distance = calculateDistance(pos1, pos2) * 1000; // بالمتر
    const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // بالثواني
    if (timeDiff === 0) return 0;
    return (distance / timeDiff) * 3.6; // تحويل إلى كم/ساعة
  }, [calculateDistance]);

  // حساب الأجرة بناءً على نوع المركبة والمسافة
  const calculateFare = useCallback((distance: number, vehicleType: string): number => {
    const baseFare = 1000;
    let ratePerKm = 150;
    
    switch (vehicleType) {
      case 'vip': ratePerKm = 300; break;
      case 'ac': ratePerKm = 200; break;
      case 'regular': ratePerKm = 150; break;
      case 'public': ratePerKm = 100; break;
      case 'microbus': ratePerKm = 120; break;
      case 'bike': ratePerKm = 80; break;
    }
    
    return Math.round(baseFare + (distance * ratePerKm));
  }, []);

  // تحديث قاعدة البيانات بالمسار والبيانات الحالية
  const updateTripData = useCallback(async (data: EnhancedTrackingData) => {
    try {
      console.log('تحديث بيانات الرحلة:', {
        tripId: data.tripId,
        distance: data.totalDistance,
        fare: data.totalFare
      });

      await supabase
        .from('trips')
        .update({
          distance_km: data.totalDistance,
          price: data.totalFare
        })
        .eq('id', data.tripId);
    } catch (error) {
      console.error('خطأ في تحديث بيانات الرحلة:', error);
    }
  }, []);

  // بدء تتبع الرحلة
  const startTracking = useCallback(() => {
    if (!activeRide) {
      console.log('لا توجد رحلة نشطة للتتبع');
      return;
    }

    console.log('بدء تتبع الرحلة:', activeRide.id);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const startPos: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        };

        const initialData: EnhancedTrackingData = {
          tripId: activeRide.id,
          startPosition: startPos,
          currentPosition: startPos,
          path: [startPos],
          totalDistance: 0,
          currentSpeed: 0,
          averageSpeed: 0,
          totalFare: activeRide.price || calculateFare(0, activeRide.vehicle_type || 'regular'),
          startTime: Date.now(),
          duration: 0,
          isTracking: true,
          vehicleType: activeRide.vehicle_type || 'regular'
        };

        console.log('بيانات التتبع الأولية:', initialData);
        setTrackingData(initialData);
        pathRef.current = [startPos];
        lastUpdateRef.current = Date.now();

        // بدء تتبع الموقع
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newPos: Position = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: Date.now(),
              accuracy: pos.coords.accuracy
            };

            setTrackingData(prev => {
              if (!prev) return null;

              const lastPos = pathRef.current[pathRef.current.length - 1];
              const segmentDistance = calculateDistance(lastPos, newPos);
              
              // تجنب التحديثات المتكررة للمواقع القريبة جداً
              if (segmentDistance < 0.001) return prev;

              const currentSpeed = calculateSpeed(lastPos, newPos);
              const newTotalDistance = prev.totalDistance + segmentDistance;
              const newFare = calculateFare(newTotalDistance, prev.vehicleType);
              const currentTime = Date.now();
              const duration = Math.floor((currentTime - prev.startTime) / 1000);
              const averageSpeed = duration > 0 ? (newTotalDistance / (duration / 3600)) : 0;

              pathRef.current.push(newPos);

              const updatedData = {
                ...prev,
                currentPosition: newPos,
                path: [...pathRef.current],
                totalDistance: newTotalDistance,
                currentSpeed: Math.max(0, Math.min(120, currentSpeed)),
                averageSpeed,
                totalFare: newFare,
                duration
              };

              console.log('تحديث بيانات التتبع:', {
                distance: updatedData.totalDistance,
                fare: updatedData.totalFare,
                speed: updatedData.currentSpeed
              });

              return updatedData;
            });
          },
          (error) => {
            console.error('خطأ في تتبع الموقع:', error);
            toast({
              title: "خطأ في التتبع",
              description: "تعذر تتبع الموقع بدقة",
              variant: "destructive"
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000
          }
        );

        // تحديث قاعدة البيانات كل 15 ثانية
        updateIntervalRef.current = setInterval(() => {
          setTrackingData(current => {
            if (current) {
              updateTripData(current);
            }
            return current;
          });
        }, 15000);

        toast({
          title: "تم بدء التتبع",
          description: "بدأ تتبع الرحلة والمسار بنجاح",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      },
      (error) => {
        console.error('خطأ في الحصول على الموقع الأولي:', error);
        toast({
          title: "خطأ في الموقع",
          description: "تعذر الحصول على الموقع الحالي",
          variant: "destructive"
        });
      }
    );
  }, [activeRide, calculateDistance, calculateSpeed, calculateFare, toast, updateTripData]);

  // إنهاء تتبع الرحلة
  const stopTracking = useCallback(async () => {
    if (!trackingData) return null;

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    const finalData = {
      ...trackingData,
      isTracking: false
    };

    setTrackingData(finalData);

    // تحديث قاعدة البيانات النهائي
    await updateTripData(finalData);

    // إرسال إشعار للزبون بانتهاء الرحلة
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: activeRide.customer_id,
          title: 'انتهت الرحلة',
          message: `تم إنهاء الرحلة بنجاح. المسافة: ${finalData.totalDistance.toFixed(2)} كم - الأجرة: ${finalData.totalFare.toLocaleString()} ل.س`,
          type: 'ride_completed',
          data: {
            trip_id: finalData.tripId,
            distance: finalData.totalDistance,
            fare: finalData.totalFare,
            duration: finalData.duration
          }
        });
    } catch (error) {
      console.error('Error sending completion notification:', error);
    }

    toast({
      title: "انتهت الرحلة",
      description: `المسافة: ${finalData.totalDistance.toFixed(2)} كم - الأجرة: ${finalData.totalFare.toLocaleString()} ل.س`,
      className: "bg-blue-50 border-blue-200 text-blue-800"
    });

    return finalData;
  }, [trackingData, updateTripData, activeRide, toast]);

  // تنظيف التتبع عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
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
