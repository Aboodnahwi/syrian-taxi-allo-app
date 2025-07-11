export interface MapMarker {
  id: string;
  position: [number, number];
  popup?: string;
  draggable?: boolean;
  icon?: {
    html: string;
    className?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  };
  onClick?: () => void;
}

export interface MapProps {
  className?: string;
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  toast?: (opts: any) => void;
  onMarkerDrag?: (type: 'from' | 'to', lat: number, lng: number, address: string) => void;
  mapZoomToFromRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToToRef?: React.MutableRefObject<(() => void) | undefined>;
  mapZoomToRouteRef?: React.MutableRefObject<(() => void) | undefined>;
  /** سيتم استدعاؤها مع الإحداثيات فور كل تحريك للخريطة (مخصصة لوضع الدبوس اليدوي) */
  onMapMove?: (center: [number, number]) => void;
}
