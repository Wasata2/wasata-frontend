import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useCustomerNotifications } from "../utils/customerNotifications";
import { notificationIcon, notificationLink } from "../utils/serverNotifications";
import { formatDateTime } from "../utils/dates";

export default function CustomerNotifications() {
  const {
    notifications,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
    isUnread,
    markRead,
    markAllRead,
    unreadCount,
  } = useCustomerNotifications(true);

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

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="explore-loading">جاري التحميل...</p>
      ) : notifications.length === 0 ? (
        <div className="orders-empty-state">
          <p>لا توجد إشعارات حاليًا</p>
          <span>أي تحديث من الوسيطات على طلباتك رح يظهر هون.</span>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const to = notificationLink(n, "customer");
            return (
              <div className="notification-card" key={n.id}>
                <div>
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
                    <Link to={to} className="btn btn-outline btn-sm" onClick={() => markRead(n.id)}>
                      عرض
                    </Link>
                  ) : (
                    isUnread(n.id) && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => markRead(n.id)}>
                        تحديد كمقروء
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "جاري التحميل..." : "عرض المزيد"}
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}