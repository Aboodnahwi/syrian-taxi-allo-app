import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { MapProps } from './types';
import { useMap } from '@/hooks/useMap';
import React, { useEffect, useRef } from 'react';

interface MapProps {
  mapZoomToFromRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef?: React.MutableRefObject<(() => void) | undefined>;
  onMapMove?: (center: [number, number]) => void;
}

const Map = (props: MapProps & {
  mapZoomToFromRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef?: React.MutableRefObject<(() => void) | undefined>;
}) => {
  const { mapRef, centerOnCurrentLocation, zoomToLatLng, zoomToRoute } = useMap(props);

  // Hooks for parent to control zoom of from/to/route
  useEffect(() => {
    if (props.mapZoomToFromRef)
      props.mapZoomToFromRef.current = () => {
        const from = props.markers?.find(m => m.id === "from");
        if (from) zoomToLatLng(from.position[0], from.position[1], 17);
      };
    if (props.mapZoomToToRef)
      props.mapZoomToToRef.current = () => {
        const to = props.markers?.find(m => m.id === "to");
        if (to) zoomToLatLng(to.position[0], to.position[1], 17);
      };
    if (props.mapZoomToRouteRef)
      props.mapZoomToRouteRef.current = () => {
        zoomToRoute();
      };
  }, [props.mapZoomToFromRef, props.mapZoomToToRef, props.mapZoomToRouteRef, props.markers, zoomToLatLng, zoomToRoute]);

  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (mapInstanceRef.current && props.onMapMove) {
      const map = mapInstanceRef.current;

      const handleMove = () => {
        const center = map.getCenter();
        props.onMapMove([center.lat, center.lng]);
      };
      map.on('move', handleMove);

      return () => {
        map.off('move', handleMove);
      };
    }
  }, [props.onMapMove]);

  return (
    <div className={`relative ${props.className || 'w-full h-96'}`}>
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
