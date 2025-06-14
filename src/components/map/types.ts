
export interface MapMarker {
  id: string;
  position: [number, number];
  popup?: string;
  icon?: {
    html: string;
    className?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  };
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  markers?: MapMarker[];
  route?: Array<[number, number]>;
  className?: string;
  toast?: (options: any) => void;
}
