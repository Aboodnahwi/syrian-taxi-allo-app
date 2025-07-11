
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

  // رسم مسار واقعي محسن مع استخدام OpenStreetMap Routing API
  const drawRealisticRoute = useCallback(async (L: any, routePoints: [number, number][]) => {
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
      
      // الحصول على مسار واقعي من السائق إلى نقطة الالتقاط
      const driverToPickupRoute = await getRealisticRoute(routePoints[0], routePoints[1]);
      
      // الحصول على مسار واقعي من نقطة الالتقاط إلى الوجهة
      const pickupToDestinationRoute = await getRealisticRoute(routePoints[1], routePoints[2]);
      
      // رسم المسار الأول (السائق -> نقطة الالتقاط) - أزرق متقطع
      const driverPath = driverToPickupRoute.length > 0 ? driverToPickupRoute : [routePoints[0], routePoints[1]];
      const shadowDriver = L.polyline(driverPath, {
        color: '#1e40af',
        weight: 8,
        opacity: 0.3,
        dashArray: '15, 10',
        lineCap: 'round'
      });
      
      const driverToPickup = L.polyline(driverPath, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.9,
        dashArray: '15, 10',
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // رسم المسار الثاني (نقطة الالتقاط -> الوجهة) - أخضر صلب
      const destinationPath = pickupToDestinationRoute.length > 0 ? pickupToDestinationRoute : [routePoints[1], routePoints[2]];
      const shadowPickup = L.polyline(destinationPath, {
        color: '#16a34a',
        weight: 9,
        opacity: 0.3,
        lineCap: 'round'
      });
      
      const pickupToDestination = L.polyline(destinationPath, {
        color: '#22c55e',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
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
      
      // الحصول على مسار واقعي
      const realisticRoute = await getRealisticRoute(routePoints[0], routePoints[1]);
      const routePath = realisticRoute.length > 0 ? realisticRoute : routePoints;
      
      // إضافة ظل للمسار
      const shadowRoute = L.polyline(routePath, { 
        color: '#16a34a', 
        weight: 9, 
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // المسار الرئيسي
      const mainRoute = L.polyline(routePath, { 
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

  // دالة للحصول على مسار واقعي باستخدام OpenStreetMap
  const getRealisticRoute = useCallback(async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        console.log("[useMapRoute] OSRM API not available, using direct line");
        return [];
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
        const coordinates = data.routes[0].geometry.coordinates;
        // تحويل الإحداثيات من [lng, lat] إلى [lat, lng]
        return coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      }
      
      return [];
    } catch (error) {
      console.log("[useMapRoute] Error fetching realistic route:", error);
      return [];
    }
  }, []);

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
