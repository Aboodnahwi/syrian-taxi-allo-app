
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCustomerRoutingProps {
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
  toast: (options: any) => void;
  mapZoomToRouteRef?: React.MutableRefObject<(() => void) | undefined>;
}

export const useCustomerRouting = ({
  fromCoordinates,
  toCoordinates,
  toast,
  mapZoomToRouteRef
}: UseCustomerRoutingProps) => {
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const lastCalculatedRef = useRef<{ from: string | null; to: string | null }>({ from: null, to: null });
  const calculationTimeoutRef = useRef<NodeJS.Timeout>();

  const calculateDirectDistance = useCallback((from: [number, number], to: [number, number]) => {
    try {
      const R = 6371; // نصف قطر الأرض بالكيلومتر
      const dLat = (to[0] - from[0]) * Math.PI / 180;
      const dLon = (to[1] - from[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // التأكد من أن المسافة ليست صفر أو NaN
      return isNaN(distance) || distance <= 0 ? 1 : distance;
    } catch (error) {
      console.error('[useCustomerRouting] Error in calculateDirectDistance:', error);
      return 1; // مسافة افتراضية
    }
  }, []);

  const zoomToBothPoints = useCallback(() => {
    if (mapZoomToRouteRef?.current && fromCoordinates && toCoordinates) {
      setTimeout(() => {
        try {
          mapZoomToRouteRef.current?.();
        } catch (error) {
          console.error('[useCustomerRouting] Error in zoomToBothPoints:', error);
        }
      }, 200);
    }
  }, [mapZoomToRouteRef, fromCoordinates, toCoordinates]);

  const calculateRoute = useCallback(async (
    passedFromCoordinates?: [number, number] | null,
    passedToCoordinates?: [number, number] | null
  ) => {
    const from = passedFromCoordinates ?? fromCoordinates;
    const to = passedToCoordinates ?? toCoordinates;

    console.log(`[useCustomerRouting] calculateRoute called with from:`, from, `to:`, to);

    if (!from || !to) {
      console.log(`[useCustomerRouting] Missing coordinates, skipping route calculation`);
      setRoute([]);
      setRouteDistance(0);
      return;
    }

    const fromStr = `${from[0]},${from[1]}`;
    const toStr = `${to[0]},${to[1]}`;
    
    // التحقق من إحداثيات صالحة
    if (isNaN(from[0]) || isNaN(from[1]) || isNaN(to[0]) || isNaN(to[1])) {
      console.error('[useCustomerRouting] Invalid coordinates detected');
      const distance = calculateDirectDistance([33.5138, 36.2765], [33.5138, 36.2765]); // دمشق كنقطة مرجعية
      setRouteDistance(distance || 1);
      setRoute([from, to]);
      return;
    }
    
    if (fromStr === lastCalculatedRef.current.from && toStr === lastCalculatedRef.current.to) {
      console.log(`[useCustomerRouting] Same coordinates, skipping duplicate calculation`);
      zoomToBothPoints();
      return;
    }

    console.log(`[useCustomerRouting] Starting route calculation from:`, from, `to:`, to);
    lastCalculatedRef.current = { from: fromStr, to: toStr };

    // إلغاء أي حساب سابق
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    // حساب المسافة المباشرة أولاً كقيمة احتياطية
    const directDistance = calculateDirectDistance(from, to);
    setRouteDistance(directDistance);
    setRoute([from, to]);

    try {
      // استخدام OSRM بدلاً من OpenRouteService لضمان الاستقرار
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      
      console.log(`[useCustomerRouting] Making API request to OSRM:`, osrmUrl);
      
      const controller = new AbortController();
      calculationTimeoutRef.current = setTimeout(() => {
        controller.abort();
        console.log('[useCustomerRouting] Request timeout, using direct distance');
      }, 5000); // 5 ثوان

      const response = await fetch(osrmUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(calculationTimeoutRef.current);
      calculationTimeoutRef.current = undefined;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[useCustomerRouting] OSRM API response received:`, data);
      
      if (data.routes && data.routes.length > 0 && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
        const coordinates = data.routes[0].geometry.coordinates;
        const routeCoords = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
        setRoute(routeCoords);
        
        if (data.routes[0].distance) {
          const distance = data.routes[0].distance / 1000; // تحويل من متر إلى كيلومتر
          setRouteDistance(distance);
          console.log(`[useCustomerRouting] Route calculated successfully, distance: ${distance}km`);
        } else {
          console.log(`[useCustomerRouting] Using direct distance as fallback: ${directDistance}km`);
        }
        
        setTimeout(() => {
          zoomToBothPoints();
        }, 300);
      } else {
        throw new Error('No valid route data received');
      }
    } catch (error: any) {
      console.error('[useCustomerRouting] Error calculating route:', error);
      
      // إذا كان الخطأ بسبب الإلغاء (timeout)، لا نعرض رسالة خطأ
      if (error.name !== 'AbortError') {
        console.log('[useCustomerRouting] Using direct distance due to routing error');
        // إزالة رسالة الخطأ المزعجة وجعل النظام يعمل بهدوء
      }
      
      // التأكد من استخدام المسافة المباشرة
      setRouteDistance(directDistance);
      setRoute([from, to]);
      console.log(`[useCustomerRouting] Using direct distance: ${directDistance}km`);
      
      setTimeout(() => {
        zoomToBothPoints();
      }, 300);
    }
  }, [fromCoordinates, toCoordinates, calculateDirectDistance, zoomToBothPoints]);

  useEffect(() => {
    if (fromCoordinates && toCoordinates) {
      // تأخير حساب المسار لتجنب الطلبات المتكررة
      const timeoutId = setTimeout(() => {
        calculateRoute();
      }, 800);
      
      return () => clearTimeout(timeoutId);
    } else {
      setRoute([]);
      setRouteDistance(0);
      lastCalculatedRef.current = { from: null, to: null };
    }
  }, [fromCoordinates, toCoordinates]);

  // تنظيف timeout عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  return {
    route,
    routeDistance,
    calculateRoute,
    calculateDirectDistance
  };
};
