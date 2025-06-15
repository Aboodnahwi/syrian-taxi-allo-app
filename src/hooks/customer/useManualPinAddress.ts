
import { useState, useEffect } from 'react';

interface UseManualPinAddressProps {
  mapCenter: [number, number];
  manualPinMode?: "none" | "from" | "to";
}

export const useManualPinAddress = ({ mapCenter, manualPinMode }: UseManualPinAddressProps) => {
  const [manualPinAddress, setManualPinAddress] = useState<string>("");

  useEffect(() => {
    if (!manualPinMode || manualPinMode === "none") {
      setManualPinAddress("");
      return;
    }
    
    let isActive = true;
    const [lat, lng] = mapCenter;
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (isActive) {
          if (data.display_name) setManualPinAddress(data.display_name);
          else setManualPinAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      })
      .catch(() => setManualPinAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`));
    
    return () => { isActive = false; };
  }, [mapCenter, manualPinMode]);

  return { manualPinAddress };
};
