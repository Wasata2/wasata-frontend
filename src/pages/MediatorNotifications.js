import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrderStats, rejectOrder } from "../api";
import { useMediatorNotifications } from "../utils/mediatorNotifications";
import { notificationIcon, notificationLink } from "../utils/serverNotifications";
import { useReservedItems } from "../utils/reservedItems";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import { formatProductsCount } from "../utils/orders";

// صفحة الإشعارات: قطع محجوزة بانتظار تأكيدك، طلبات جديدة تحتاج قرار،
// تحديثات من الزبائن (موافقة على السعر / إلغاء)، وتقييمات جديدة
export default function MediatorNotifications() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

  const {
    notifications: serverNotifs,
    error: notifError,
    hasMore,
    loadMore,
    loadingMore,
    isUnread,
    markRead,
    markAllRead,
    unreadCount,
  } = useMediatorNotifications(true);

  // القطع الراكدة المحجوزة (زبونة حجزت قطعة وبانتظار تأكيد البيع أو إلغاء الحجز)
  const { items: reservedItems } = useReservedItems(true);

  useEffect(() => {
    Promise.all([getOrders({ status: "pending" }), getOrderStats()])
      .then(([ordersData, statsData]) => {
        setOrders(ordersData);
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, []);

  const handleReject = async (orderId) => {
    setActionError("");
    setActionOrderId(orderId);
    try {
      await rejectOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setStats((prev) => (prev ? { ...prev, newCount: Math.max(0, prev.newCount - 1) } : prev));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionOrderId(null);
    }
  };

  const isEmpty =
    orders.length === 0 && serverNotifs.length === 0 && reservedItems.length === 0;

  return (
    <DashboardLayout
      role="broker"
      ordersBadge={stats && stats.newCount}
      notifBadge={stats && stats.newCount}
      notifLink="/mediator-notifications"
    >
      <div className="dashboard-welcome-row">
        <div className="dashboard-welcome">
          <h1>الإشعارات</h1>
          <p>الطلبات الجديدة، وتحديثات الزبائن على طلباتهم، والتقييمات الجديدة، والقطع المحجوزة.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-outline" onClick={markAllRead}>
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {notifError && <p className="form-error">تعذر تحميل الإشعارات: {notifError}</p>}

      {loadError && (
        <div className="empty-orders">
          <p>تعذر تحميل الإشعارات: {loadError}</p>
        </div>
      )}

      {actionError && <p className="form-error">{actionError}</p>}

      <div className="dashboard-orders">
        {loading ? (
          <div className="empty-orders">
            <p>جاري التحميل...</p>
          </div>
        ) : isEmpty ? (
          <div className="empty-orders">
            <p>ما في إشعارات جديدة حاليًا 🎉</p>
          </div>
        ) : (
          <div className="notifications-list">
            {reservedItems.length > 0 && (
              <h3 className="notifications-section-title">قطع محجوزة بانتظار تأكيدك</h3>
            )}
            {reservedItems.map((item) => (
              <div className="notification-card" key={`reserved-${item.id}`}>
                <div className="notification-card-main">
                  <div className="notification-card-title">
                    <span className="notif-unread-dot" />
                    📦 زبونة حجزت قطعة "{item.name}"
                  </div>
                  <div className="notification-card-sub">
                    {item.price} ₪ · أكدي البيع أو ألغي الحجز من صفحة القطع الراكدة
                  </div>
                </div>
                <div className="notification-card-actions">
                  <Link to="/stagnant-items" className="details-link">
                    عرض الحجز
                  </Link>
                </div>
              </div>
            ))}

            {serverNotifs.length > 0 && (
              <h3 className="notifications-section-title">آخر التحديثات</h3>
            )}
            {serverNotifs.map((n) => {
              const to = notificationLink(n, "broker");
              return (
                <div className="notification-card" key={`n-${n.id}`}>
                  <div className="notification-card-main">
                    <div className="notification-card-title">
                      {isUnread(n.id) && <span className="notif-unread-dot" />}
                      {notificationIcon(n.type)} {n.title}
                    </div>
                    <div className="notification-card-sub">
                      {n.body ? `${n.body} · ` : ""}
                      {formatDateTime(n.time)}
                    </div>
                  </div>
                  <div className="notification-card-actions">
                    {to ? (
                      <Link to={to} className="details-link" onClick={() => markRead(n.id)}>
                        عرض
                      </Link>
                    ) : (
                      isUnread(n.id) && (
                        <button type="button" className="details-link" onClick={() => markRead(n.id)}>
                          تحديد كمقروء
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button type="button" className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "جاري التحميل..." : "عرض المزيد"}
              </button>
            )}

            {orders.length > 0 &&
              (serverNotifs.length > 0 || reservedItems.length > 0) && (
                <h3 className="notifications-section-title">طلبات جديدة تحتاج قرارك</h3>
              )}
            {orders.map((order) => (
              <div className="notification-card" key={order.id}>
                <div className="notification-card-main">
                  <div className="notification-card-title">
                    طلب جديد #{order.id} من {order.customer}
                  </div>
                  <div className="notification-card-sub">
                    {formatProductsCount(order)} منتج · {formatDateTime(order.date)}
                  </div>
                </div>
                <div className="notification-card-actions">
                  {/* التسعير بدو تحديد سعر كل منتج، فبيتم من صفحة الطلبات */}
                  <Link to="/mediator-orders" className="details-link">
                    تحديد السعر وإرساله للزبونة
                  </Link>
                  <Link to={`/mediator-orders/${order.id}`} className="details-link">
                    عرض التفاصيل
                  </Link>
                  <button
                    className="icon-btn reject"
                    onClick={() => handleReject(order.id)}
                    disabled={actionOrderId === order.id}
                    title="رفض الطلب"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}