
import { useEffect, useRef } from 'react';
import { getLeaflet } from '../leafletUtils';
import { MapMarker } from '@/components/map/types';

interface UseMapMarkersProps {
  mapInstanceRef: React.MutableRefObject<any>;
  mapReady: boolean;
  markers: MapMarker[];
  onMarkerDrag?: (type: 'from' | 'to', lat: number, lng: number, address: string) => void;
  toast?: (options: any) => void;
}

export const useMapMarkers = ({
  mapInstanceRef,
  mapReady,
  markers,
  onMarkerDrag,
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

    console.log("[useMapMarkers] Processing markers:", markers.length, markers);

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = {};

    // Add new markers
    markers.forEach((markerData) => {
      console.log("[useMapMarkers] Adding marker:", markerData.id, markerData.position);
      
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

      // Add drag functionality for draggable markers
      if (markerData.draggable && markerData.id && onMarkerDrag) {
        marker.on('dragend', async (e: any) => {
          const latlng = e.target.getLatLng();
          console.log("[useMapMarkers] Marker dragged:", markerData.id, latlng.lat, latlng.lng);
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
      console.log("[useMapMarkers] Marker added successfully:", markerData.id);
    });

    console.log("[useMapMarkers] Total markers on map:", Object.keys(markersRef.current).length);
  }, [markers, onMarkerDrag, toast, mapReady, mapInstanceRef]);

  return {
    markersRef
  };
};
