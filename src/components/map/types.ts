
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
  draggable?: boolean; // الجديد
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
  // callbacks لزوم جديد
  onZoomToFrom?: (cb: () => void) => void;
  onZoomToTo?: (cb: () => void) => void;
  onZoomToRoute?: (cb: () => void) => void;
}
