
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { MapProps } from './types';
import { useMap } from '@/hooks/useMap';

const Map = (props: MapProps) => {
  const { mapRef, centerOnCurrentLocation } = useMap(props);

  return (
    <div className={`relative ${props.className || 'w-full h-96'}`}>
      {/* تنبيه إذا لم تحتوِ الديف على ارتفاع */}
      <div ref={mapRef} className="w-full h-full min-h-[250px] rounded-lg bg-gray-100">
        {/* هذا النص لن يظهر عادة، لكنه يظهر إذا فشلت اللوحة */}
        {/* <div className="text-red-500 text-center mt-8">الخريطة لم تظهر؟</div> */}
      </div>
      
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

