import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyStore, updateProfile, updateStore, getServices, getReviews } from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

function StarRating({ rating, size }) {
  return (
    <span className={`star-rating ${size || ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function MediatorProfile() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: "",
    bio: "",
    commission: "",
  });

  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [loadingStore, setLoadingStore] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ===== تعديل بيانات الحساب (الاسم / الهاتف / المنطقة) =====
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState(form);
  const [accountError, setAccountError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  // ===== تعديل المعلومات العامة (نبذة / نسبة العمولة / استقبال الطلبات) =====
  const [generalModalOpen, setGeneralModalOpen] = useState(false);
  const [generalForm, setGeneralForm] = useState({ bio: "", commission: "", acceptingOrders: true });
  const [generalError, setGeneralError] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const userInitial = (form.fullName || "م").charAt(0);

  // جلب بيانات متجر المستخدمة الحالية فعليًا من الباك اند (بدل الاعتماد على localStorage)
  useEffect(() => {
    getMyStore()
      .then((data) => {
        const store = data.store || data;
        setForm((prev) => ({
          ...prev,
          city: store.city || "",
          bio: store.bio || "",
          commission: store.commission_rate || "",
        }));
        // سويتش "استقبال الطلبات" — is_accepting_orders، منفصل عن استقبال طلبات واتساب
        setAcceptingOrders(!!store.is_accepting_orders);
        setImagePreview(store.image_url || store.image || null);
        setLoadingStore(false);
      })
      .catch((err) => {
        console.log("تعذر جلب بيانات المتجر:", err.message);
        setLoadingStore(false);
      });
  }, []);

  // ===== تقييمات الزبائن الحقيقية — متوسط التقييم وعددها جاهزين من الباك اند =====
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ total: 0, avg: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    getReviews()
      .then((data) => {
        setReviews(data.reviews);
        setRatingSummary({ total: data.totalReviews, avg: data.averageRating });
        setLoadingReviews(false);
      })
      .catch(() => {
        setLoadingReviews(false);
      });
  }, []);

  // ===== الخدمات المتاحة — نفس بيانات صفحة الخدمات الحقيقية =====
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data);
        setLoadingServices(false);
      })
      .catch(() => {
        setLoadingServices(false);
      });
  }, []);

  const availableServices = services.filter((s) => s.available);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // تبديل سريع لحالة استقبال الطلبات من الـ topbar — بيحفظ فورًا بالباك اند
  // (بدل ما يبقى تغيير محلي بس لحد ما تفتحي نافذة "تعديل المعلومات العامة")
  const handleQuickToggleAccepting = async (checked) => {
    const previous = acceptingOrders;
    setAcceptingOrders(checked); // تحديث فوري بالواجهة
    try {
      await updateStore({ is_accepting_orders: checked });
    } catch (err) {
      setAcceptingOrders(previous); // رجّعيها لو فشل الحفظ
      showToast(err.message);
    }
  };

  // ===== إجراءات تعديل بيانات الحساب =====
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
      // ١) تحديث بيانات المستخدمة نفسها (الاسم + الهاتف) — endpoint /api/auth/profile
      await updateProfile({
        full_name: accountForm.fullName,
        phone: accountForm.phone,
      });

      // ٢) تحديث بيانات المتجر (المدينة + الصورة الجديدة إذا انتخبت وحدة) — endpoint /api/stores/me
      const storeData = {};
      if (accountForm.city) storeData.city = accountForm.city;
      if (imageFile) storeData.image = imageFile;

      if (Object.keys(storeData).length > 0) {
        const storeResult = await updateStore(storeData);
        const updatedStore = storeResult.store || {};
        if (updatedStore.city) {
          accountForm.city = updatedStore.city;
        }
      }

      setForm((prev) => ({
        ...prev,
        fullName: accountForm.fullName,
        phone: accountForm.phone,
        city: accountForm.city,
      }));
      setImageFile(null);
      setEditingAccount(false);
      showToast("تم تحديث بيانات الحساب بنجاح ✓");
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setSavingAccount(false);
    }
  };

  // ===== إجراءات تعديل المعلومات العامة (نبذة / عمولة / استقبال طلبات) =====
  const openGeneralModal = () => {
    setGeneralForm({
      bio: form.bio,
      commission: form.commission,
      acceptingOrders,
    });
    setGeneralError("");
    setGeneralModalOpen(true);
  };

  const closeGeneralModal = () => setGeneralModalOpen(false);

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveGeneralInfo = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSavingGeneral(true);

    try {
      // نبذة عني + نسبة العمولة + سويتش استقبال الطلبات — الثلاثة صاروا مدعومين
      // فعليًا بالباك اند (bio, commission_rate, is_accepting_orders)
      await updateStore({
        bio: generalForm.bio,
        commission_rate: generalForm.commission,
        is_accepting_orders: generalForm.acceptingOrders,
      });

      setForm((prev) => ({
        ...prev,
        bio: generalForm.bio,
        commission: generalForm.commission,
      }));
      setAcceptingOrders(generalForm.acceptingOrders);
      setGeneralModalOpen(false);
      showToast("تم تحديث الملف الشخصي بنجاح ✓");
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setSavingGeneral(false);
    }
  };

  // ===== محتوى الهيدر المشترك (يظهر بالوضعين) =====
  const heroCard = (
    <div className="profile-hero-card">
      <div className="profile-hero-banner">
        {!previewMode && (
          <button
            type="button"
            className="profile-preview-link"
            onClick={() => setPreviewMode(true)}
          >
            👁 معاينة الملف كما يظهر للزبائن
          </button>
        )}
      </div>
      <div className="profile-hero-body">
        <div className="profile-hero-avatar-wrap">
          {!previewMode ? (
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
          ) : (
            <div
              className="profile-hero-avatar"
              style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : "none" }}
            >
              {!imagePreview && userInitial}
            </div>
          )}
          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <span className={`hero-availability-dot ${acceptingOrders ? "online" : "offline"}`} />
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name-row">
            <h2>{form.fullName || "—"}</h2>
            <span className="profile-role-badge">وسيطة</span>
          </div>
          <div className="profile-hero-rating">
            <span className="profile-hero-rating-number">
              {loadingReviews ? "…" : ratingSummary.avg || "0.0"}
            </span>
            <StarRating rating={ratingSummary.avg} />
            {!loadingReviews && (
              <span className="reviews-count-pill sm">{ratingSummary.total} تقييم</span>
            )}
            {form.commission && (
              <span className="commission-pill">{form.commission}% عمولة</span>
            )}
          </div>
          <div className="profile-hero-location">📍 {form.city || "غير محدد"}</div>
        </div>
      </div>
    </div>
  );

  // ===== وضع المعاينة كما تظهر للزبائن =====
  if (previewMode) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main">
          <div className="preview-topbar">
            <button
              type="button"
              className="back-link"
              onClick={() => setPreviewMode(false)}
            >
              ‹ عودة
            </button>
            <div className="sidebar-logo">
              <img src="/logo.svg" alt="وساطة" className="logo-img" />
              وساطة
            </div>
          </div>

          <div className="profile-preview-wrap">
            {heroCard}

            <div className="public-info-card">
              <h3 className="public-info-card-title">عن الوسيطة</h3>
              <p className="public-info-bio-text">
                {form.bio || "لم تتم إضافة نبذة بعد."}
              </p>
            </div>

            <div className="public-info-card">
              <h3 className="public-info-card-title">الخدمات المتاحة</h3>
              {loadingServices ? (
                <p className="service-description">جاري التحميل...</p>
              ) : availableServices.length === 0 ? (
                <p className="service-description">لا توجد خدمات متاحة حاليًا.</p>
              ) : (
                <div className="services-tags-row">
                  {availableServices.map((s) => (
                    <span className="service-tag" key={s.id}>
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="public-info-card">
              <h3 className="public-info-card-title">التقييمات</h3>
              <div className="rating-average standalone">
                <div className="rating-average-number">{ratingSummary.avg || "0.0"}</div>
                <StarRating rating={ratingSummary.avg} size="lg" />
              </div>

              {loadingReviews ? (
                <p className="service-description">جاري التحميل...</p>
              ) : reviews.length === 0 ? (
                <p className="service-description">لا توجد تقييمات بعد.</p>
              ) : (
                reviews.map((review) => (
                  <div className="review-card" key={review.id}>
                    <div className="review-card-top">
                      <div className="review-date">
                        {new Date(review.date).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="review-author">
                        <div className="review-author-info">
                          <div className="review-author-name">{review.customer}</div>
                          <StarRating rating={review.rating} />
                        </div>
                        <div className="review-avatar">{review.customer.charAt(0)}</div>
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="preview-bottom-bar">
            <Link to="#" className="btn btn-primary preview-cta">
              بدء طلب مع هذه الوسيطة
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ===== الوضع الافتراضي: لوحة تحكم الوسيطة =====
    const acceptToggle = (
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
  );

  // ===== الوضع الافتراضي: لوحة تحكم الوسيطة =====
  return (
    <DashboardLayout role="broker" topbarExtra={acceptToggle}>
        <div className="dashboard-welcome profile-title-centered">
          <h1>الملف الشخصي</h1>
          <p>أديري المعلومات التي تظهر للزبائن وتابعي أداء حسابك.</p>
        </div>
        {heroCard}

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
                <span className="account-data-value">
                  {loadingStore ? "جاري التحميل..." : form.city || "غير محدد"}
                </span>
              </div>
            </div>
          ) : (
            <div className="profile-edit-form">
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

        {/* ===== معلومات تظهر للزبائن ===== */}
        <div className="public-info-card">
          <div className="section-header-row">
            <h3>معلومات تظهر للزبائن</h3>
            <button className="btn btn-primary btn-sm" onClick={openGeneralModal}>
              تعديل المعلومات العامة
            </button>
          </div>

          <div className="public-info-bio">
            <div className="account-data-label">نبذة عني</div>
            <p className="public-info-bio-text">{form.bio || "لم تتم إضافة نبذة بعد."}</p>
          </div>

          <div className="public-info-stats">
            <div className="public-stat-box">
              <div className="public-stat-title">
                <span className={`status-dot ${acceptingOrders ? "on" : "off"}`}></span>
                {acceptingOrders ? "تستقبل طلبات" : "لا تستقبل طلبات"}
              </div>
              <div className="public-stat-sub">حالة استقبال الطلبات</div>
            </div>
            <div className="public-stat-box center">
              <div className="public-stat-value">
                {loadingStore ? "…" : form.commission ? `${form.commission}%` : "—"}
              </div>
              <div className="public-stat-sub">نسبة العمولة</div>
            </div>
          </div>
        </div>

        {/* ===== الخدمات المتاحة ===== */}
        <div className="public-info-card">
          <div className="section-header-row">
            <h3>الخدمات المتاحة</h3>
            <Link to="/mediator-services" className="edit-link-btn">
              ⚙ إدارة الخدمات
            </Link>
          </div>
          {loadingServices ? (
            <p className="service-description">جاري التحميل...</p>
          ) : availableServices.length === 0 ? (
            <p className="service-description">لا توجد خدمات متاحة حاليًا.</p>
          ) : (
            <div className="services-tags-row">
              {availableServices.map((s) => (
                <span className="service-tag" key={s.id}>
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ===== نافذة تعديل المعلومات العامة ===== */}
        {generalModalOpen && (
          <div className="modal-overlay" onClick={closeGeneralModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>تعديل المعلومات العامة</span>
                <button className="modal-close-btn" onClick={closeGeneralModal}>
                  ✕
                </button>
              </div>

              <form className="modal-body" onSubmit={saveGeneralInfo}>
                <label htmlFor="bio">نبذة عني</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={generalForm.bio}
                  onChange={handleGeneralChange}
                />

                <label htmlFor="commission">نسبة العمولة (%)</label>
                <input
                  id="commission"
                  name="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={generalForm.commission}
                  onChange={handleGeneralChange}
                />

                <div className="service-availability-row">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={generalForm.acceptingOrders}
                      onChange={(e) =>
                        setGeneralForm((prev) => ({ ...prev, acceptingOrders: e.target.checked }))
                      }
                    />
                    <span className="slider"></span>
                  </label>
                  <span>أستقبل طلبات حاليًا</span>
                </div>

                {generalError && <p className="form-error">{generalError}</p>}

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingGeneral}>
                    {savingGeneral ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeGeneralModal}
                    disabled={savingGeneral}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

               {toast && <div className="toast-notification">{toast}</div>}
    </DashboardLayout>
  );
}