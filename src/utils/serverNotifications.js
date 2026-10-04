import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api";

// الإشعارات الحقيقية من الباك اند (بدل ما نحسبها من حالة الطلبات ونحفظ "المقروء" بالمتصفح).
// الجرس والصفحة كل واحد بيستخدم نسخة من هاد الـ hook، فبنستخدم event عشان يتزامنوا.
const POLL_MS = 30000; // الباك اند وافق على polling كل 20-30 ثانية
const PER_PAGE = 20;
const EVENT = "wasata-server-notif-change";

const byNewest = (a, b) => new Date(b.time) - new Date(a.time);

export function useServerNotifications(enabled = true) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const loadedPage = useRef(1);

  const load = useCallback(async () => {
    try {
      const [{ notifications: first, pagination }, count] = await Promise.all([
        getNotifications({ page: 1, perPage: PER_PAGE }),
        getUnreadNotificationsCount().catch(() => null),
      ]);
      // بندمج الصفحة الأولى مع اللي حمّلناه قبل (لو كبست "عرض المزيد")
      setNotifications((prev) => {
        const firstIds = new Set(first.map((n) => n.id));
        const older = prev.filter((n) => !firstIds.has(n.id));
        return [...first, ...older].sort(byNewest);
      });
      setUnreadCount(count !== null ? count : first.filter((n) => !n.read).length);
      if (loadedPage.current === 1) {
        setHasMore(!!pagination && pagination.current_page < pagination.last_page);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    const onVisible = () => !document.hidden && load();
    const onChange = () => load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(EVENT, onChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(EVENT, onChange);
    };
  }, [enabled, load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = loadedPage.current + 1;
      const { notifications: more, pagination } = await getNotifications({
        page: next,
        perPage: PER_PAGE,
      });
      loadedPage.current = next;
      setNotifications((prev) => {
        const ids = new Set(prev.map((n) => n.id));
        return [...prev, ...more.filter((n) => !ids.has(n.id))].sort(byNewest);
      });
      setHasMore(!!pagination && pagination.current_page < pagination.last_page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    // تحديث فوري بالشاشة، وبعدين بنأكد من الباك اند
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      setError(err.message);
    }
    window.dispatchEvent(new Event(EVENT));
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      setError(err.message);
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    isUnread: (id) => notifications.some((n) => n.id === id && !n.read),
    markRead,
    markAllRead,
  };
}

// أنواع الإشعارات الفعلية من الباك اند (type) → أيقونة
const ICONS = {
  order_placed: "🛍️", // الوسيطة: زبونة بعتت طلب جديد
  order_rejected: "❌", // الزبونة: الوسيطة رفضت الطلب
  order_cancelled: "❌", // الوسيطة: الزبونة ألغت الطلب أو رفضت السعر
  order_status_changed: "📦", // الزبونة: الوسيطة حرّكت الطلب بالمسار
  price_ready: "💰", // الزبونة: الوسيطة سعّرت الطلب
  price_approved: "✅", // الوسيطة: الزبونة وافقت على السعر
  review_received: "⭐", // الوسيطة: زبونة كتبت تقييم
  stock_item_reserved: "📦", // الوسيطة: زبونة حجزت قطعة راكدة
  stock_item_reservation_cancelled: "❌", // الزبونة: الوسيطة ألغت الحجز
  stock_item_sold: "✅", // الزبونة: الوسيطة أكدت بيع القطعة
};

export function notificationIcon(type) {
  return ICONS[type] || "🔔";
}

// وين بيروح الإشعار لما نضغط عليه (null = ما في صفحة مرتبطة)
export function notificationLink(n, role) {
  const itemId = n.data?.item_id;
  if (role === "broker") {
    if (n.type === "review_received") return "/mediator-reviews";
    if (n.type.startsWith("stock_item_")) return "/stagnant-items";
    return n.orderId ? `/mediator-orders/${n.orderId}` : null;
  }
  // زبونة
  if (n.type.startsWith("stock_item_")) return itemId ? `/stock-orders/${itemId}` : "/my-orders";
  return n.orderId ? `/orders/${n.orderId}` : null;
}