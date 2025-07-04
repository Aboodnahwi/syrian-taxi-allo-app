import { useCallback } from 'react';

interface RideRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  from_location: string;
  to_location: string;
  from_coordinates: [number, number];
  to_coordinates: [number, number];
  price: number;
  distance_km: number;
  estimated_duration: number;
  vehicle_type: string;
  urgent: boolean;
  created_at: string;
}

interface RideRequestClickHandlerProps {
  onRideClick: (request: RideRequest, routes: any[]) => void;
  driverLocation?: [number, number];
}

export const useRideRequestClickHandler = ({ onRideClick, driverLocation }: RideRequestClickHandlerProps) => {
  
  const handleRideClick = useCallback((request: RideRequest) => {
    if (!driverLocation) {
      console.warn('موقع السائق غير متاح');
      return;
    }

    // إنشاء مسارات ملونة
    const routes = [
      {
        coordinates: [driverLocation, request.from_coordinates],
        color: '#ef4444', // أحمر - من السائق للزبون
        weight: 4,
        opacity: 0.8,
        dashArray: '5, 5'
      },
      {
        coordinates: [request.from_coordinates, request.to_coordinates],
        color: '#22c55e', // أخضر - من الزبون للوجهة
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }
    ];

    onRideClick(request, routes);
  }, [onRideClick, driverLocation]);

  return { handleRideClick };
};