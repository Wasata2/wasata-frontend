import { useState } from "react";
import { Link } from "react-router-dom";

export default function MediatorProfile() {
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const storedUser = JSON.parse(localStorage.getItem('user')) || {};

  const [form, setForm] = useState({
    fullName: storedUser.full_name || "",
    phone: storedUser.phone || "",
    city: storedUser.city || storedUser.store?.city || "",
  });

  const userInitial = (form.fullName || "م").charAt(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.fullName || !form.phone) {
      setError("يرجى تعبئة الحقول الإلزامية.");
      return;
    }
    setError("");

    // تحديث البيانات محليًا (localStorage)
    const updatedUser = {
      ...storedUser,
      full_name: form.fullName,
      phone: form.phone,
      city: form.city,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // TODO: إرسال التحديث فعليًا للباك اند عند توفر الـ endpoint المناسب
    // مثال متوقع: apiPostWithAuth('/api/profile/update', { full_name, phone, city })

    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      fullName: storedUser.full_name || "",
      phone: storedUser.phone || "",
      city: storedUser.city || storedUser.store?.city || "",
    });
    setError("");
    setIsEditing(false);
  };

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
              <div className="user-name">{form.fullName}</div>
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

          {!isEditing ? (
            <>
              <div className="profile-info">
                <div className="profile-field">
                  <div className="profile-field-label">الاسم الكامل</div>
                  <div className="profile-field-value">{form.fullName || "—"}</div>
                </div>

                <div className="profile-field">
                  <div className="profile-field-label">الموقع</div>
                  <div className="profile-field-value">{form.city || "غير محدد"}</div>
                </div>

                <div className="profile-field">
                  <div className="profile-field-label">رقم الهاتف</div>
                  <div className="profile-field-value">{form.phone || "—"}</div>
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

              <button className="btn btn-outline profile-edit-btn" onClick={() => setIsEditing(true)}>
                تعديل البيانات
              </button>
            </>
          ) : (
            <div className="profile-edit-form">
              <label htmlFor="fullName">الاسم الكامل</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
              />

              <label htmlFor="city">الموقع</label>
              <select id="city" name="city" value={form.city} onChange={handleChange}>
                <option value="">اختر المدينة</option>
                <option value="غزة">غزة</option>
                <option value="خانيونس">خانيونس</option>
                <option value="شمال غزة">شمال غزة</option>
                <option value="الوسطى">الوسطى</option>
                <option value="رفح">رفح</option>
              </select>

              <label htmlFor="phone">رقم الهاتف</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
              />

              {error && <p className="form-error">{error}</p>}

              <div className="profile-edit-actions">
                <button className="btn btn-outline" onClick={handleCancel}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleSave}>حفظ التغييرات</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}