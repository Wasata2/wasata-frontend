import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getServices, getOrders, getOrderStats, getMyStore, updateStore, BASE_URL } from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

// رابط صورة المتجر يجي أحيانًا من الباك اند كمسار نسبي (بدون دومين) —
// هاي الدالة بتتأكد إنه رابط كامل قبل ما نعرضه، وإلا بترجع null
function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (!clean.includes("/")) {
    return `${BASE_URL}/storage/${clean}`;
  }
  return `${BASE_URL}/${clean}`;
}

export default function MediatorDashboard() {
  const { user } = useAuth();
  const userName = user?.full_name || "مستخدمة";
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [loadingServicesCount, setLoadingServicesCount] = useState(true);

  useEffect(() => {
    // نجيب حالة استقبال الطلبات الحقيقية من المتجر بدل القيمة الافتراضية المحلية
    getMyStore()
      .then((data) => {
        const store = data.store || data;
        setAcceptingOrders(!!store.is_accepting_orders);
        setImagePreview(resolveImageUrl(store.image_url || store.image));
      })
      .catch(() => { });

    getServices()
      .then((data) => {
        setActiveServicesCount(data.filter((s) => s.available).length);
        setLoadingServicesCount(false);
      })
      .catch(() => {
        setLoadingServicesCount(false);
      });

    Promise.all([getOrders(), getOrderStats()])
      .then(([ordersData, statsData]) => {
        setOrders(ordersData);
        setStats(statsData);
        setLoadingOrders(false);
      })
      .catch(() => {
        setLoadingOrders(false);
      });
  }, []);

  // لما الوسيطة تبدّل السويتش، منبعت التحديث فعليًا للباك اند
  const handleToggleAccepting = async (checked) => {
    setAcceptingOrders(checked);
    try {
      await updateStore({ is_accepting_orders: checked });
    } catch (err) {
      setAcceptingOrders(!checked);
    }
  };

  const latestNewOrder = orders.find((o) => o.status === "new");

  const inProgressCount = stats ? stats.inProgressCount : 0;
  const newOrdersCount = stats ? stats.newCount : 0;

  const acceptToggle = (
    <div className="accept-toggle">
      <label className="switch">
        <input
          type="checkbox"
          checked={acceptingOrders}
          onChange={(e) => handleToggleAccepting(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
      <span>استقبال الطلبات</span>
    </div>
  );

  return (
    <DashboardLayout
      role="broker"
      ordersBadge={newOrdersCount}
      topbarExtra={acceptToggle}
      avatarImage={imagePreview}
      notifBadge={newOrdersCount}
      notifLink="/mediator-notifications"
    >
      <div className="dashboard-welcome">
        <h1>مرحبًا، {userName.split(" ")[0]} 👋</h1>
        <p>إليك نظرة سريعة على نشاطك اليوم.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div>
            <div className="stat-label">الخدمات النشطة</div>
            <div className="stat-value">
              {loadingServicesCount ? "…" : activeServicesCount}
            </div>
          </div>
          <div className="stat-icon">🛍</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">طلبات قيد التنفيذ</div>
            <div className="stat-value">{loadingOrders ? "…" : inProgressCount}</div>
          </div>
          <div className="stat-icon">📈</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">طلبات جديدة</div>
            <div className="stat-value">{loadingOrders ? "…" : newOrdersCount}</div>
          </div>
          <div className="stat-icon">📦</div>
        </div>
      </div>

      {latestNewOrder && (
        <div className="new-order-banner">
          <Link to={`/mediator-orders/${latestNewOrder.id}`} className="btn btn-primary">
            عرض الطلب
          </Link>
          <div className="new-order-banner-text">
            <span className="new-order-badge">جديد</span>
            لديك طلب جديد من <strong>{latestNewOrder.customer}</strong>
            <div className="new-order-banner-sub">
              طلب #{latestNewOrder.id} · {latestNewOrder.itemsCount} منتجات
            </div>
          </div>
          <div className="new-order-banner-icon">📦</div>
        </div>
      )}

      <div className="dashboard-quick-actions full-width">
        <h3>إجراءات سريعة</h3>
        <div className="quick-actions-grid">
          <Link to="/mediator-services" className="btn btn-primary">
            + إضافة خدمة
          </Link>
          <Link to="/mediator-reviews" className="btn btn-primary">
            عرض التقييمات
          </Link>
          <Link to="/mediator-orders" className="btn btn-primary">
            عرض الطلبات
          </Link>
          <Link to="/mediator-profile" className="btn btn-primary">
            الملف الشخصي
          </Link>
        </div>
      </div>

      <div className="dashboard-orders">
        <div className="orders-header">
          <h3>الطلبات الواردة</h3>
          <Link to="/mediator-orders" className="view-all-link">
            عرض جميع الطلبات ⟵
          </Link>
        </div>

        {loadingOrders ? (
          <div className="empty-orders">
            <p>جاري التحميل...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-orders">
            <p>لا توجد طلبات واردة حاليًا.</p>
          </div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>اسم الزبونة</th>
                  <th>التاريخ</th>
                  <th>المنتجات</th>
                  <th>المبلغ التقديري</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>{order.itemsCount}</td>
                    <td>{order.amount} ر.س</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td>
                      <Link to={`/mediator-orders/${order.id}`} className="details-link">
                        عرض التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}