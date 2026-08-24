import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createStore } from "../api";

export default function CreateStore() {
  const [form, setForm] = useState({
    storeName: "",
    bio: "",
    city: "",
    phone: "",
    whatsappEnabled: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.storeName || !form.phone || !form.city) {
      setError("يرجى تعبئة جميع الحقول الإلزامية.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await createStore({
        name: form.storeName,
        bio: form.bio,
        phone: `+970${form.phone}`,
        city: form.city,
        accepts_whatsapp_orders: form.whatsappEnabled,
        image: imageFile,
      });
      console.log("نجح إنشاء المتجر:", result);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <header className="account-header">
        <div className="container">
          <div className="logo">
            <img src="/logo.PNG" alt="وساطة" className="logo-img" />
            وساطة
          </div>
          <Link to="/signup-mediator" className="back-link">
            العودة →
          </Link>
        </div>
      </header>

      <section className="store-section">
        <div className="container">
          <div className="store-header">
            <h1>إنشاء متجرك</h1>
            <p>أضيفي المعلومات الأساسية ليظهر متجرك للزبائن.</p>
            <div className="store-steps">
              <span className="step active">١. معلومات المتجر</span>
              <span className="step-arrow">←</span>
              <span className="step">٢. جاهز للنشر</span>
            </div>
          </div>

          <div className="store-card">
            <form onSubmit={handleSubmit}>
              <div className="store-photo-upload">
                <label
                  htmlFor="storeImage"
                  className="store-photo-circle"
                  style={{
                    cursor: 'pointer',
                    backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!imagePreview && '📷'}
                </label>
                <input
                  id="storeImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div className="store-photo-label">صورة المتجر</div>
                <div className="store-photo-sub">(اختياري، أقصى حجم 4MB)</div>
              </div>

              <h3 className="store-section-title">معلومات المتجر</h3>
              <hr className="store-divider" />

              <label htmlFor="storeName">اسم المتجر</label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                placeholder="مثال: متجر سارة لطلبات SHEIN"
                value={form.storeName}
                onChange={handleChange}
              />

              <label htmlFor="bio">نبذة قصيرة</label>
              <textarea
                id="bio"
                name="bio"
                placeholder="اكتبي نبذة بسيطة عن خدمتك وطريقة عملك"
                maxLength={150}
                value={form.bio}
                onChange={handleChange}
                rows={3}
              />
              <div className="char-count">{form.bio.length} / 150</div>

              <h3 className="store-section-title">بيانات التواصل</h3>
              <hr className="store-divider" />

              <div className="form-row">
                <div className="password-field">
                  <label htmlFor="city">المدينة / المنطقة</label>
                  <select
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                  >
                    <option value="">اختر المدينة</option>
                    <option value="غزة">غزة</option>
                    <option value="خانيونس">خانيونس</option>
                    <option value="شمال غزة">شمال غزة</option>
                    <option value="الوسطى">الوسطى</option>
                    <option value="رفح">رفح</option>
                  </select>
                </div>
                <div className="password-field">
                  <label htmlFor="phone">رقم الهاتف</label>
                  <div className="phone-input">
                    <span className="phone-prefix">+970</span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="59X XXX XXX"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="whatsapp-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    name="whatsappEnabled"
                    checked={form.whatsappEnabled}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
                <div>
                  <div className="toggle-label">
                    استقبال الطلبات والتواصل عبر واتساب
                  </div>
                  <div className="toggle-sub">لاستخدام نفس رقم الهاتف</div>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="store-actions">
                <button type="button" className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "جاري الإنشاء..." : "إنشاء المتجر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}