import { useState } from "react";
import { Link } from "react-router-dom";

export default function MediatorDashboard() {
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

  const [orders, setOrders] = useState([
    {
      id: "#1042",
      customer: "ريم العتيبي",
      date: "24 أغسطس 2026",
      items: 3,
      amount: "245 ر.س",
      status: "قيد الانتظار",
      statusClass: "pending",
    },
  ]);

  const activeServicesCount = 4;
  const inProgressCount = orders.filter(
    (o) => o.statusClass === "progress" || o.statusClass === "ordered",
  ).length;
  const newOrdersCount = orders.filter(
    (o) => o.statusClass === "pending",
  ).length;

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.PNG" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span> الرئيسية
          </Link>
          <Link to="/mediator-dashboard" className="sidebar-link active">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <Link to="/mediator-orders" className="sidebar-link">
            <span className="sidebar-icon">📋</span> الطلبات
          </Link>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">🛍</span> الخدمات
          </a>
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
            <button className="notif-btn">🔔</button>
            <div className="accept-toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={acceptingOrders}
                  onChange={(e) => setAcceptingOrders(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span>استقبال الطلبات</span>
            </div>
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
          <h1>مرحبًا، {userName.split(" ")[0]} 👋</h1>
          <p>إليك نظرة سريعة على نشاطك اليوم.</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">الخدمات النشطة</div>
              <div className="stat-value">{activeServicesCount}</div>
            </div>
            <div className="stat-icon">🛍</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">طلبات قيد التنفيذ</div>
              <div className="stat-value">{inProgressCount}</div>
            </div>
            <div className="stat-icon">📈</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">طلبات جديدة</div>
              <div className="stat-value">{newOrdersCount}</div>
            </div>
            <div className="stat-icon">📦</div>
          </div>
        </div>

        <div className="dashboard-quick-actions full-width">
          <h3>إجراءات سريعة</h3>
          <div className="quick-actions-grid">
            <button className="btn btn-primary">+ إضافة خدمة</button>
            <button className="btn btn-outline"> عرض التقييمات</button>
            <button className="btn btn-outline">عرض الطلبات</button>
            <button className="btn btn-outline">الملف الشخصي</button>
          </div>
        </div>

        <div className="dashboard-orders">
          <div className="orders-header">
            <h3>الطلبات الواردة</h3>
            <a href="#" className="view-all-link">
              عرض جميع الطلبات ⟵
            </a>
          </div>

          {orders.length === 0 ? (
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
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>{order.items}</td>
                      <td>{order.amount}</td>
                      <td>
                        <span className={`status-badge ${order.statusClass}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <a href="#" className="details-link">
                          عرض التفاصيل
                        </a>
                        {order.statusClass === "pending" && (
                          <span className="row-actions">
                            <button className="icon-btn accept">✓</button>
                            <button className="icon-btn reject">✕</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
