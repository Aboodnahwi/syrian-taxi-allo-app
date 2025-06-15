import { useEffect } from 'react';
import { MapProps } from '@/components/map/types';
import { useMapInitialization } from './map/useMapInitialization';
import { useMapLocation } from './map/useMapLocation';
import { useMapMarkers } from './map/useMapMarkers';
import { useMapRoute } from './map/useMapRoute';

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
  const { mapRef, mapInstanceRef, mapReady, zoomToLatLng } = useMapInitialization({
    center,
    zoom,
    onLocationSelect,
    toast
  });

  const { getCurrentLocation, centerOnCurrentLocation } = useMapLocation({
    mapInstanceRef,
    mapReady,
    toast
  });

  useMapMarkers({
    mapInstanceRef,
    mapReady,
    markers,
    toast
  });

  const { zoomToRoute } = useMapRoute({
    mapInstanceRef,
    mapReady,
    route
  });

  // Auto-get location when map is ready
  useEffect(() => {
    if (mapReady) {
      console.log("[useMap] Map ready, getting current location");
      getCurrentLocation();
    }
  }, [mapReady, getCurrentLocation]);

  return { 
    mapRef, 
    mapInstanceRef,
    centerOnCurrentLocation, 
    zoomToLatLng, 
    zoomToRoute 
  };
};
