
import { useEffect, useRef, useCallback } from 'react';
import { getLeaflet } from '../leafletUtils';

interface UseMapRouteProps {
  mapInstanceRef: React.MutableRefObject<any>;
  mapReady: boolean;
  route?: Array<[number, number]>;
}

export const useMapRoute = ({ mapInstanceRef, mapReady, route }: UseMapRouteProps) => {
  const routeLayerRef = useRef<any>(null);

  const zoomToRoute = useCallback(() => {
    console.log("[useMapRoute] zoomToRoute called");
    if (mapInstanceRef.current && routeLayerRef.current) {
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { animate: true, padding: [60, 60] });
    }
  }, [mapInstanceRef]);

  // Update route
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) {
      console.log("[useMapRoute] Map not ready for route");
      return;
    }
    
    let L;
    try { 
      L = getLeaflet(); 
    } catch { 
      console.log("[useMapRoute] Leaflet not available for route");
      return; 
    }

    // Remove old route
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    console.log("[useMapRoute] Processing route:", route?.length, route);

    if (route && route.length > 1) {
      console.log("[useMapRoute] Drawing route with", route.length, "points");
      routeLayerRef.current = L.polyline(route, { 
        color: '#ef4444', 
        weight: 6, 
        opacity: 0.9,
        dashArray: '10, 5'
      }).addTo(mapInstanceRef.current);
      
      console.log("[useMapRoute] Route drawn successfully");
    }
  }, [route, mapReady, mapInstanceRef]);

  return {
    routeLayerRef,
    zoomToRoute
  };
};
