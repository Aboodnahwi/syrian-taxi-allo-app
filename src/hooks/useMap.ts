
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapProps } from '@/components/map/types';

const MAP_SCRIPT_ID = "leaflet-cdn-script";
const MAP_CSS_ID = "leaflet-cdn-css";

const loadScript = (id: string, src: string) => new Promise<void>((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error(`فشل تحميل السكربت: ${src}`));
  document.head.appendChild(script);
});

const loadCss = (id: string, href: string) => new Promise<void>((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  link.onload = () => resolve();
  link.onerror = () => reject(new Error(`فشل تحميل ملف الأنماط: ${href}`));
  document.head.appendChild(link);
});

export const useMap = ({
  center = [33.5138, 36.2765],
  zoom = 11,
  onLocationSelect,
  markers = [],
  route,
  toast,
}: Omit<MapProps, 'className'>) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation([lat, lng]);

          if (mapInstanceRef.current) {
            const L = (window as any).L;
            const currentLocationIcon = L.divIcon({
              html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [20, 20],
              className: 'current-location-marker'
            });

            L.marker([lat, lng], { icon: currentLocationIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup('موقعك الحالي');
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
      try {
        await Promise.all([
          loadCss(MAP_CSS_ID, 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),
          loadScript(MAP_SCRIPT_ID, 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
        ]);

        if (isCancelled || !mapRef.current || !(window as any).L || mapInstanceRef.current) return;
        
        const L = (window as any).L;
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

      } catch (error) {
        console.error("Error initializing map:", error);
        if (toast) {
            toast({ title: "خطأ فني في الخريطة", description: (error as Error).message, variant: "destructive" });
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

  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;

    markersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker));
    markersRef.current = [];

    markers.forEach((markerData) => {
      let markerOptions: any = {};
      if (markerData.icon) {
        markerOptions.icon = L.divIcon({
          html: markerData.icon.html,
          className: markerData.icon.className || '',
          iconSize: markerData.icon.iconSize,
          iconAnchor: markerData.icon.iconAnchor,
        });
      }
      const marker = L.marker(markerData.position, markerOptions).addTo(mapInstanceRef.current);
      if (markerData.popup) marker.bindPopup(markerData.popup);
      markersRef.current.push(marker);
    });
  }, [markers]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L;

    if (routeLayerRef.current) mapInstanceRef.current.removeLayer(routeLayerRef.current);

    if (route && route.length > 1) {
      routeLayerRef.current = L.polyline(route, { color: '#ef4444', weight: 4, opacity: 0.8 }).addTo(mapInstanceRef.current);
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds());
    }
  }, [route]);

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentLocation, 15);
    } else {
      getCurrentLocation();
    }
  };

  return { mapRef, centerOnCurrentLocation };
};
