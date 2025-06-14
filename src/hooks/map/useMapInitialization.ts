
import { useRef, useEffect, useState, useCallback } from 'react';

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

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const zoomToLatLng = useCallback((lat: number, lng: number, zoomLevel: number = 15) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoomLevel, { animate: true });
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        leafletScript.crossOrigin = '';
        document.head.appendChild(leafletScript);

        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCSS.crossOrigin = '';
        document.head.appendChild(leafletCSS);

        await new Promise((resolve) => {
          leafletScript.onload = resolve;
        });
      }

      const L = (window as any).L;
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      L.control.zoom({
        position: 'bottomleft'
      }).addTo(mapInstanceRef.current);

      // Only add click event listener if onLocationSelect is provided
      if (onLocationSelect) {
        mapInstanceRef.current.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          console.log("[useMapInitialization] Map clicked at:", lat, lng);
          const address = await fetchAddress(lat, lng);
          onLocationSelect(lat, lng, address);
        });
      }

      setMapReady(true);
      console.log("[useMapInitialization] Map initialized successfully");
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, [center, zoom, onLocationSelect]);

  return {
    mapRef,
    mapInstanceRef,
    mapReady,
    zoomToLatLng
  };
};
