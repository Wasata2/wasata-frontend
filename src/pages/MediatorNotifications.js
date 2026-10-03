import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrderStats, rejectOrder, getReviews } from "../api";
import { useAuth } from "../context/AuthContext";
import { getUnseenReviews } from "../utils/reviewsSeen";
import { useMediatorNotifications } from "../utils/mediatorNotifications";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import { formatProductsCount } from "../utils/orders";

// صفحة الإشعارات: طلبات جديدة تحتاج قرار، تحديثات من الزبائن (موافقة على السعر / إلغاء)، وتقييمات جديدة
export default function MediatorNotifications() {
  const { user } = useAuth();
  const [newReviews, setNewReviews] = useState([]);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

  const {
    notifications: customerEvents,
    isUnread,
    markRead,
    markAllRead,
    unreadCount,
  } = useMediatorNotifications(true);

  useEffect(() => {
    const reviewsPromise = getReviews().catch(() => ({ reviews: [] }));
    Promise.all([getOrders({ status: "pending" }), getOrderStats(), reviewsPromise])
      .then(([ordersData, statsData, reviewsData]) => {
        setOrders(ordersData);
        setStats(statsData);
        setNewReviews(getUnseenReviews(user?.id ?? "me", reviewsData.reviews));
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, [user?.id]);

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

  const isEmpty = orders.length === 0 && newReviews.length === 0 && customerEvents.length === 0;

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
          <p>الطلبات الجديدة، وتحديثات الزبائن على طلباتهم، والتقييمات الجديدة على متجرك.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-outline" onClick={markAllRead}>
            تحديد التحديثات كمقروءة
          </button>
        )}
      </div>

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
            {customerEvents.length > 0 && (
              <h3 className="notifications-section-title">تحديثات من الزبائن</h3>
            )}
            {customerEvents.map((n) => (
              <div className="notification-card" key={n.id}>
                <div className="notification-card-main">
                  <div className="notification-card-title">
                    {isUnread(n.id) && <span className="notif-unread-dot" />}
                    {n.kind === "approved" ? "✅" : "❌"} {n.text}
                  </div>
                  <div className="notification-card-sub">{formatDateTime(n.time)}</div>
                </div>
                <div className="notification-card-actions">
                  <Link
                    to={`/mediator-orders/${n.orderId}`}
                    className="details-link"
                    onClick={() => markRead(n.id)}
                  >
                    عرض الطلب
                  </Link>
                </div>
              </div>
            ))}

            {newReviews.length > 0 && <h3 className="notifications-section-title">تقييمات جديدة</h3>}
            {newReviews.map((review) => (
              <div className="notification-card" key={`review-${review.id}`}>
                <div className="notification-card-main">
                  <div className="notification-card-title">
                    تقييم جديد من {review.customer}{" "}
                    <span className="notification-stars">
                      {"★".repeat(Math.max(0, Math.min(5, review.rating || 0)))}
                      {"☆".repeat(5 - Math.max(0, Math.min(5, review.rating || 0)))}
                    </span>
                  </div>
                  <div className="notification-card-sub">
                    {review.comment ? `"${review.comment}" · ` : ""}
                    {review.orderId ? `طلب #${review.orderId} · ` : ""}
                    {formatDateTime(review.date)}
                  </div>
                </div>
                <div className="notification-card-actions">
                  <Link to="/mediator-reviews" className="details-link">
                    عرض التقييم
                  </Link>
                </div>
              </div>
            ))}

            {orders.length > 0 && (newReviews.length > 0 || customerEvents.length > 0) && (
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
                  {/* القبول بدو تحديد سعر كل منتج، فبيتم من صفحة الطلبات */}
                  <Link to="/mediator-orders" className="details-link">
                    قبول وتحديد السعر
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