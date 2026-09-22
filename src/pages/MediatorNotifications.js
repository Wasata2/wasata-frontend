import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrderStats, acceptOrder, rejectOrder } from "../api";
import DashboardLayout from "../components/DashboardLayout";

// صفحة الإشعارات — بتعرض الطلبات الجديدة (status === "pending") يلي محتاجة
// قرار الوسيطة (قبول / رفض)، ونفس هالعدد هو يلي بيظهر كرقم صغير فوق زر 🔔
export default function MediatorNotifications() {

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

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
          <p>الطلبات الجديدة يلي وصلتك ولسا محتاجة قرارك (قبول أو رفض).</p>
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
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>ما في طلبات جديدة حاليًا 🎉</p>
            </div>
          ) : (
            <div className="notifications-list">
              {orders.map((order) => (
                <div className="notification-card" key={order.id}>
                  <div className="notification-card-main">
                    <div className="notification-card-title">
                      طلب جديد #{order.id} من {order.customer}
                    </div>
                    <div className="notification-card-sub">
                      {order.itemsCount} منتج · {order.amount} ر.س · {order.date}
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