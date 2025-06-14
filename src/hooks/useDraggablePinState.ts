import { useCallback, useState } from "react";

interface UseDraggablePinStateArgs {
  manualPinMode: "none" | "from" | "to";
  setManualPinMode: (mode: "none" | "from" | "to") => void;
}
/**
 * يتحكم في حالة قابلية السحب لدبوس نقطة الانطلاق (from)
 */
export function useDraggablePinState({
  manualPinMode,
  setManualPinMode,
}: UseDraggablePinStateArgs) {
  const [fromDraggable, setFromDraggable] = useState(false);

  // يتم جعل الدبوس قابل للسحب فقط في وضع التحديد اليدوي "from"
  const enableDraggable = useCallback(() => {
    setManualPinMode("from");
    setFromDraggable(true);
  }, [setManualPinMode]);

  // يعيد الدبوس إلى الثبات بعد ضبط الموقع أو أي manual pin انتهى
  const disableDraggable = useCallback(() => {
    setFromDraggable(false);
    setManualPinMode("none");
  }, [setManualPinMode]);

  // عند الخروج من وضع "from" يجب ترك الدبوس غير قابل للسحب
  // إذا manualPinMode خرج من "from" ==> أوقف السحب
  // NOTE: hook logic is handled in parent, but can auto-reset here as well

  return {
    fromDraggable,
    enableDraggable,
    disableDraggable,
    setFromDraggable, // في حال احتجت لتعديل مباشر
  };
}
