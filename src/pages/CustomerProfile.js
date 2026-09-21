import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile, getOrderStats, logoutUser, BASE_URL } from "../api";

// رابط صورة الحساب يجي أحيانًا من الباك اند كمسار نسبي (بدون دومين) —
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

// صفحة الملف الشخصي للزبونة — نفس تصميم صفحة الملف الشخصي للوسيطة
// (بدون زر "معاينة الملف كما يظهر للزبائن" لأنه ما إلها داعي هون، وبدون
// نسبة عمولة لأنها خاصة بمتجر الوسيطة مش بحساب الزبونة)
export default function CustomerProfile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};

  const [form, setForm] = useState({
    fullName: storedUser.full_name || storedUser.name || storedUser.fullName || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    city: storedUser.city || "",
  });

  const userInitial = (form.fullName || "ز").charAt(0);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    resolveImageUrl(storedUser.image_url || storedUser.image)
  );

  // بنستخدمه لمنع تعارض: لو المستخدمة رفعت صورة جديدة بنفس اللحظة يلي في فيها
  // نداء تاني عم يجيب بيانات المستخدمة، ما نخلي نتيجته القديمة تمسح الصورة الجديدة
  const imageJustUpdatedRef = useRef(false);

  // ===== تعديل بيانات الحساب =====
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState(form);
  const [accountError, setAccountError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const openAccountEdit = () => {
    setAccountForm({ ...form });
    setAccountError("");
    setEditingAccount(true);
  };

  const cancelAccountEdit = () => {
    setEditingAccount(false);
    setAccountError("");
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAccountEdit = async () => {
    if (!accountForm.fullName || !accountForm.phone) {
      setAccountError("يرجى تعبئة الحقول الإلزامية.");
      return;
    }
    setAccountError("");
    setSavingAccount(true);

    try {
      const result = await updateProfile({
        full_name: accountForm.fullName,
        phone: accountForm.phone,
        city: accountForm.city,
      });

      const updatedUser = result.user || {};
      setForm((prev) => ({
        ...prev,
        fullName: accountForm.fullName,
        phone: accountForm.phone,
        city: updatedUser.city || accountForm.city,
      }));
      setEditingAccount(false);
      showToast("تم تحديث بيانات الحساب بنجاح ✓");
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setSavingAccount(false);
    }
  };

  // نفس منطق رفع صورة الوسيطة بالضبط: معاينة فورية محليًا + رفع فوري للباك اند
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previousPreview = imagePreview;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    try {
      const result = await updateProfile({ image: file });
      const updatedUser = result.user || {};
      imageJustUpdatedRef.current = true;

      const serverImage = resolveImageUrl(updatedUser.image_url || updatedUser.image);
      if (serverImage) {
        setImagePreview(serverImage);
      }
      setImageFile(null);
      showToast("تم تحديث الصورة بنجاح ✓");
    } catch (err) {
      setImagePreview(previousPreview);
      setImageFile(null);
      showToast(err.message || "تعذر رفع الصورة");
    }
  };

  // ===== ملخص الطلبات — من نفس endpoint إحصائيات الطلبات المستخدم بلوحة الوسيطة =====
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getOrderStats()
      .then((data) => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  }, []);

  // الباك اند بيرجع new / in_progress / completed / total — ما في حقل مخصص لعدد
  // الطلبات "الملغى / المرفوض"، فمنحسبه من الباقي (المجموع ناقص باقي الحالات)
  const activeCount = stats ? stats.newCount + stats.inProgressCount : 0;
  const completedCount = stats ? stats.completedCount : 0;
  const cancelledCount = stats
    ? Math.max(0, stats.total - stats.newCount - stats.inProgressCount - stats.completedCount)
    : 0;

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* ===== الشريط الجانبي ===== */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span> الرئيسية
          </Link>
          <Link to="/customer-dashboard" className="sidebar-link">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <Link to="/my-orders" className="sidebar-link">
            <span className="sidebar-icon">📋</span> طلباتي
          </Link>
          <Link to="/explore-mediators" className="sidebar-link">
            <span className="sidebar-icon">🔍</span> استكشاف الوسيطات
          </Link>
          <Link to="/profile" className="sidebar-link active">
            <span className="sidebar-icon">👤</span> الملف الشخصي
          </Link>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="topbar-actions">
            <button className="notif-btn">🔔</button>
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{form.fullName || "زبونة"}</div>
              <div className="user-store">زبونة</div>
            </div>
            <div
              className="user-avatar"
              style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : "none" }}
            >
              {!imagePreview && userInitial}
            </div>
          </div>
        </div>

        <div className="dashboard-welcome profile-title-centered">
          <h1>الملف الشخصي</h1>
          <p>راجعي بياناتك الشخصية وتابعي ملخص طلباتك.</p>
        </div>

        {/* ===== بطاقة الصورة والبيانات الأساسية — بدون زر معاينة ===== */}
        <div className="profile-hero-card">
          <div className="profile-hero-banner"></div>
          <div className="profile-hero-body">
            <div className="profile-hero-avatar-wrap">
              <label
                htmlFor="profileImage"
                className="profile-hero-avatar"
                style={{
                  cursor: "pointer",
                  backgroundImage: imagePreview ? `url(${imagePreview})` : "none",
                }}
              >
                {!imagePreview && userInitial}
                <span className="photo-edit-overlay">📷</span>
              </label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="profile-hero-info">
              <div className="profile-hero-name-row">
                <h2>{form.fullName || "—"}</h2>
              </div>
              <div className="profile-hero-facts">
                <span className="profile-hero-fact-row">🏷️ زبونة</span>
                <span className="profile-hero-fact-row">📍 {form.city || "غير محدد"}</span>
                {form.phone && <span className="profile-hero-fact-row">📞 {form.phone}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ===== بيانات الحساب ===== */}
        <div className="account-data-card">
          <div className="section-header-row">
            <h3>بيانات الحساب</h3>
            {!editingAccount && (
              <button className="btn btn-primary btn-sm" onClick={openAccountEdit}>
                ✎ تعديل بيانات الحساب
              </button>
            )}
          </div>

          {!editingAccount ? (
            <div className="account-data-rows">
              <div className="account-data-row">
                <span className="account-data-label">الاسم الكامل</span>
                <span className="account-data-value">{form.fullName || "—"}</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">البريد الإلكتروني</span>
                <span className="account-data-value">{form.email || "—"}</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">رقم الهاتف</span>
                <span className="account-data-value">{form.phone || "—"}</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">المنطقة</span>
                <span className="account-data-value">{form.city || "غير محدد"}</span>
              </div>
            </div>
          ) : (
            <div className="profile-edit-form">
              <div className="profile-edit-avatar-row">
                <div
                  className="profile-hero-avatar sm"
                  style={{
                    backgroundImage: imagePreview ? `url(${imagePreview})` : "none",
                  }}
                >
                  {!imagePreview && userInitial}
                </div>
                <label htmlFor="profileImageEdit" className="btn btn-outline btn-sm">
                  📷 تغيير الصورة
                </label>
                <input
                  id="profileImageEdit"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>

              <label htmlFor="fullName">الاسم الكامل</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={accountForm.fullName}
                onChange={handleAccountChange}
              />

              <label htmlFor="email">البريد الإلكتروني</label>
              <input id="email" name="email" type="email" value={accountForm.email} disabled />

              <label htmlFor="phone">رقم الهاتف</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={accountForm.phone}
                onChange={handleAccountChange}
              />

              <label htmlFor="city">المنطقة</label>
              <select id="city" name="city" value={accountForm.city} onChange={handleAccountChange}>
                <option value="">اختر المدينة</option>
                <option value="غزة">غزة</option>
                <option value="خانيونس">خانيونس</option>
                <option value="شمال غزة">شمال غزة</option>
                <option value="الوسطى">الوسطى</option>
                <option value="رفح">رفح</option>
              </select>

              {accountError && <p className="form-error">{accountError}</p>}

              <div className="profile-edit-actions">
                <button className="btn btn-outline" onClick={cancelAccountEdit} disabled={savingAccount}>
                  إلغاء
                </button>
                <button className="btn btn-primary" onClick={saveAccountEdit} disabled={savingAccount}>
                  {savingAccount ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== ملخص طلباتي ===== */}
        <div className="account-data-card">
          <div className="section-header-row">
            <h3>🛍 ملخص طلباتي</h3>
            <Link to="/my-orders" className="edit-link-btn">
              ‹ عرض طلباتي
            </Link>
          </div>

          {loadingStats ? (
            <p className="service-description">جاري التحميل...</p>
          ) : (
            <div className="order-summary-grid">
              <div className="order-summary-box cancelled">
                <div className="order-summary-number">{cancelledCount}</div>
                <div className="order-summary-label">ملغى / مرفوض</div>
              </div>
              <div className="order-summary-box completed">
                <div className="order-summary-number">{completedCount}</div>
                <div className="order-summary-label">طلبات مكتملة</div>
              </div>
              <div className="order-summary-box active">
                <div className="order-summary-number">{activeCount}</div>
                <div className="order-summary-label">طلب نشط</div>
              </div>
            </div>
          )}
        </div>

        {/* ===== تسجيل الخروج ===== */}
        <button type="button" className="btn-logout" onClick={handleLogout}>
          ← تسجيل الخروج
          <span className="btn-logout-sub">مغادرة الجلسة الحالية بأمان</span>
        </button>

        {toast && <div className="toast-notification">{toast}</div>}
      </main>
    </div>
  );
}