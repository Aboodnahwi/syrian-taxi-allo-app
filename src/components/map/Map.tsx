
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { MapProps } from './types';
import { useMap } from '@/hooks/useMap';

const Map: React.FC<MapProps> = ({
  className,
  center,
  zoom,
  markers,
  route,
  onLocationSelect,
  onMarkerDrag,
  toast,
  mapZoomToFromRef,
  mapZoomToToRef,
  mapZoomToRouteRef,
  onMapMove,
}) => {
  const { mapRef, centerOnCurrentLocation, zoomToLatLng, zoomToRoute } = useMap({
    center,
    zoom,
    onLocationSelect,
    markers,
    route,
    toast,
    onMarkerDrag,
  });

  // Hooks for parent to control zoom of from/to/route
  useEffect(() => {
    if (mapZoomToFromRef)
      mapZoomToFromRef.current = () => {
        const from = markers?.find(m => m.id === "from");
        if (from) zoomToLatLng(from.position[0], from.position[1], 17);
      };
    if (mapZoomToToRef)
      mapZoomToToRef.current = () => {
        const to = markers?.find(m => m.id === "to");
        if (to) zoomToLatLng(to.position[0], to.position[1], 17);
      };
    if (mapZoomToRouteRef)
      mapZoomToRouteRef.current = () => {
        zoomToRoute();
      };
    // eslint-disable-next-line
  }, [mapZoomToFromRef, mapZoomToToRef, mapZoomToRouteRef, markers, zoomToLatLng, zoomToRoute]);

  // mapMove live center (for manual pin update)
  const mapInstanceRef = useRef<any>(null);
  useEffect(() => {
    // we rely on the hook creating the instance on mapRef.current
    // this requires that useMap underhood puts map instance on mapRef.current (or expose one shared place)
    if (mapRef.current && onMapMove) {
      // Try to support both possible approaches
      const map = mapRef.current.leafletElement || mapRef.current;
      if (!map) return;
      const handleMove = () => {
        const center = map.getCenter();
        // LatLng is usually LatLng object for leaflet
        onMapMove([center.lat, center.lng]);
      };
      map.on('move', handleMove);
      return () => {
        map.off('move', handleMove);
      };
    }
  }, [mapRef, onMapMove]);
  
  return (
    <div className={`relative ${className || 'w-full h-96'}`}>
      <div ref={mapRef} className="w-full h-full min-h-[250px] rounded-lg bg-gray-100" />
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

export default Map;
