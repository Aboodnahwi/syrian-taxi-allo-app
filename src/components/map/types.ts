
export interface MapMarker {
  id: string; // "from" أو "to"
  position: [number, number];
  popup?: string;
  icon?: {
    html: string;
    className?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  };
  draggable?: boolean;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  markers?: MapMarker[];
  route?: Array<[number, number]>;
  className?: string;
  toast?: (options: any) => void;
  onMarkerDrag?: (type: 'from' | 'to', lat: number, lng: number, address: string) => void;
  // Optional refs for controlling zoom externally
  mapZoomToFromRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef?: React.MutableRefObject<(() => void) | undefined>;
}
