import { useState } from "react";
import { Link } from "react-router-dom";

export default function MediatorProfile() {
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);
  const userPhone = storedUser.phone || "غير متوفر";
  const userCity = storedUser.city || storedUser.store?.city || "غير محدد";

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
          <Link to="/mediator-dashboard" className="sidebar-link">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">📋</span> الطلبات
          </a>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">🛍</span> الخدمات
          </a>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">📅</span> الجدول والسعة
          </a>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">💳</span> المالية
          </a>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">⭐</span> التقييمات
          </a>
          <Link to="/mediator-profile" className="sidebar-link active">
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
          <h1>الملف الشخصي</h1>
          <p>معلوماتك الأساسية كما تظهر للزبائن.</p>
        </div>

        <div className="profile-card">
          <div className="profile-photo-wrap">
            <div className="profile-photo">{userInitial}</div>
            <span className={`availability-badge ${acceptingOrders ? "available" : "unavailable"}`}>
              {acceptingOrders ? "متاحة" : "غير متاحة"}
            </span>
          </div>

          <div className="profile-info">
            <div className="profile-field">
              <div className="profile-field-label">الاسم الكامل</div>
              <div className="profile-field-value">{userName}</div>
            </div>

            <div className="profile-field">
              <div className="profile-field-label">الموقع</div>
              <div className="profile-field-value">{userCity}</div>
            </div>

            <div className="profile-field">
              <div className="profile-field-label">رقم الهاتف</div>
              <div className="profile-field-value">{userPhone}</div>
            </div>

            <div className="profile-field">
              <div className="profile-field-label">حالة استقبال الطلبات</div>
              <div className="profile-field-value">
                <span className={`status-badge ${acceptingOrders ? "progress" : "pending"}`}>
                  {acceptingOrders ? "متاحة الآن" : "غير متاحة"}
                </span>
              </div>
            </div>
          </div>

          <button className="btn btn-outline profile-edit-btn">تعديل البيانات</button>
        </div>
      </main>
    </div>
  );
}