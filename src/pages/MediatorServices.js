import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getServices, createService, updateService, toggleService } from "../api";

// أيقونات الخدمة المتاحة للاختيار من بينها
const ICONS = ["🔍", "💎", "✂️", "🎁", "📦", "💬", "🔄", "📍", "🚚", "🖼️"];

// أنواع الرسوم المتاحة
const FEE_TYPES = [
  { key: "case", label: "حسب الحالة" },
  { key: "percentage", label: "نسبة مئوية" },
  { key: "fixed", label: "مبلغ ثابت" },
  { key: "free", label: "مجاني" },
];

function feeLabel(service) {
  if (service.feeType === "free") return "مجاني";
  if (service.feeType === "case") return "حسب الحالة";
  if (service.feeType === "percentage") return `عمولة ${service.feeValue}%`;
  if (service.feeType === "fixed") return `ابتداء من ${service.feeValue} ₪`;
  return "";
}

const emptyForm = {
  icon: ICONS[0],
  name: "",
  description: "",
  feeType: "free",
  feeValue: "",
  notes: "",
  available: true,
};

export default function MediatorServices() {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data);
        setLoadingServices(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setLoadingServices(false);
      });
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null); // الخدمة يلي عم نأكد تفعيلها/تعطيلها
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    setForm({ ...service });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      setFormError("يرجى تعبئة اسم الخدمة ووصفها.");
      return;
    }
    if ((form.feeType === "percentage" || form.feeType === "fixed") && !form.feeValue) {
      setFormError("يرجى إدخال قيمة الرسوم.");
      return;
    }
    setFormError("");
    setSaving(true);

    try {
      if (editingId) {
        const updated = await updateService(editingId, form);
        setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        showToast("تم حفظ التغييرات بنجاح ✓");
      } else {
        const created = await createService(form);
        setServices((prev) => [...prev, created]);
        showToast("تمت إضافة الخدمة بنجاح ✓");
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleAvailability = async () => {
    if (!confirmToggle) return;
    const willEnable = !confirmToggle.available;
    try {
      const updated = await toggleService(confirmToggle.id);
      setServices((prev) => prev.map((s) => (s.id === confirmToggle.id ? updated : s)));
      showToast(willEnable ? "تم تفعيل الخدمة بنجاح ✓" : "تم تعطيل الخدمة بنجاح ✓");
    } catch (err) {
      showToast(err.message);
    } finally {
      setConfirmToggle(null);
    }
  };

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
          <Link to="/mediator-orders" className="sidebar-link">
            <span className="sidebar-icon">📋</span> الطلبات
          </Link>
          <Link to="/mediator-services" className="sidebar-link active">
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

        <div className="services-header-row">
          <div className="dashboard-welcome">
            <h1>الخدمات</h1>
            <p>خدماتي المتوفرة.</p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            + إضافة خدمة
          </button>
        </div>

        {loadingServices ? (
          <div className="empty-orders">
            <p>جاري تحميل الخدمات...</p>
          </div>
        ) : loadError ? (
          <div className="empty-orders">
            <p>تعذر تحميل الخدمات: {loadError}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="empty-orders">
            <p>ما في خدمات مضافة بعد. اضغطي "إضافة خدمة" لتبدئي.</p>
          </div>
        ) : (
          services.map((service) => (
            <div className="service-card" key={service.id}>
              <div className="service-icon-badge">{service.icon}</div>

              <div className="service-content">
                <div className="service-name">{service.name}</div>
                <div className="service-description">{service.description}</div>
                {service.notes && <div className="service-notes">📌 {service.notes}</div>}
              </div>

              <div className="service-meta-row">
                <span className="service-fee-tag">{feeLabel(service)}</span>
                <span
                  className={`service-status-tag ${service.available ? "available" : "unavailable"}`}
                >
                  {service.available ? "متاحة" : "غير متاحة"}
                </span>
                <button className="btn-edit-service" onClick={() => openEditModal(service)}>
                  ✎ تعديل
                </button>
                <button
                  className={service.available ? "btn-disable-service" : "btn-enable-service"}
                  onClick={() => setConfirmToggle(service)}
                >
                  {service.available ? "تعطيل" : "تفعيل"}
                </button>
              </div>
            </div>
          ))
        )}

        {/* ===== نافذة إضافة/تعديل خدمة ===== */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>{editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</span>
                <button className="modal-close-btn" onClick={closeModal}>
                  ✕
                </button>
              </div>

              <form className="modal-body" onSubmit={handleSave}>
                <label>أيقونة الخدمة</label>
                <div className="icon-picker-row">
                  {ICONS.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      className={`icon-picker-btn ${form.icon === icon ? "selected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                <label htmlFor="name">اسم الخدمة</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFormChange}
                />

                <label htmlFor="description">وصف الخدمة</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleFormChange}
                />

                <label>نوع الرسوم</label>
                <div className="fee-type-picker">
                  {FEE_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type.key}
                      className={`fee-type-option ${form.feeType === type.key ? "selected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, feeType: type.key }))}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {(form.feeType === "percentage" || form.feeType === "fixed") && (
                  <>
                    <label htmlFor="feeValue">
                      {form.feeType === "percentage" ? "نسبة العمولة (%)" : "المبلغ (₪)"}
                    </label>
                    <input
                      id="feeValue"
                      name="feeValue"
                      type="number"
                      min="0"
                      value={form.feeValue}
                      onChange={handleFormChange}
                    />
                  </>
                )}

                <label htmlFor="notes">ملاحظات أو شروط الخدمة (اختياري)</label>
                <input
                  id="notes"
                  name="notes"
                  type="text"
                  placeholder="مثال: خلال 1-2 يوم بعد وصول الطلب"
                  value={form.notes}
                  onChange={handleFormChange}
                />

                <div className="service-availability-row">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.available}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, available: e.target.checked }))
                      }
                    />
                    <span className="slider"></span>
                  </label>
                  <span>{form.available ? "متاحة" : "غير متاحة"}</span>
                </div>

                {formError && <p className="form-error">{formError}</p>}

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving
                      ? "جاري الحفظ..."
                      : editingId
                        ? "حفظ التغييرات"
                        : "إضافة الخدمة"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== نافذة تأكيد التفعيل/التعطيل ===== */}
        {confirmToggle && (
          <div className="modal-overlay" onClick={() => setConfirmToggle(null)}>
            <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div
                className={`confirm-icon-badge ${confirmToggle.available ? "danger" : "success"}`}
              >
                {confirmToggle.available ? "⏸️" : "▶️"}
              </div>
              <h3>{confirmToggle.available ? "تعطيل الخدمة" : "تفعيل الخدمة"}</h3>
              <p>
                هل تريدين {confirmToggle.available ? "تعطيل" : "تفعيل"} خدمة «
                {confirmToggle.name}»؟{" "}
                {confirmToggle.available
                  ? "لن تظهر للزبائن أثناء تعطيلها."
                  : "ستظهر للزبائن فور تفعيلها."}
              </p>
              <div className="confirm-modal-actions">
                <button
                  className={confirmToggle.available ? "btn-danger" : "btn-success"}
                  onClick={confirmToggleAvailability}
                >
                  {confirmToggle.available ? "تعطيل الخدمة" : "تفعيل الخدمة"}
                </button>
                <button className="btn btn-outline" onClick={() => setConfirmToggle(null)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== إشعار نجاح مؤقت ===== */}
        {toast && <div className="toast-notification">{toast}</div>}
      </main>
    </div>
  );
}