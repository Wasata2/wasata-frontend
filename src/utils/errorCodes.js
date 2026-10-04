// رسائل عربية لـ error_code اللي بيرجّعها الباك اند. الكود ثابت، أما النص الإنجليزي
// ممكن يتغير، فهيك رسائلنا ما بتنكسر لو الباك اند عدّل صياغة رسالته.
export const ERROR_CODE_MESSAGES = {
  STORE_NOT_ACCEPTING_ORDERS: "هاي الوسيطة مش مستقبلة طلبات حاليًا.",
  PICKUP_NOT_AVAILABLE:
    "هاي الوسيطة ما حدّدت نقطة استلام بعد، فما بتقدري تختاري \"الاستلام من نقطة استلام\" معها حاليًا. جربي التوصيل إلى المنزل إذا كان متوفر، أو تواصلي مع الوسيطة مباشرة.",
  DELIVERY_REGION_NOT_SERVED:
    "هاي الوسيطة ما بتوصّل لمنطقتك. اختاري منطقة ثانية أو الاستلام من نقطة.",
  SERVICE_NOT_AVAILABLE: "إحدى الخدمات اللي اخترتيها غير متاحة حاليًا.",
  ORDER_ACCESS_DENIED: "ما عندك صلاحية لعرض هذا الطلب.",
  ORDER_NOT_YOURS: "هذا الطلب مش تابع لحسابك.",
  ORDER_NOT_PENDING: "هذا الطلب ما عاد بانتظار القرار. حدّثي الصفحة.",
  MISSING_ITEM_PRICES: "لازم تحددي سعر كل المنتجات قبل الإرسال.",
  ORDER_NOT_AWAITING_APPROVAL: "هذا الطلب مش بانتظار موافقة على السعر. حدّثي الصفحة.",
  ORDER_NOT_CANCELLABLE: "ما بيمكن إلغاء الطلب بهالمرحلة.",
  ORDER_PENDING_DECISION: "لازم تقبلي الطلب أو ترفضيه أول.",
  ORDER_AWAITING_APPROVAL:
    "الطلب بانتظار موافقة الزبونة على السعر، فما بتقدري تغيّري حالته الآن.",
  INVALID_STATUS_TRANSITION: "ما بيمكن الانتقال لهالحالة مباشرة.",
  STORE_NOT_FOUND: "ما لقينا متجر لهالحساب.",
  STORE_NOT_PUBLISHED: "هذا المتجر مش منشور حاليًا.",
  STOCK_ITEM_NOT_YOURS: "هاي القطعة مش تابعة لمتجرك.",
  STOCK_ITEM_NOT_UNLISTED: "هاي القطعة معروضة أصلًا.",
  STOCK_ITEM_NOT_LISTED: "هاي القطعة مش معروضة حاليًا.",
  STOCK_ITEM_NOT_RESERVED: "هاي القطعة مش محجوزة.",
  // حذف الحساب (لما ينبني)
  ACCOUNT_HAS_ACTIVE_ORDERS:
    "ما بتقدري تحذفي حسابك وعندك طلبات نشطة. أنهيها أو ألغيها أول.",
  INCORRECT_PASSWORD: "كلمة المرور غير صحيحة.",
};

export function messageForErrorCode(code) {
  return (code && ERROR_CODE_MESSAGES[code]) || null;
}