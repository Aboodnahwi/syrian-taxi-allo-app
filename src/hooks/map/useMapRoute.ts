
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
    if (!mapInstanceRef.current) {
      console.log("[useMapRoute] Map not available for zoom");
      return;
    }

    let L;
    try { 
      L = getLeaflet(); 
    } catch { 
      console.log("[useMapRoute] Leaflet not available for zoom");
      return; 
    }

    // If we have a route, zoom to route bounds with tighter padding
    if (routeLayerRef.current && route && route.length > 0) {
      console.log("[useMapRoute] Zooming to route bounds with close zoom");
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { 
        animate: true, 
        padding: [20, 20], // Reduced padding for closer zoom
        maxZoom: 18 // Increased max zoom for closer view
      });
    } else if (route && route.length >= 2) {
      // If no route layer but we have route points, create bounds from first and last points
      console.log("[useMapRoute] Zooming to route start/end points with close zoom");
      const bounds = L.latLngBounds([route[0], route[route.length - 1]]);
      
      // Calculate distance between points to determine appropriate zoom
      const distance = mapInstanceRef.current.distance(route[0], route[route.length - 1]);
      console.log("[useMapRoute] Distance between points:", distance, "meters");
      
      // Use minimal padding and higher zoom for closer view
      mapInstanceRef.current.fitBounds(bounds, { 
        animate: true, 
        padding: [15, 15], // Minimal padding
        maxZoom: distance < 1000 ? 19 : distance < 5000 ? 17 : 15 // Dynamic max zoom based on distance
      });
    }
  }, [mapInstanceRef, route]);

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
