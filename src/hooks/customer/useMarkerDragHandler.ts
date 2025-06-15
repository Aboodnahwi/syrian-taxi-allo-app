
/**
 * يسمح بتحريك الدبوس العادي (من أو إلى) عبر تحريك الخريطة وتثبيت الدبوس في المركز.
 */

type MarkerType = "from" | "to";

interface UseMarkerDragHandlerProps {
  manualPinMode: "none"|"from"|"to";
  setManualPinMode: (mode: "none"|"from"|"to") => void;
  setMapCenter: (coords: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  fromCoordinates: [number, number] | null;
  toCoordinates: [number, number] | null;
}

export function useMarkerDragHandler({
  manualPinMode,
  setManualPinMode,
  setMapCenter,
  setMapZoom,
  fromCoordinates,
  toCoordinates
}: UseMarkerDragHandlerProps) {
  /**
   * عند الضغط على دبوس معين أفعّل وضع manual pin mode له وأجعل مركز الخريطة هو موقعه.
   */
  function handleMarkerDrag(type: MarkerType) {
    console.log(`[useMarkerDragHandler] handleMarkerDrag called for ${type}`);
    console.log(`[useMarkerDragHandler] Current manualPinMode: ${manualPinMode}`);
    console.log(`[useMarkerDragHandler] fromCoordinates:`, fromCoordinates);
    console.log(`[useMarkerDragHandler] toCoordinates:`, toCoordinates);
    
    if (manualPinMode !== "none") {
      console.log(`[useMarkerDragHandler] Already in manual mode: ${manualPinMode}, skipping`);
      return; // لا تسمح بتحريك اثنين معًا
    }
    
    if (type === "from" && fromCoordinates) {
      console.log(`[useMarkerDragHandler] Activating manual mode for FROM marker`);
      setManualPinMode("from");
      setMapCenter(fromCoordinates);
      setMapZoom(17);
    }
    
    if (type === "to" && toCoordinates) {
      console.log(`[useMarkerDragHandler] Activating manual mode for TO marker`);
      setManualPinMode("to");
      setMapCenter(toCoordinates);
      setMapZoom(17);
    }
  }

  return { handleMarkerDrag };
}
