import { useState, useEffect, useCallback } from "react";
import { getStockItems } from "../api";

// القطع المحجوزة عند الوسيطة (status = reserved) — بتنتظر "تأكيد البيع" أو "إلغاء الحجز".
// العدد هون = تنبيه فعلي: بيطلع على الجرس وعلى رابط "القطع الراكدة"، وبيختفي لما الوسيطة تقرر.

const POLL_MS = 60000;
export const RESERVED_REFRESH_EVENT = "wasata-reserved-refresh";

// بننادي عليها بعد تأكيد البيع / إلغاء الحجز عشان التنبيه يتحدّث فورًا
export function refreshReservedItems() {
  window.dispatchEvent(new Event(RESERVED_REFRESH_EVENT));
}

export function useReservedItems(enabled = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(() => {
    getStockItems()
      .then((list) => setItems(list.filter((i) => i.status === "reserved")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(RESERVED_REFRESH_EVENT, load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(RESERVED_REFRESH_EVENT, load);
    };
  }, [enabled, load]);

  return { items, count: items.length, loading, reload: load };
}