import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  markers?: Array<{
    id: string;
    position: [number, number];
    popup?: string;
    icon?: string;
  }>;
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

    // لا تكرر التحميل إذا تمت إضافته سابقًا
    if (!document.getElementById(MAP_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = MAP_SCRIPT_ID;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (!document.getElementById(MAP_CSS_ID)) {
          const link = document.createElement('link');
          link.id = MAP_CSS_ID;
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        setTimeout(() => {
          initializeMap();
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;

    if (!L) {
      console.error("Leaflet is not loaded");
      if(toast) {
          toast({
              title: "خطأ في تحميل الخريطة",
              description: "لم يتم تحميل مكتبة الخرائط بنجاح. يرجى المحاولة مرة أخرى.",
              variant: "destructive"
          });
      }
      return;
    }

    const map = L.map(mapRef.current).setView(center, zoom);

    // إضافة طبقة OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // إضافة حدث النقر على الخريطة
    if (onLocationSelect) {
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        
        // الحصول على العنوان من الإحداثيات
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
    getCurrentLocation();
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
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;

    // حذف العلامات القديمة
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // إضافة العلامات الجديدة
    markers.forEach((markerData) => {
      const marker = L.marker(markerData.position)
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
