/**
 * تم تعطيل سحب الماركرات العادي. التحريك الآن فقط عبر "manual pin mode" بحيث يكون الدبوس في مركز الخريطة
 */

export function useMarkerDragHandler() {
  // لا حاجة لأي منطق لأن السحب المباشر ملغى. التحريك يتم فقط عبر "manual pin mode"
  // ملاحظة: يجب استخدام setManualPinMode وonManualPinConfirm من المكون الرئيسي

  // إعادة واجهة فارغة للتماشي مع التوقيع
  return { handleMarkerDrag: () => {} };
}
