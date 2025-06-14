
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

  // يعيد الدبوس إلى الثبات بعد ضبط الموقع
  const disableDraggable = useCallback(() => {
    setFromDraggable(false);
    setManualPinMode("none");
  }, [setManualPinMode]);

  // مراقبة manualPinMode في حالة الخروج من الوضع اليدوي ممكن إعادة الضبط في بعض السيناريوهات (الشفافية فقط)
  // لكن طالما نضبط عبر enable/disable فلن نضع useEffect هنا.

  return {
    fromDraggable,
    enableDraggable,
    disableDraggable,
    setFromDraggable, // في حال احتجت لتعديل مباشر
  };
}
