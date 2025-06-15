
import { useState, useEffect, useCallback } from 'react';

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
  const [lastCalculatedFrom, setLastCalculatedFrom] = useState<[number, number] | null>(null);
  const [lastCalculatedTo, setLastCalculatedTo] = useState<[number, number] | null>(null);

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

  // تحديث دالة calculateRoute لتتعامل مع التحديثات الفورية
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

    // منع الحساب المتكرر للنفس الإحداثيات
    const fromStr = `${from[0]},${from[1]}`;
    const toStr = `${to[0]},${to[1]}`;
    const lastFromStr = lastCalculatedFrom ? `${lastCalculatedFrom[0]},${lastCalculatedFrom[1]}` : '';
    const lastToStr = lastCalculatedTo ? `${lastCalculatedTo[0]},${lastCalculatedTo[1]}` : '';
    
    if (fromStr === lastFromStr && toStr === lastToStr) {
      console.log(`[useCustomerRouting] Same coordinates, skipping duplicate calculation`);
      return;
    }

    // تسجيل الإحداثيات الجديدة مباشرة
    setLastCalculatedFrom([...from]);
    setLastCalculatedTo([...to]);

    console.log(`[useCustomerRouting] Starting route calculation from:`, from, `to:`, to);

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248e12d4b05e23f4f36be3b1b7f7c69a82a&start=${from[1]},${from[0]}&end=${to[1]},${to[0]}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }
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
      }
    } catch (error) {
      console.error('[useCustomerRouting] Error calculating route:', error);
      toast({
        title: "خطأ في حساب المسار",
        description: "تعذر الحصول على مسار الرحلة. سيتم الاعتماد على المسافة المباشرة.",
        variant: "destructive"
      });
      const distance = calculateDirectDistance(from, to);
      setRouteDistance(distance);
      setRoute([from, to]);
      console.log(`[useCustomerRouting] Using direct distance: ${distance}km`);
      setTimeout(() => {
        zoomToBothPoints();
      }, 500);
    }
  }, [fromCoordinates, toCoordinates, toast, calculateDirectDistance, zoomToBothPoints, lastCalculatedFrom, lastCalculatedTo]);

  // تشغيل تلقائي لحساب المسار عند تغيير الإحداثيات (فقط للتحديثات التلقائية)
  useEffect(() => {
    if (fromCoordinates && toCoordinates) {
      // التأكد من أن هذه ليست نفس الإحداثيات المحسوبة مسبقاً
      const fromStr = `${fromCoordinates[0]},${fromCoordinates[1]}`;
      const toStr = `${toCoordinates[0]},${toCoordinates[1]}`;
      const lastFromStr = lastCalculatedFrom ? `${lastCalculatedFrom[0]},${lastCalculatedFrom[1]}` : '';
      const lastToStr = lastCalculatedTo ? `${lastCalculatedTo[0]},${lastCalculatedTo[1]}` : '';
      
      if (fromStr !== lastFromStr || toStr !== lastToStr) {
        console.log(`[useCustomerRouting] Auto-calculating route due to coordinate change`);
        calculateRoute();
      }
    } else {
      // إذا لم تكن هناك إحداثيات كاملة، امسح المسار
      setRoute([]);
      setRouteDistance(0);
      setLastCalculatedFrom(null);
      setLastCalculatedTo(null);
    }
  }, [fromCoordinates, toCoordinates]);

  return {
    route,
    routeDistance,
    calculateRoute,
    calculateDirectDistance
  };
};
