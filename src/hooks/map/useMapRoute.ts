
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
      console.log("[useMapRoute] Zooming to route bounds");
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { 
        animate: true, 
        padding: [20, 20],
        maxZoom: 16
      });
    } else if (route && route.length >= 2) {
      console.log("[useMapRoute] Zooming to route start/end points");
      const bounds = L.latLngBounds([route[0], route[route.length - 1]]);
      
      const distance = mapInstanceRef.current.distance(route[0], route[route.length - 1]);
      console.log("[useMapRoute] Distance between points:", distance, "meters");
      
      mapInstanceRef.current.fitBounds(bounds, { 
        animate: true, 
        padding: [15, 15], 
        maxZoom: distance < 1000 ? 18 : distance < 5000 ? 16 : 14
      });
    }
  }, [mapInstanceRef, route]);

  // رسم مسار محسن وواقعي
  const drawRealisticRoute = useCallback((L: any, routePoints: [number, number][]) => {
    // إزالة المسار القديم
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

    if (routePoints.length === 3) {
      console.log("[useMapRoute] Drawing enhanced 3-point route (driver -> pickup -> destination)");
      
      // مسار من السائق إلى نقطة الالتقاط (أزرق متقطع)
      const driverToPickup = L.polyline([routePoints[0], routePoints[1]], {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.9,
        dashArray: '15, 10',
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // مسار من نقطة الالتقاط إلى الوجهة (أخضر صلب)
      const pickupToDestination = L.polyline([routePoints[1], routePoints[2]], {
        color: '#22c55e',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // إضافة تأثير الظل للمسارات
      const shadowDriver = L.polyline([routePoints[0], routePoints[1]], {
        color: '#1e40af',
        weight: 8,
        opacity: 0.3,
        dashArray: '15, 10',
        lineCap: 'round'
      });
      
      const shadowPickup = L.polyline([routePoints[1], routePoints[2]], {
        color: '#16a34a',
        weight: 9,
        opacity: 0.3,
        lineCap: 'round'
      });
      
      // إضافة جميع الطبقات للخريطة
      shadowDriver.addTo(mapInstanceRef.current);
      shadowPickup.addTo(mapInstanceRef.current);
      driverToPickup.addTo(mapInstanceRef.current);
      pickupToDestination.addTo(mapInstanceRef.current);
      
      // تجميع جميع الطبقات
      routeLayerRef.current = L.layerGroup([
        shadowDriver, 
        shadowPickup, 
        driverToPickup, 
        pickupToDestination
      ]);
      
      console.log("[useMapRoute] Created enhanced layer group for 3-point route");
    } else if (routePoints.length === 2) {
      console.log("[useMapRoute] Drawing enhanced 2-point route");
      
      // إضافة ظل للمسار
      const shadowRoute = L.polyline(routePoints, { 
        color: '#16a34a', 
        weight: 9, 
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // المسار الرئيسي
      const mainRoute = L.polyline(routePoints, { 
        color: '#22c55e', 
        weight: 7, 
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // إضافة الطبقات للخريطة
      shadowRoute.addTo(mapInstanceRef.current);
      mainRoute.addTo(mapInstanceRef.current);
      
      routeLayerRef.current = L.layerGroup([shadowRoute, mainRoute]);
    }
    
    // تحديد نطاق العرض للمسار مع تحسينات
    setTimeout(() => {
      if (routeLayerRef.current && mapInstanceRef.current) {
        try {
          let bounds;
          if (routeLayerRef.current.getBounds) {
            bounds = routeLayerRef.current.getBounds();
          } else {
            bounds = L.latLngBounds(routePoints);
          }
          
          // تحسين عرض المسار
          mapInstanceRef.current.fitBounds(bounds, { 
            animate: true, 
            padding: [50, 50],
            maxZoom: 15,
            duration: 1.2
          });
          console.log("[useMapRoute] Enhanced bounds fitting completed");
        } catch (error) {
          console.error("[useMapRoute] Error fitting bounds:", error);
        }
      }
    }, 300);
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

    console.log("[useMapRoute] Processing route:", route?.length, route);

    if (route && route.length > 1) {
      console.log("[useMapRoute] Drawing enhanced route with", route.length, "points");
      drawRealisticRoute(L, route);
      console.log("[useMapRoute] Enhanced route drawn successfully");
    } else {
      console.log("[useMapRoute] No valid route to draw");
      // إزالة المسار القديم إذا لم يكن هناك مسار جديد
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
    }
  }, [route, mapReady, mapInstanceRef, drawRealisticRoute]);

  return {
    routeLayerRef,
    zoomToRoute
  };
};
