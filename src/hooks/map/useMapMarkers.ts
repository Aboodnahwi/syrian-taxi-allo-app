import { useEffect, useRef } from 'react';
import { getLeaflet } from '../leafletUtils';
import { MapMarker } from '@/components/map/types';

interface UseMapMarkersProps {
  mapInstanceRef: React.MutableRefObject<any>;
  mapReady: boolean;
  markers: (MapMarker & { onClick?: () => void })[];
  toast?: (options: any) => void;
}

export const useMapMarkers = ({
  mapInstanceRef,
  mapReady,
  markers,
  toast
}: UseMapMarkersProps) => {
  const markersRef = useRef<{[k:string]: any}>({});

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) {
      console.log("[useMapMarkers] Map not ready for markers");
      return;
    }
    let L;
    try {
      L = getLeaflet();
    } catch { 
      console.log("[useMapMarkers] Leaflet not available yet");
      return; 
    }

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = {};

    // Add new markers
    markers.forEach((markerData) => {
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

      // إضافة معالج النقر إذا كان موجود
      if (markerData.onClick) {
        marker.on('click', (e: any) => {
          console.log(`[useMapMarkers] Marker ${markerData.id} clicked`);
          markerData.onClick!();
        });
      }

      // إضافة معالج السحب إذا كان الدبوس قابل للسحب
      if (markerData.draggable) {
        marker.on('dragend', async (e: any) => {
          const position = e.target.getLatLng();
          const lat = position.lat;
          const lng = position.lng;
          const address = await fetchAddress(lat, lng);
          
          console.log(`[useMapMarkers] Marker ${markerData.id} dragged to:`, lat, lng, address);
          
          // استدعاء معالج السحب العالمي مباشرة
          if ((window as any).handleMarkerDrag) {
            console.log(`[useMapMarkers] Calling window.handleMarkerDrag for ${markerData.id}`);
            (window as any).handleMarkerDrag(markerData.id as 'from' | 'to', lat, lng, address);
          } else {
            console.error(`[useMapMarkers] window.handleMarkerDrag not found!`);
          }
        });

        // إضافة معالج أثناء السحب لتحديث فوري
        marker.on('drag', (e: any) => {
          const position = e.target.getLatLng();
          console.log(`[useMapMarkers] [DRAG] Marker ${markerData.id} moving: ${position.lat}, ${position.lng}`);
        });
      }

      markersRef.current[markerData.id] = marker;
    });
  }, [markers, mapReady, mapInstanceRef]);

  return {
    markersRef
  };
};
