import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderDetails } from "../api";

const STATUS_META = {
  new: { label: "طلب جديد", className: "new" },
  in_progress: { label: "قيد التنفيذ", className: "progress" },
  completed: { label: "مكتمل", className: "done" },
  rejected: { label: "مرفوض", className: "rejected" },
};

export default function OrderDetails() {
  const { id } = useParams();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderDetails(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="dashboard-layout">
      {/* ===== نفس القائمة الجانبية الموجودة بباقي صفحات لوحة التحكم ===== */}
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
          <Link to="/mediator-orders" className="sidebar-link active">
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
        {/* ===== نفس الـ topbar الموجود بباقي صفحات لوحة التحكم ===== */}
        <div className="dashboard-topbar">
          <div className="topbar-actions">
            <button className="notif-btn">🔔</button>
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-store">وسيطة</div>
            </div>
            <div className="user-avatar">{userInitial}</div>
          </div>
        </div>

        <Link to="/mediator-orders" className="back-link order-details-back">
          ‹ العودة إلى الطلبات
        </Link>

        {loading ? (
          <div className="empty-orders">
            <p>جاري تحميل تفاصيل الطلب...</p>
          </div>
        ) : error ? (
          <div className="empty-orders">
            <p>تعذر تحميل الطلب: {error}</p>
          </div>
        ) : (
          <>
            <div className="order-details-card">
              <div className="order-details-top">
                <div>
                  <h1>طلب #{order.id}</h1>
                  <span
                    className={`status-badge ${STATUS_META[order.status]?.className || ""}`}
                  >
                    {STATUS_META[order.status]?.label || order.status}
                  </span>
                </div>
              </div>

              <div className="order-details-meta">
                <div>
                  <div className="profile-field-label">رقم الطلب</div>
                  <div className="profile-field-value">#{order.id}</div>
                </div>
                <div>
                  <div className="profile-field-label">تاريخ الطلب</div>
                  <div className="profile-field-value">{order.date}</div>
                </div>
                <div>
                  <div className="profile-field-label">اسم الزبونة</div>
                  <div className="profile-field-value">{order.customer}</div>
                </div>
                <div>
                  <div className="profile-field-label">عدد المنتجات</div>
                  <div className="profile-field-value">{order.itemsCount}</div>
                </div>
              </div>
            </div>

            <div className="order-details-card">
              <h2 className="order-details-section-title">المنتجات</h2>
              {(order.items || []).length === 0 ? (
                <p className="service-description">لا توجد تفاصيل منتجات لهذا الطلب.</p>
              ) : (
                order.items.map((item) => (
                  <div className="order-item-row" key={item.id}>
                    {item.image && (
                      <img src={item.image} alt={item.name} className="order-item-image" />
                    )}
                    <div className="order-item-info">
                      <div className="order-item-name">{item.name}</div>
                      {item.sheinUrl && (
                        <a
                          href={item.sheinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-item-link"
                        >
                          🔗 رابط المنتج على SHEIN
                        </a>
                      )}
                      <div className="order-item-tags">
                        {item.size && <span className="service-fee-tag">المقاس: {item.size}</span>}
                        {item.color && <span className="service-fee-tag">اللون: {item.color}</span>}
                        {item.quantity && (
                          <span className="service-fee-tag">الكمية: {item.quantity}</span>
                        )}
                      </div>
                      {item.notes && <div className="service-notes">ملاحظة: {item.notes}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}