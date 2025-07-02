import { useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface RideRequestMapProps {
  fromCoordinates: [number, number];
  toCoordinates: [number, number];
  driverLocation?: [number, number];
  fromLocation: string;
  toLocation: string;
  distanceToPickup?: number;
}

const RideRequestMap = ({ 
  fromCoordinates, 
  toCoordinates, 
  driverLocation, 
  fromLocation, 
  toLocation,
  distanceToPickup 
}: RideRequestMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

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

      // إنشاء الخريطة
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);

      // إضافة علامة نقطة البداية (موقع الزبون)
      L.marker(fromCoordinates, {
        icon: L.divIcon({
          html: `<div class="bg-green-500 text-white p-1 rounded-full shadow-lg border-2 border-white">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                     <circle cx="12" cy="10" r="3"></circle>
                   </svg>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: 'pickup-marker'
        })
      }).addTo(mapInstanceRef.current)
        .bindPopup(`موقع الزبون: ${fromLocation}`);

      // إضافة علامة نقطة النهاية
      L.marker(toCoordinates, {
        icon: L.divIcon({
          html: `<div class="bg-red-500 text-white p-1 rounded-full shadow-lg border-2 border-white">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                     <circle cx="12" cy="10" r="3"></circle>
                   </svg>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: 'destination-marker'
        })
      }).addTo(mapInstanceRef.current)
        .bindPopup(`الوجهة: ${toLocation}`);

      // إضافة موقع السائق إذا كان متوفراً
      if (driverLocation) {
        L.marker(driverLocation, {
          icon: L.divIcon({
            html: `<div class="bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-white animate-pulse">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M8 18V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12l-4-2-4 2Z"></path>
                     </svg>
                   </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            className: 'driver-marker'
          })
        }).addTo(mapInstanceRef.current)
          .bindPopup('موقعك الحالي');
      }

      // رسم خط المسار
      const routeLine = L.polyline([fromCoordinates, toCoordinates], { 
        color: '#ef4444', 
        weight: 3, 
        opacity: 0.7,
        dashArray: '8, 4'
      }).addTo(mapInstanceRef.current);

      // تعديل نطاق العرض لإظهار جميع النقاط
      const allPoints = driverLocation 
        ? [fromCoordinates, toCoordinates, driverLocation]
        : [fromCoordinates, toCoordinates];
      
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { 
        padding: [10, 10],
        maxZoom: 15
      });
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [fromCoordinates, toCoordinates, driverLocation, fromLocation, toLocation]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      <div className="p-2 bg-blue-100 border-b border-blue-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-blue-700">
            <MapPin className="w-3 h-3" />
            <span className="font-semibold">خط سير الرحلة</span>
          </div>
          {distanceToPickup && (
            <div className="flex items-center gap-1 text-blue-600">
              <Navigation className="w-3 h-3" />
              <span>بُعدك: {distanceToPickup.toFixed(1)} كم</span>
            </div>
          )}
        </div>
      </div>
      <div ref={mapRef} className="h-32 w-full bg-slate-100"></div>
      <div className="p-2 bg-blue-50 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 truncate max-w-[120px]">{fromLocation}</span>
          </div>
          <div className="flex-1 border-t border-dashed border-blue-300 mx-2"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-700 truncate max-w-[120px]">{toLocation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideRequestMap;