
import { useState, useCallback } from 'react';

interface UseCustomerPageHandlersProps {
  locationHook: any;
  toast: (opts: any) => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  mapCenter: [number, number];
}

// A simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const useCustomerPageHandlers = ({
  locationHook,
  toast,
  setMapCenter,
  setMapZoom,
  mapCenter
}: UseCustomerPageHandlersProps) => {
  const [currentPinType, setCurrentPinType] = useState<'from' | 'to' | null>(null);

  const debouncedSetFromCoordinates = useCallback(debounce(locationHook.setFromCoordinates, 300), [locationHook.setFromCoordinates]);
  const debouncedSetToCoordinates = useCallback(debounce(locationHook.setToCoordinates, 300), [locationHook.setToCoordinates]);

  // معالج تحريك الخريطة للدبوس اليدوي
  const handleMapMove = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, [setMapCenter]);

  // معالج بدء الدبوس اليدوي
  const handleManualPin = useCallback((type: 'from' | 'to') => {
    setCurrentPinType(type);
  }, []);

  // معالج السحب العالمي
  const handleMarkerDrag = useCallback((type: 'from' | 'to', lat: number, lng: number, address: string) => {
    if (type === 'from') {
      locationHook.setFromCoordinates([lat, lng]);
      locationHook.setFromLocation(address);
    } else {
      locationHook.setToCoordinates([lat, lng]);
      locationHook.setToLocation(address);
    }
  }, [locationHook]);

  // معالج اختيار الموقع من الاقتراحات
  const handleLocationSelect = useCallback((suggestion: any, type: 'from' | 'to') => {
    if (type === "from") {
      locationHook.setFromLocation(suggestion.name);
      locationHook.setFromCoordinates([suggestion.lat, suggestion.lon]);
      locationHook.setShowFromSuggestions(false);
      setMapCenter([suggestion.lat, suggestion.lon]);
      setMapZoom(17);
    } else {
      locationHook.setToLocation(suggestion.name);
      locationHook.setToCoordinates([suggestion.lat, suggestion.lon]);
      locationHook.setShowToSuggestions(false);
      setMapCenter([suggestion.lat, suggestion.lon]);
      setMapZoom(17);
    }
  }, [locationHook, setMapCenter, setMapZoom]);

  return {
    currentPinType,
    setCurrentPinType,
    debouncedSetFromCoordinates,
    debouncedSetToCoordinates,
    handleMapMove,
    handleManualPin,
    handleMarkerDrag,
    handleLocationSelect
  };
};
