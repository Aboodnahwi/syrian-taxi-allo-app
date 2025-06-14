
import { useState, useCallback } from 'react';
import { getLeaflet } from '../leafletUtils';

interface UseMapLocationProps {
  mapInstanceRef: React.MutableRefObject<any>;
  mapReady: boolean;
  toast?: (options: any) => void;
}

export const useMapLocation = ({ mapInstanceRef, mapReady, toast }: UseMapLocationProps) => {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const getCurrentLocation = useCallback(() => {
    console.log("[useMapLocation] getCurrentLocation called");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("[useMapLocation] User location found:", lat, lng);
          setCurrentLocation([lat, lng]);

          if (mapInstanceRef.current && mapReady) {
            try {
              const L = getLeaflet();
              const currentLocationIcon = L.divIcon({
                html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                className: 'current-location-marker'
              });

              L.marker([lat, lng], { icon: currentLocationIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('موقعك الحالي');
                
              // Move map to user location
              mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
            } catch (e) {
              console.error("Error adding current location marker:", e);
            }
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (toast) {
            toast({
              title: "خطأ في تحديد الموقع",
              description: "تعذر الوصول إلى موقعك. يرجى تفعيل خدمات الموقع والسماح بالوصول.",
              variant: "destructive"
            });
          }
        }
      );
    }
  }, [toast, mapReady, mapInstanceRef]);

  const centerOnCurrentLocation = useCallback(() => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentLocation, 15);
    } else {
      getCurrentLocation();
    }
  }, [currentLocation, getCurrentLocation, mapInstanceRef]);

  return {
    currentLocation,
    getCurrentLocation,
    centerOnCurrentLocation
  };
};
