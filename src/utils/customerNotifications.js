import { useState, useEffect, useCallback, useMemo } from "react";
import { getMyOrders } from "../api";

const POLL_MS = 60000;
const EVENT = "wasata-notif-change";

// نص الإشعار لكل حالة تيجي من طرف الوسيطة (pending ما بنعمل إلها إشعار لأنها فعل الزبونة نفسها)
const MESSAGES = {
  awaiting_approval: "الوسيطة حددت سعر طلبك — بانتظار موافقتك",
  shipped: "تم شحن طلبك",
  arrived: "وصل طلبك للوسيطة",
  inspected: "تم فحص طلبك وهو جاهز للاستلام",
  received: "تم تسليم طلبك، ما تنسي تقيّمي الوسيطة",
  rejected: "الوسيطة رفضت طلبك",
};

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem("user"))?.id ?? "guest";
  } catch (e) {
    return "guest";
  }
}

const seenKey = (uid) => `wasata_seen_notifs_${uid}`;

function readSeen(uid) {
  try {
    const raw = localStorage.getItem(seenKey(uid));
    return raw === null ? null : new Set(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

function writeSeen(uid, set) {
  try {
    localStorage.setItem(seenKey(uid), JSON.stringify([...set]));
  } catch (e) {}
  // عشان الجرس والصفحة (نسختين من الـ hook) يتزامنوا
  window.dispatchEvent(new Event(EVENT));
}

function buildNotifications(orders) {
  return orders
    .filter((o) => MESSAGES[o.rawStatus])
    .map((o) => ({
      id: `${o.id}:${o.rawStatus}`,
      orderId: o.id,
      text: MESSAGES[o.rawStatus],
      store: o.store,
      time: o.statusUpdatedAt || o.date,
      isRejected: o.rawStatus === "rejected",
    }))
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

export function useCustomerNotifications(enabled = true) {
  const uid = currentUserId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState(() => readSeen(uid));

  const load = useCallback(() => {
    getMyOrders()
      .then(({ orders: list }) => {
        setOrders(list);
        // أول مرة بتفتح فيها الميزة: بنعتبر الإشعارات القديمة مقروءة عشان ما يطلع رقم ضخم
        if (readSeen(uid) === null) {
          writeSeen(uid, new Set(buildNotifications(list).map((n) => n.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    const onVisible = () => !document.hidden && load();
    const onChange = () => setSeen(readSeen(uid));
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(EVENT, onChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(EVENT, onChange);
    };
  }, [enabled, load, uid]);

  const notifications = useMemo(() => buildNotifications(orders), [orders]);
  const seenSet = seen || new Set();
  const unreadCount = notifications.filter((n) => !seenSet.has(n.id)).length;

  const markRead = (id) => {
    const next = new Set(seenSet);
    next.add(id);
    writeSeen(uid, next);
  };
  const markAllRead = () => {
    writeSeen(uid, new Set([...seenSet, ...notifications.map((n) => n.id)]));
  };

  return {
    notifications,
    unreadCount,
    loading,
    isUnread: (id) => !seenSet.has(id),
    markRead,
    markAllRead,
  };
}