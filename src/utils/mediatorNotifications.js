import { useState, useEffect, useCallback, useMemo } from "react";
import { getOrders } from "../api";

const POLL_MS = 60000;
const EVENT = "wasata-broker-notif-change";

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem("user"))?.id ?? "guest";
  } catch (e) {
    return "guest";
  }
}

const seenKey = (uid) => `wasata_broker_seen_notifs_${uid}`;

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
  window.dispatchEvent(new Event(EVENT));
}

// بنطلّع إشعار بس للأحداث اللي مصدرها الزبونة.
// ملاحظة: بعد ما الوسيطة تنقل الطلب لحالة أبعد، إشعار "وافقت على السعر" بيختفي لأنه مبني على آخر حالة.
function buildNotifications(orders) {
  const list = [];
  orders.forEach((o) => {
    const time = o.statusUpdatedAt || o.date;
    if (o.status === "ordered_from_shein" && o.orderType !== "stock_item") {
      list.push({
        id: `${o.id}:approved`,
        orderId: o.id,
        kind: "approved",
        text: `${o.customer || "الزبونة"} وافقت على سعر الطلب #${o.id}، ابدئي بطلب المنتجات من SHEIN`,
        time,
      });
    }
    if (o.status === "cancelled" && o.orderType !== "stock_item") {
  const declinedPrice =
    !!o.statusTimes?.awaiting_approval ||
    /رفضت الزبونة السعر/.test(o.rejectionReason || "");
  list.push({
    id: `${o.id}:cancelled`,
    orderId: o.id,
    kind: declinedPrice ? "declined" : "cancelled",
    text: declinedPrice
      ? `${o.customer || "الزبونة"} رفضت سعر الطلب #${o.id} وتم إلغاؤه`
      : `${o.customer || "الزبونة"} ألغت الطلب #${o.id}`,
    time,
  });
}
  });
  return list.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export function useMediatorNotifications(enabled = true) {
  const uid = currentUserId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState(() => readSeen(uid));

  const load = useCallback(() => {
    getOrders()
      .then((list) => {
        setOrders(list);
        // أول مرة: القديم يعتبر مقروء عشان ما يطلع رقم ضخم
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