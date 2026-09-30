import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrderStats, acceptOrder, rejectOrder, getReviews } from "../api";
import { useAuth } from "../context/AuthContext";
import { getUnseenReviews } from "../utils/reviewsSeen";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import { formatProductsCount } from "../utils/orders";

// صفحة الإشعارات — بتعرض الطلبات الجديدة (status === "pending") يلي محتاجة
// قرار الوسيطة (قبول / رفض)، والتقييمات الجديدة اللي لسا ما شافتها، ومجموعهم
// هو الرقم الصغير فوق زر 🔔
export default function MediatorNotifications() {
  const { user } = useAuth();
  const [newReviews, setNewReviews] = useState([]);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    // لو فشل جلب التقييمات ما بنوقّف الطلبات
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

  const handleAccept = async (orderId) => {
    setActionError("");
    setActionOrderId(orderId);
    try {
      await acceptOrder(orderId);
      // بعد القبول الطلب ما عاد "جديد"، فمنشيله من قائمة الإشعارات
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setStats((prev) => (prev ? { ...prev, newCount: Math.max(0, prev.newCount - 1) } : prev));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionOrderId(null);
    }
  };

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

    return (
    <DashboardLayout role="broker" ordersBadge={stats && stats.newCount} notifBadge={stats && stats.newCount} notifLink="/mediator-notifications">

        <div className="dashboard-welcome">
          <h1>الإشعارات</h1>
          <p>الطلبات الجديدة يلي محتاجة قرارك (قبول أو رفض)، والتقييمات الجديدة على متجرك.</p>
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
          ) : orders.length === 0 && newReviews.length === 0 ? (
            <div className="empty-orders">
              <p>ما في إشعارات جديدة حاليًا 🎉</p>
            </div>
          ) : (
            <div className="notifications-list">
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

              {orders.length > 0 && newReviews.length > 0 && (
                <h3 className="notifications-section-title">طلبات جديدة</h3>
              )}
              {orders.map((order) => (
                <div className="notification-card" key={order.id}>
                  <div className="notification-card-main">
                    <div className="notification-card-title">
                      طلب جديد #{order.id} من {order.customer}
                    </div>
                    <div className="notification-card-sub">
                      {formatProductsCount(order)} منتج · {order.amount} ₪ · {formatDateTime(order.date)}
                    </div>
                  </div>
                  <div className="notification-card-actions">
                    <Link to={`/mediator-orders/${order.id}`} className="details-link">
                      عرض التفاصيل
                    </Link>
                    <button
                      className="icon-btn accept"
                      onClick={() => handleAccept(order.id)}
                      disabled={actionOrderId === order.id}
                      title="قبول الطلب"
                    >
                      ✓
                    </button>
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