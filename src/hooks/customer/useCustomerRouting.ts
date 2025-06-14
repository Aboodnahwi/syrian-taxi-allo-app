
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
      console.log("[useCustomerRouting] Calling zoom to route with close zoom");
      // Add a small delay to ensure route is processed
      setTimeout(() => {
        mapZoomToRouteRef.current?.();
      }, 200);
    }
  }, [mapZoomToRouteRef, fromCoordinates, toCoordinates]);

  const calculateRoute = useCallback(async () => {
    if (!fromCoordinates || !toCoordinates) {
      console.log("[useCustomerRouting] calculateRoute: missing coordinates");
      return;
    }
    
    console.log("[useCustomerRouting] calculateRoute: calculating from", fromCoordinates, "to", toCoordinates);
    
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248e12d4b05e23f4f36be3b1b7f7c69a82a&start=${fromCoordinates[1]},${fromCoordinates[0]}&end=${toCoordinates[1]},${toCoordinates[0]}`
      );
      const data = await response.json();
      if (!response.ok) {
        console.error('Error from openrouteservice:', data);
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }
      if (data.features && data.features[0]) {
        const coordinates = data.features[0].geometry.coordinates;
        const routeCoords = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
        console.log("[useCustomerRouting] Route calculated successfully:", routeCoords.length, "points");
        setRoute(routeCoords);
        const distance = data.features[0].properties.segments[0].distance / 1000;
        setRouteDistance(distance);
        
        // Auto-zoom with closer view after route calculation
        setTimeout(() => {
          zoomToBothPoints();
        }, 300);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "خطأ في حساب المسار",
        description: "تعذر الحصول على مسار الرحلة. سيتم الاعتماد على المسافة المباشرة.",
        variant: "destructive"
      });
      const distance = calculateDirectDistance(fromCoordinates, toCoordinates);
      setRouteDistance(distance);
      
      // Set direct route for zoom purposes
      setRoute([fromCoordinates, toCoordinates]);
      
      // Auto-zoom even without route API
      setTimeout(() => {
        zoomToBothPoints();
      }, 300);
    }
  }, [fromCoordinates, toCoordinates, toast, calculateDirectDistance, zoomToBothPoints]);

  // Draw route when both coordinates are available
  useEffect(() => {
    if (fromCoordinates && toCoordinates) {
      console.log("[useCustomerRouting] Both coordinates available, calculating route with close zoom");
      calculateRoute();
    } else {
      console.log("[useCustomerRouting] No coordinates for route - clearing route");
      setRoute([]);
      setRouteDistance(0);
    }
  }, [fromCoordinates, toCoordinates, calculateRoute]);

  return {
    route,
    routeDistance,
    calculateRoute,
    calculateDirectDistance
  };
};
