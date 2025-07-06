
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

    if (routeLayerRef.current && route && route.length > 0) {
      console.log("[useMapRoute] Zooming to route bounds with close zoom");
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { 
        animate: true, 
        padding: [20, 20],
        maxZoom: 18 
      });
    } else if (route && route.length >= 2) {
      console.log("[useMapRoute] Zooming to route start/end points with close zoom");
      const bounds = L.latLngBounds([route[0], route[route.length - 1]]);
      
      const distance = mapInstanceRef.current.distance(route[0], route[route.length - 1]);
      console.log("[useMapRoute] Distance between points:", distance, "meters");
      
      mapInstanceRef.current.fitBounds(bounds, { 
        animate: true, 
        padding: [15, 15], 
        maxZoom: distance < 1000 ? 19 : distance < 5000 ? 17 : 15 
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
      
      if (route.length === 3) {
        console.log("[useMapRoute] Drawing 3-point route (driver -> pickup -> destination)");
        
        // مسار من السائق إلى الزبون (أزرق متقطع)
        const driverToCustomer = L.polyline([route[0], route[1]], {
          color: '#3b82f6',
          weight: 5,
          opacity: 0.9,
          dashArray: '10, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstanceRef.current);
        
        // مسار من الزبون إلى الوجهة (أخضر)
        const customerToDestination = L.polyline([route[1], route[2]], {
          color: '#22c55e',
          weight: 6,
          opacity: 0.95,
          dashArray: '15, 5',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstanceRef.current);
        
        // إضافة تأثير الظل للمسارات
        const shadowDriver = L.polyline([route[0], route[1]], {
          color: '#1e40af',
          weight: 7,
          opacity: 0.3,
          dashArray: '10, 8',
          lineCap: 'round'
        }).addTo(mapInstanceRef.current);
        
        const shadowCustomer = L.polyline([route[1], route[2]], {
          color: '#16a34a',
          weight: 8,
          opacity: 0.3,
          dashArray: '15, 5',
          lineCap: 'round'
        }).addTo(mapInstanceRef.current);
        
        routeLayerRef.current = L.layerGroup([shadowDriver, shadowCustomer, driverToCustomer, customerToDestination]);
        console.log("[useMapRoute] Created enhanced layer group for 3-point route");
      } else {
        // مسار عادي (نقطتين) مع تحسينات بصرية
        console.log("[useMapRoute] Drawing enhanced 2-point route");
        
        // إضافة ظل للمسار
        const shadowRoute = L.polyline(route, { 
          color: '#16a34a', 
          weight: 8, 
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstanceRef.current);
        
        // المسار الرئيسي
        const mainRoute = L.polyline(route, { 
          color: '#22c55e', 
          weight: 6, 
          opacity: 0.95,
          dashArray: '12, 6',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstanceRef.current);
        
        routeLayerRef.current = L.layerGroup([shadowRoute, mainRoute]);
      }
      
      console.log("[useMapRoute] Enhanced route drawn successfully");
      
      // تحديد نطاق العرض للمسار مع تحسينات
      setTimeout(() => {
        if (routeLayerRef.current && mapInstanceRef.current) {
          try {
            let bounds;
            if (routeLayerRef.current.getBounds) {
              bounds = routeLayerRef.current.getBounds();
            } else {
              bounds = L.latLngBounds(route);
            }
            
            // تحسين عرض المسار
            mapInstanceRef.current.fitBounds(bounds, { 
              animate: true, 
              padding: [40, 40], // زيادة المساحة حول المسار
              maxZoom: 16,
              duration: 1.5 // تحريك أنعم
            });
            console.log("[useMapRoute] Enhanced bounds fitting completed");
          } catch (error) {
            console.error("[useMapRoute] Error fitting bounds:", error);
          }
        }
      }, 300); // تقليل وقت الانتظار
    } else {
      console.log("[useMapRoute] No valid route to draw");
    }
  }, [route, mapReady, mapInstanceRef]);

  return {
    routeLayerRef,
    zoomToRoute
  };
};
