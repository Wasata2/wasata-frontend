import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useCustomerNotifications } from "../utils/customerNotifications";
import { formatDateTime } from "../utils/dates";

export default function CustomerNotifications() {
  const { notifications, loading, isUnread, markRead, markAllRead, unreadCount } =
    useCustomerNotifications(true);

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-welcome-row">
        <div className="dashboard-welcome">
          <h1>الإشعارات</h1>
          <p>آخر التحديثات على طلباتك من الوسيطات.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-outline" onClick={markAllRead}>
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {loading ? (
        <p className="explore-loading">جاري التحميل...</p>
      ) : notifications.length === 0 ? (
        <div className="orders-empty-state">
          <p>لا توجد إشعارات حاليًا</p>
          <span>أي تحديث من الوسيطات على طلباتك رح يظهر هون.</span>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div className="notification-card" key={n.id}>
              <div>
                <div className="notification-card-title">
                  {isUnread(n.id) && <span className="notif-unread-dot" />}
                  {n.isRejected ? "❌" : "🔔"} {n.text}
                </div>
                <div className="notification-card-sub">
                  طلب #{n.orderId} · {n.store} · {formatDateTime(n.time)}
                </div>
              </div>
              <div className="notification-card-actions">
                <Link
                  to={`/orders/${n.orderId}`}
                  className="btn btn-outline btn-sm"
                  onClick={() => markRead(n.id)}
                >
                  عرض الطلب
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}