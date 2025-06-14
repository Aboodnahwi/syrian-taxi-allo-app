
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { MapProps } from './types';
import { useMap } from '@/hooks/useMap';

const Map = (props: MapProps) => {
  const { mapRef, centerOnCurrentLocation } = useMap(props);

  return (
    <div className={`relative ${props.className || 'w-full h-96'}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
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
