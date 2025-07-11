
import { useEffect, useRef, useCallback } from 'react';
import { getLeaflet } from '../leafletUtils';

interface UseMapRouteProps {
  mapInstanceRef: React.MutableRefObject<any>;
  mapReady: boolean;
  route?: Array<[number, number]>;
  driverLocation?: [number, number];
  rideStatus?: 'accepted' | 'arrived' | 'started' | 'completed' | null;
}

export const useMapRoute = ({ mapInstanceRef, mapReady, route, driverLocation, rideStatus }: UseMapRouteProps) => {
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

  // رسم مسار واقعي محسن مع تمييز مسار السائق إلى الزبون
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

    if (routePoints.length === 3 && rideStatus === 'accepted') {
      console.log("[useMapRoute] Drawing driver-to-customer route with different colors");
      
      // الحصول على مسار واقعي من السائق إلى نقطة الالتقاط (أزرق متقطع)
      const driverToPickupRoute = await getRealisticRoute(routePoints[0], routePoints[1]);
      
      // الحصول على مسار واقعي من نقطة الالتقاط إلى الوجهة (أخضر صلب)
      const pickupToDestinationRoute = await getRealisticRoute(routePoints[1], routePoints[2]);
      
      // رسم المسار الأول (السائق -> نقطة الالتقاط) - أزرق متقطع مع تحديد المسافة
      const driverPath = driverToPickupRoute.length > 0 ? driverToPickupRoute : [routePoints[0], routePoints[1]];
      
      // حساب المسافة والوقت المتوقع
      const distanceToCustomer = calculateDistance(routePoints[0], routePoints[1]);
      const estimatedTime = Math.ceil((distanceToCustomer / 40) * 60); // افتراض سرعة 40 كم/ساعة
      
      const shadowDriver = L.polyline(driverPath, {
        color: '#1e40af',
        weight: 10,
        opacity: 0.4,
        dashArray: '20, 15',
        lineCap: 'round'
      });
      
      const driverToPickup = L.polyline(driverPath, {
        color: '#3b82f6',
        weight: 8,
        opacity: 1,
        dashArray: '20, 15',
        lineCap: 'round',
        lineJoin: 'round'
      });
      
      // إضافة نص يوضح المسافة والوقت المتوقع في منتصف المسار
      if (driverPath.length > 1) {
        const midPoint = driverPath[Math.floor(driverPath.length / 2)];
        const distanceMarker = L.marker(midPoint, {
          icon: L.divIcon({
            html: `<div class="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-bold border-2 border-white">
                     ${distanceToCustomer.toFixed(1)} كم<br>
                     ~${estimatedTime} دقيقة
                   </div>`,
            iconSize: [80, 40],
            iconAnchor: [40, 20],
            className: 'distance-info-marker'
          })
        });
        distanceMarker.addTo(mapInstanceRef.current);
      }
      
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
      
    } else if (routePoints.length === 2) {
      console.log("[useMapRoute] Drawing simple 2-point route");
      
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
  }, [mapInstanceRef, rideStatus]);

  // دالة لحساب المسافة بين نقطتين
  const calculateDistance = useCallback((point1: [number, number], point2: [number, number]): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

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

    console.log("[useMapRoute] Processing route:", route?.length, route, "Status:", rideStatus);

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
  }, [route, mapReady, mapInstanceRef, drawRealisticRoute, rideStatus]);

  return {
    routeLayerRef,
    zoomToRoute
  };
};
