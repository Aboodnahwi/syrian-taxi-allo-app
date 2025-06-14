
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapProps } from '@/components/map/types';
import { getLeaflet } from './leafletUtils';

const MAP_SCRIPT_ID = "leaflet-cdn-script";
const MAP_CSS_ID = "leaflet-cdn-css";

const loadScript = (id: string, src: string) => new Promise<void>((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.onload = () => {
    console.log(`[leaflet] script loaded: ${src}`);
    resolve();
  };
  script.onerror = () => {
    console.error(`[leaflet] فشل تحميل السكربت: ${src}`);
    reject(new Error(`فشل تحميل السكربت: ${src}`));
  };
  document.head.appendChild(script);
});

const loadCss = (id: string, href: string) => new Promise<void>((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  link.onload = () => {
    console.log(`[leaflet] css loaded: ${href}`);
    resolve();
  };
  link.onerror = () => {
    console.error(`[leaflet] فشل تحميل ملف الأنماط: ${href}`);
    reject(new Error(`فشل تحميل ملف الأنماط: ${href}`));
  };
  document.head.appendChild(link);
});

export const useMap = ({
  center = [33.5138, 36.2765],
  zoom = 11,
  onLocationSelect,
  markers = [],
  route,
  toast,
  onMarkerDrag
}: Omit<MapProps, 'className'> & { 
  onMarkerDrag?: (type:'from'|'to', lat:number, lng:number, address:string)=>void 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{[k:string]: any}>({});
  const routeLayerRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const zoomToLatLng = (lat: number, lng: number, myZoom: number = 17) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], myZoom, { animate: true });
    }
  };

  const zoomToRoute = () => {
    if (mapInstanceRef.current && routeLayerRef.current) {
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { animate: true, padding: [60,60] });
    }
  };

  const fetchAddress = async (lat:number, lng:number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation([lat, lng]);

          if (mapInstanceRef.current) {
            try {
              const L = getLeaflet();
              const currentLocationIcon = L.divIcon({
                html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                className: 'current-location-marker'
              });

              L.marker([lat, lng], { icon: currentLocationIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('موقعك الحالي');
            } catch (e) {
              console.error("Leaflet is not loaded yet");
            }
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (toast) {
            toast({
              title: "خطأ في تحديد الموقع",
              description: "تعذر الوصول إلى موقعك. يرجى تفعيل خدمات الموقع والسماح بالوصول.",
              variant: "destructive"
            });
          }
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    if (!mapRef.current) return;
    let isCancelled = false;

    const initializeMap = async () => {
      console.log("[map] Starting map initialization...");
      try {
        await Promise.all([
          loadCss(MAP_CSS_ID, 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),
          loadScript(MAP_SCRIPT_ID, 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
        ]);
        let L;
        try {
          L = getLeaflet();
        } catch {
          console.error("[map] Leaflet غير موجود على window.L بعد تحميل السكربت!");
          return;
        }
        if (isCancelled || !mapRef.current || mapInstanceRef.current) {
          if (!mapRef.current) {
            console.error("[map] mapRef.current is missing!");
          }
          return;
        }
        console.log("[map] Initializing Leaflet map...");
        const map = L.map(mapRef.current).setView(center, zoom);
        mapInstanceRef.current = map;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        if (onLocationSelect) {
          map.on('click', async (e: any) => {
            const { lat, lng } = e.latlng;
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
              const data = await response.json();
              const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
              onLocationSelect(lat, lng, address);
            } catch (error) {
              console.error('Error getting address:', error);
              onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          });
        }
        setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 150);
        getCurrentLocation();
        console.log("[map] Map has been initialized successfully.");
      } catch (error) {
        console.error("Error initializing map:", error);
        if (toast) {
            toast({
              title: "خطأ فني في الخريطة",
              description: (error as Error).message,
              variant: "destructive"
            });
        } else {
          alert("خطأ فني في الخريطة:\n" + (error as Error).message);
        }
      }
    };

    initializeMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, onLocationSelect, toast, getCurrentLocation]);

  // تحديث الدبابيس
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.log("[useMap] Map instance not ready yet");
      return;
    }

    let L;
    try {
      L = getLeaflet();
    } catch { 
      console.log("[useMap] Leaflet not available yet");
      return; 
    }

    console.log("[useMap] Processing markers:", markers.length, markers);

    // إزالة الدبابيس القديمة
    Object.values(markersRef.current).forEach(marker => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = {};

    // إضافة الدبابيس الجديدة
    markers.forEach((markerData) => {
      console.log("[useMap] Adding marker:", markerData.id, markerData.position);
      
      let markerOptions: any = {
        draggable: markerData.draggable || false
      };

      if (markerData.icon) {
        markerOptions.icon = L.divIcon({
          html: markerData.icon.html,
          className: markerData.icon.className || '',
          iconSize: markerData.icon.iconSize || [26, 36],
          iconAnchor: markerData.icon.iconAnchor || [13, 34],
        });
      }

      const marker = L.marker(markerData.position, markerOptions).addTo(mapInstanceRef.current);
      
      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }

      // إضافة وظيفة السحب إذا كان الدبوس قابل للسحب
      if (markerData.draggable && markerData.id && onMarkerDrag) {
        marker.on('dragend', async (e:any) => {
          const latlng = e.target.getLatLng();
          const address = await fetchAddress(latlng.lat, latlng.lng);
          onMarkerDrag(
            markerData.id as 'from' | 'to',
            latlng.lat,
            latlng.lng,
            address
          );
          marker.setPopupContent(address);
          if (toast) {
            toast({
              title: markerData.id === 'from' ? "تم تحديث نقطة الانطلاق" : "تم تحديث الوجهة",
              description: address,
              className: "bg-blue-50 border-blue-200 text-blue-800"
            });
          }
        });
      }

      markersRef.current[markerData.id] = marker;
      console.log("[useMap] Marker added successfully:", markerData.id);
    });

    console.log("[useMap] Total markers on map:", Object.keys(markersRef.current).length);
  }, [markers, onMarkerDrag, toast]);
  
  // تحديث خط المسار
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.log("[useMap] Map instance not ready for route");
      return;
    }
    
    let L;
    try { 
      L = getLeaflet(); 
    } catch { 
      console.log("[useMap] Leaflet not available for route");
      return; 
    }

    // إزالة خط المسار القديم
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    console.log("[useMap] Processing route:", route?.length, route);

    if (route && route.length > 1) {
      console.log("[useMap] Drawing route with", route.length, "points");
      routeLayerRef.current = L.polyline(route, { 
        color: '#ef4444', 
        weight: 4, 
        opacity: 0.8 
      }).addTo(mapInstanceRef.current);
      
      console.log("[useMap] Route drawn successfully");
      
      // تكبير لإظهار المسار كاملاً
      try {
        mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { 
          animate: true, 
          padding: [60, 60] 
        });
      } catch (error) {
        console.error("[useMap] Error fitting bounds:", error);
      }
    }
  }, [route]);

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentLocation, 15);
    } else {
      getCurrentLocation();
    }
  };

  return { mapRef, centerOnCurrentLocation, zoomToLatLng, zoomToRoute };
};
