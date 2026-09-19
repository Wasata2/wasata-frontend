import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrderStats, acceptOrder, rejectOrder } from "../api";

// صفحة الإشعارات — بتعرض الطلبات الجديدة (status === "pending") يلي محتاجة
// قرار الوسيطة (قبول / رفض)، ونفس هالعدد هو يلي بيظهر كرقم صغير فوق زر 🔔
export default function MediatorNotifications() {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

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
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span> الرئيسية
          </Link>
          <Link to="/mediator-dashboard" className="sidebar-link">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <Link to="/mediator-orders" className="sidebar-link">
            <span className="sidebar-icon">📋</span> الطلبات
          </Link>
          <Link to="/mediator-services" className="sidebar-link">
            <span className="sidebar-icon">🛍</span> الخدمات
          </Link>
          <Link to="/mediator-reviews" className="sidebar-link">
            <span className="sidebar-icon">⭐</span> التقييمات
          </Link>
          <Link to="/mediator-profile" className="sidebar-link">
            <span className="sidebar-icon">👤</span> الملف الشخصي
          </Link>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="topbar-actions">
            <span className="notif-btn-wrap">
              <button className="notif-btn active">🔔</button>
              {stats && stats.newCount > 0 && (
                <span className="notif-badge">{stats.newCount}</span>
              )}
            </span>
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-store">وسيطة</div>
            </div>
            <div className="user-avatar">{userInitial}</div>
          </div>
        </div>

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
      </main>
    </div>
  );
}