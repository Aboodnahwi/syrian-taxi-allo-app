
import { useEffect, useRef, useState, useCallback } from 'react';
import { getLeaflet } from '../leafletUtils';
import { MAP_SCRIPT_ID, MAP_CSS_ID, LEAFLET_CDN, TILE_LAYER } from './mapConstants';

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

interface UseMapInitializationProps {
  center: [number, number];
  zoom: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  toast?: (options: any) => void;
}

export const useMapInitialization = ({
  center,
  zoom,
  onLocationSelect,
  toast
}: UseMapInitializationProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const zoomToLatLng = useCallback((lat: number, lng: number, myZoom: number = 17) => {
    console.log("[useMapInitialization] zoomToLatLng called:", lat, lng, myZoom);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], myZoom, { animate: true });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    let isCancelled = false;

    const initializeMap = async () => {
      console.log("[map] Starting map initialization...");
      try {
        await Promise.all([
          loadCss(MAP_CSS_ID, LEAFLET_CDN.CSS),
          loadScript(MAP_SCRIPT_ID, LEAFLET_CDN.JS)
        ]);
        
        let L;
        try {
          L = getLeaflet();
        } catch {
          console.error("[map] Leaflet غير موجود على window.L بعد تحميل السكربت!");
          return;
        }
        
        if (isCancelled || !mapRef.current || mapInstanceRef.current) {
          return;
        }
        
        console.log("[map] Initializing Leaflet map...");
        const map = L.map(mapRef.current).setView(center, zoom);
        mapInstanceRef.current = map;

        L.tileLayer(TILE_LAYER.URL, {
          attribution: TILE_LAYER.ATTRIBUTION
        }).addTo(map);

        if (onLocationSelect) {
          map.on('click', async (e: any) => {
            const { lat, lng } = e.latlng;
            console.log("[map] Map clicked at:", lat, lng);
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
        
        setTimeout(() => { 
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(); 
            setMapReady(true);
            console.log("[map] Map ready");
          }
        }, 150);
        
        console.log("[map] Map has been initialized successfully.");
      } catch (error) {
        console.error("Error initializing map:", error);
        if (toast) {
            toast({
              title: "خطأ فني في الخريطة",
              description: (error as Error).message,
              variant: "destructive"
            });
        }
      }
    };

    initializeMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, [center, zoom, onLocationSelect, toast]);

  // Update map center when it changes
  useEffect(() => {
    if (mapInstanceRef.current && mapReady) {
      console.log("[useMapInitialization] Updating map center to:", center);
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, mapReady]);

  return {
    mapRef,
    mapInstanceRef,
    mapReady,
    zoomToLatLng
  };
};
