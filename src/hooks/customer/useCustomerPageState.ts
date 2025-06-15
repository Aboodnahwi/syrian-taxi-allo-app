
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVehiclePricing } from '@/hooks/useVehiclePricing';
import { useRealTimeTrips } from '@/hooks/useRealTime';
import { useToast } from '@/hooks/use-toast';
import { useCustomerLocation } from '@/hooks/customer/useCustomerLocation';
import { useCustomerRouting } from '@/hooks/customer/useCustomerRouting';
import { useCustomerRide } from '@/hooks/customer/useCustomerRide';

export const useCustomerPageState = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { pricing, calculatePrice } = useVehiclePricing();
  const trips = useRealTimeTrips('customer', user?.id);

  const [selectedVehicle, setSelectedVehicle] = useState('regular');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5138, 36.2765]);
  const [mapZoom, setMapZoom] = useState<number>(11);

  // Map zoom callback refs
  const mapZoomToFromRef = useRef<() => void>();
  const mapZoomToToRef = useRef<() => void>();
  const mapZoomToRouteRef = useRef<() => void>();

  const locationHook = useCustomerLocation({
    toast,
    setMapCenter,
    setMapZoom
  });

  const routingHook = useCustomerRouting({
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    toast,
    mapZoomToRouteRef
  });

  const rideHook = useCustomerRide({
    userId: user?.id || '',
    fromLocation: locationHook.fromLocation,
    toLocation: locationHook.toLocation,
    fromCoordinates: locationHook.fromCoordinates,
    toCoordinates: locationHook.toCoordinates,
    selectedVehicle,
    calculatePrice,
    calculateDirectDistance: (from, to) => {
      const R = 6371;
      const dLat = (to[0] - from[0]) * Math.PI / 180;
      const dLon = (to[1] - from[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    },
    toast,
    setFromLocation: locationHook.setFromLocation,
    setToLocation: locationHook.setToLocation,
    setFromCoordinates: locationHook.setFromCoordinates,
    setToCoordinates: locationHook.setToCoordinates,
    setRoute: () => {}
  });

  // Update estimated price when route changes
  useEffect(() => {
    if (routingHook.routeDistance > 0) {
      const price = calculatePrice(routingHook.routeDistance, selectedVehicle);
      setEstimatedPrice(price);
    }
  }, [routingHook.routeDistance, selectedVehicle, calculatePrice]);

  return {
    user,
    signOut,
    pricing,
    selectedVehicle,
    setSelectedVehicle,
    estimatedPrice,
    orderOpen,
    setOrderOpen,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    mapZoomToFromRef,
    mapZoomToToRef,
    mapZoomToRouteRef,
    locationHook: {
      ...locationHook,
      calculateRoute: routingHook.calculateRoute
    },
    routingHook,
    rideHook,
    toast
  };
};
