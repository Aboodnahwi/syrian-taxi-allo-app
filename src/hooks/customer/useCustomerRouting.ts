
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

  const calculateDirectDistance = useCallback((from: [number, number], to: [number, number]) => {
    const R = 6371;
    const dLat = (to[0] - from[0]) * Math.PI / 180;
    const dLon = (to[1] - from[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const zoomToBothPoints = useCallback(() => {
    if (mapZoomToRouteRef?.current && fromCoordinates && toCoordinates) {
      setTimeout(() => {
        mapZoomToRouteRef.current?.();
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
      return;
    }

    const fromStr = `${from[0]},${from[1]}`;
    const toStr = `${to[0]},${to[1]}`;
    
    if (fromStr === lastCalculatedRef.current.from && toStr === lastCalculatedRef.current.to) {
      console.log(`[useCustomerRouting] Same coordinates, skipping duplicate calculation`);
      zoomToBothPoints();
      return;
    }

    console.log(`[useCustomerRouting] Starting route calculation from:`, from, `to:`, to);
    lastCalculatedRef.current = { from: fromStr, to: toStr };

    try {
      // إضافة timeout للطلب لتجنب التعليق
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثوان

      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248e12d4b05e23f4f36be3b1b7f7c69a82a&start=${from[1]},${from[0]}&end=${to[1]},${to[0]}`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const coordinates = data.features[0].geometry.coordinates;
        const routeCoords = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
        setRoute(routeCoords);
        const distance = data.features[0].properties.segments[0].distance / 1000;
        setRouteDistance(distance);
        console.log(`[useCustomerRouting] Route calculated successfully, distance: ${distance}km`);
        setTimeout(() => {
          zoomToBothPoints();
        }, 500);
      } else {
        throw new Error('No route data received');
      }
    } catch (error: any) {
      console.error('[useCustomerRouting] Error calculating route:', error);
      
      // إذا كان الخطأ بسبب الإلغاء (timeout)، لا نعرض رسالة خطأ
      if (error.name === 'AbortError') {
        console.log('[useCustomerRouting] Route calculation timed out');
      } else {
        toast({
          title: "تعذر حساب المسار",
          description: "سيتم الاعتماد على المسافة المباشرة",
          variant: "destructive"
        });
      }
      
      // استخدام المسافة المباشرة كخطة بديلة
      const distance = calculateDirectDistance(from, to);
      setRouteDistance(distance);
      setRoute([from, to]);
      console.log(`[useCustomerRouting] Using direct distance: ${distance}km`);
      
      // إعادة تعيين للسماح بالمحاولة مرة أخرى
      lastCalculatedRef.current = { from: null, to: null };
      
      setTimeout(() => {
        zoomToBothPoints();
      }, 500);
    }
  }, [fromCoordinates, toCoordinates, toast, calculateDirectDistance, zoomToBothPoints]);

  useEffect(() => {
    if (fromCoordinates && toCoordinates) {
      calculateRoute();
    } else {
      setRoute([]);
      setRouteDistance(0);
      lastCalculatedRef.current = { from: null, to: null };
    }
  }, [fromCoordinates, toCoordinates, calculateRoute]);

  return {
    route,
    routeDistance,
    calculateRoute,
    calculateDirectDistance
  };
};
