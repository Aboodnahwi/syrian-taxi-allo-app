
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

interface MapMarker {
  id: string;
  position: [number, number];
  popup?: string;
  icon?: {
    html: string;
    className?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  };
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  markers?: MapMarker[];
  route?: Array<[number, number]>;
  className?: string;
  toast?: (options: any) => void;
}

const MAP_SCRIPT_ID = "leaflet-cdn-script";
const MAP_CSS_ID = "leaflet-cdn-css";

const MapComponent = ({
  center = [33.5138, 36.2765], // دمشق
  zoom = 11,
  onLocationSelect,
  markers = [],
  route,
  className = "w-full h-96",
  toast
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeWithRetry = () => {
      if ((window as any).L) {
        initializeMap();
      } else {
        console.error("Leaflet not loaded, retrying...");
        setTimeout(initializeWithRetry, 200);
      }
    };

    if (!document.getElementById(MAP_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = MAP_SCRIPT_ID;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (!document.getElementById(MAP_CSS_ID)) {
          const link = document.createElement('link');
          link.id = MAP_CSS_ID;
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.onload = initializeMap;
          link.onerror = () => {
            console.error("Failed to load Leaflet CSS.");
            initializeMap(); // Try to initialize anyway
          };
          document.head.appendChild(link);
        } else {
          initializeMap();
        }
      };
      document.head.appendChild(script);
    } else {
      initializeWithRetry();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;

    try {
      const map = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      if (onLocationSelect) {
        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect(lat, lng, address);
          } catch (error) {
            console.error('Error getting address:', error);
            onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        });
      }

      mapInstanceRef.current = map;
      map.invalidateSize(); // Ensure map size is correct
      getCurrentLocation();

    } catch (error) {
        console.error("Error initializing map:", error);
        if (toast) {
            toast({
                title: "خطأ فني في الخريطة",
                description: "حدث خطأ أثناء تهيئة الخريطة. يرجى إعادة تحميل الصفحة.",
                variant: "destructive"
            });
        }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation([lat, lng]);
          
          if (mapInstanceRef.current) {
            const L = (window as any).L;
            
            // إضافة علامة للموقع الحالي
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
  };

  // تحديث العلامات
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;

    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
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

      const marker = L.marker(markerData.position, markerOptions)
        .addTo(mapInstanceRef.current);
      
      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }
      
      markersRef.current.push(marker);
    });
  }, [markers]);

  // تحديث المسار
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;

    // حذف المسار القديم
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
    }

    // إضافة المسار الجديد
    if (route && route.length > 1) {
      routeLayerRef.current = L.polyline(route, {
        color: '#ef4444',
        weight: 4,
        opacity: 0.8
      }).addTo(mapInstanceRef.current);

      // تكبير الخريطة لتشمل المسار
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

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* زر الموقع الحالي */}
      <Button
        onClick={centerOnCurrentLocation}
        className="absolute top-4 right-4 z-[1000] bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-lg"
        size="sm"
      >
        <Navigation className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MapComponent;
