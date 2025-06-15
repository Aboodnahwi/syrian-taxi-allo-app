
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
    if (manualPinMode !== "none") return; // لا تسمح بتحريك اثنين معًا
    if (type === "from" && fromCoordinates) {
      setManualPinMode("from");
      setMapCenter(fromCoordinates);
      setMapZoom(17);
    }
    if (type === "to" && toCoordinates) {
      setManualPinMode("to");
      setMapCenter(toCoordinates);
      setMapZoom(17);
    }
  }

  return { handleMarkerDrag };
}
