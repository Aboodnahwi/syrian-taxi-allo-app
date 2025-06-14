
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { MapProps } from './types';
import { useMap } from '@/hooks/useMap';

const Map = (props: MapProps & {
  onZoomToFrom?: () => void;
  onZoomToTo?: () => void;
  onZoomToRoute?: () => void;
}) => {
  const { mapRef, centerOnCurrentLocation, zoomToLatLng, zoomToRoute } = useMap(props);
  // expose methods to parent if needed
  if (props.onZoomToFrom) props.onZoomToFrom(() => {
    if (props.markers?.find(m => m.id === "from")) {
      const from = props.markers?.find(m => m.id === "from");
      if (from) zoomToLatLng(from.position[0], from.position[1], 17);
    }
  });
  if (props.onZoomToTo) props.onZoomToTo(() => {
    if (props.markers?.find(m => m.id === "to")) {
      const to = props.markers?.find(m => m.id === "to");
      if (to) zoomToLatLng(to.position[0], to.position[1], 17);
    }
  });
  if (props.onZoomToRoute) props.onZoomToRoute(() => {
    zoomToRoute();
  });

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
