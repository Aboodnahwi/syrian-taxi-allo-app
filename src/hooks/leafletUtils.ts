
export const getLeaflet = (): any => {
  if (typeof window !== "undefined" && (window as any).L) {
    return (window as any).L;
  }
  throw new Error("Leaflet ليس محملًا بشكل صحيح في window.L");
};
