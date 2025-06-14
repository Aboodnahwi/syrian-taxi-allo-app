
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

  // تعديل دالة calculateRoute لاستقبال قيم اختيارية.
  const calculateRoute = useCallback(async (
    passedFromCoordinates?: [number, number] | null,
    passedToCoordinates?: [number, number] | null
  ) => {
    const from = passedFromCoordinates ?? fromCoordinates;
    const to = passedToCoordinates ?? toCoordinates;

    if (!from || !to) {
      return;
    }

    // تحقق من أن الإحداثيات تغيرت فعلاً
    const fromChanged = !lastCalculatedFrom || 
      lastCalculatedFrom[0] !== from[0] || 
      lastCalculatedFrom[1] !== from[1];
    
    const toChanged = !lastCalculatedTo || 
      lastCalculatedTo[0] !== to[0] || 
      lastCalculatedTo[1] !== to[1];

    if (!fromChanged && !toChanged) {
      return;
    }

    setLastCalculatedFrom([...from]);
    setLastCalculatedTo([...to]);

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
        setTimeout(() => {
          zoomToBothPoints();
        }, 300);
      }
    } catch (error) {
      toast({
        title: "خطأ في حساب المسار",
        description: "تعذر الحصول على مسار الرحلة. سيتم الاعتماد على المسافة المباشرة.",
        variant: "destructive"
      });
      const distance = calculateDirectDistance(from, to);
      setRouteDistance(distance);
      setRoute([from, to]);
      setTimeout(() => {
        zoomToBothPoints();
      }, 300);
    }
  // مهم: أضف lastCalculatedFrom/To في dependencies!
  }, [fromCoordinates, toCoordinates, toast, calculateDirectDistance, zoomToBothPoints, lastCalculatedFrom, lastCalculatedTo]);

  // auto draw route when both coordinates available
  useEffect(() => {
    if (fromCoordinates && toCoordinates) {
      calculateRoute();
    }
  }, [fromCoordinates, toCoordinates, calculateRoute]);

  return {
    route,
    routeDistance,
    calculateRoute,
    calculateDirectDistance
  };
};
