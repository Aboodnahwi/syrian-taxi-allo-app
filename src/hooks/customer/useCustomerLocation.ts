
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCustomerLocationProps {
  toast: (options: any) => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

export const useCustomerLocation = ({
  toast,
  setMapCenter,
  setMapZoom
}: UseCustomerLocationProps) => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoordinates, setFromCoordinates] = useState<[number, number] | null>(null);
  const [toCoordinates, setToCoordinates] = useState<[number, number] | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromInitialized, setFromInitialized] = useState(false);
  const [userLocated, setUserLocated] = useState(false);

  // Refs for debouncing and cancelling requests
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Auto-locate user on first load
  useEffect(() => {
    if (!fromInitialized && !fromCoordinates && navigator.geolocation) {
      console.log("[useCustomerLocation] Getting user location on first load");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("[useCustomerLocation] User location found:", lat, lng);
          setFromCoordinates([lat, lng]);
          setFromLocation("موقعي الحالي");
          setMapCenter([lat, lng]);
          setMapZoom(17);
          setUserLocated(true);
          setFromInitialized(true);
          
          toast({
            title: "تم تحديد موقعك",
            description: "تم تحديد موقعك الحالي كنقطة انطلاق",
            className: "bg-green-50 border-green-200 text-green-800"
          });
        },
        (error) => {
          console.error("[useCustomerLocation] Error getting user location:", error);
          setFromInitialized(true);
          toast({
            title: "تعذر تحديد الموقع",
            description: "يرجى السماح بالوصول لخدمات الموقع لتحديد موقعك تلقائياً",
            variant: "destructive"
          });
        }
      );
    }
  }, [fromInitialized, fromCoordinates, toast, setMapCenter, setMapZoom]);

  const performSearch = useCallback(async (query: string, type: 'from' | 'to', abortSignal: AbortSignal) => {
    try {
      console.log(`[useCustomerLocation] Searching for "${query}" (${type})`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sy&limit=5&addressdetails=1`,
        { signal: abortSignal }
      );
      
      if (abortSignal.aborted) {
        console.log(`[useCustomerLocation] Search aborted for "${query}"`);
        return;
      }

      const data = await response.json();
      const suggestions = data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));

      console.log(`[useCustomerLocation] Found ${suggestions.length} suggestions for "${query}"`);
      
      if (type === 'from') {
        setFromSuggestions(suggestions);
        setShowFromSuggestions(true);
      } else {
        setToSuggestions(suggestions);
        setShowToSuggestions(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[useCustomerLocation] Search request aborted for "${query}"`);
      } else {
        console.error('[useCustomerLocation] Error searching location:', error);
      }
    }
  }, []);

  const searchLocation = useCallback((query: string, type: 'from' | 'to') => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear suggestions immediately if query is too short
    if (query.length < 3) {
      if (type === 'from') {
        setFromSuggestions([]);
        setShowFromSuggestions(false);
      } else {
        setToSuggestions([]);
        setShowToSuggestions(false);
      }
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;

    // Set debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query, type, currentAbortController.signal);
    }, 300); // 300ms debounce
  }, [performSearch]);

  const useCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFromCoordinates([lat, lng]);
          setFromLocation('موقعي الحالي');
          setShowFromSuggestions(false);
          setMapCenter([lat, lng]);
          setMapZoom(17);
          setUserLocated(true);
        },
        (error) => {
          toast({
            title: "تعذر تحديد الموقع",
            description: "يرجى السماح بالوصول للموقع",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast, setMapCenter, setMapZoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    fromLocation,
    setFromLocation,
    toLocation,
    setToLocation,
    fromCoordinates,
    setFromCoordinates,
    toCoordinates,
    setToCoordinates,
    fromSuggestions,
    setFromSuggestions,
    toSuggestions,
    setToSuggestions,
    showFromSuggestions,
    setShowFromSuggestions,
    showToSuggestions,
    setShowToSuggestions,
    userLocated,
    setUserLocated,
    searchLocation,
    useCurrentLocation
  };
};
