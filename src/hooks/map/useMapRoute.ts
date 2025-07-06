
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
      console.log("[useMapRoute] Removing old route layer");
      if (routeLayerRef.current.removeFrom) {
        routeLayerRef.current.removeFrom(mapInstanceRef.current);
      } else if (routeLayerRef.current.eachLayer) {
        // It's a layer group
        routeLayerRef.current.eachLayer((layer: any) => {
          mapInstanceRef.current.removeLayer(layer);
        });
      } else {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }
      routeLayerRef.current = null;
    }

    console.log("[useMapRoute] Processing route:", route?.length, route);

    if (route && route.length > 1) {
      console.log("[useMapRoute] Drawing route with", route.length, "points");
      
      // إذا كان لدينا 3 نقاط، ارسم مسارين بألوان مختلفة
      if (route.length === 3) {
        console.log("[useMapRoute] Drawing 3-point route (driver -> pickup -> destination)");
        
        // مسار من السائق إلى الزبون (أزرق متقطع)
        const driverToCustomer = L.polyline([route[0], route[1]], {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(mapInstanceRef.current);
        
        // مسار من الزبون إلى الوجهة (أخضر)
        const customerToDestination = L.polyline([route[1], route[2]], {
          color: '#22c55e',
          weight: 5,
          opacity: 0.9,
          dashArray: '12, 4'
        }).addTo(mapInstanceRef.current);
        
        // إنشاء مجموعة للمسارات
        routeLayerRef.current = L.layerGroup([driverToCustomer, customerToDestination]);
        console.log("[useMapRoute] Created layer group for 3-point route");
      } else {
        // مسار عادي (نقطتين)
        console.log("[useMapRoute] Drawing 2-point route");
        routeLayerRef.current = L.polyline(route, { 
          color: '#22c55e', 
          weight: 5, 
          opacity: 0.9,
          dashArray: '10, 5'
        }).addTo(mapInstanceRef.current);
      }
      
      console.log("[useMapRoute] Route drawn successfully");
      
      // تحديد نطاق العرض للمسار
      setTimeout(() => {
        if (routeLayerRef.current && mapInstanceRef.current) {
          try {
            let bounds;
            if (routeLayerRef.current.getBounds) {
              bounds = routeLayerRef.current.getBounds();
            } else {
              // إذا كانت مجموعة طبقات، أنشئ الحدود يدوياً
              bounds = L.latLngBounds(route);
            }
            
            mapInstanceRef.current.fitBounds(bounds, { 
              animate: true, 
              padding: [30, 30],
              maxZoom: 16
            });
            console.log("[useMapRoute] Fitted bounds to route");
          } catch (error) {
            console.error("[useMapRoute] Error fitting bounds:", error);
          }
        }
      }, 500);
    } else {
      console.log("[useMapRoute] No valid route to draw");
    }
  }, [route, mapReady, mapInstanceRef]);

  return {
    routeLayerRef,
    zoomToRoute
  };
};
