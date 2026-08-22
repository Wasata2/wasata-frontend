import { useState } from "react";
import { Link } from "react-router-dom";

export default function CreateStore() {
  const [form, setForm] = useState({
    storeName: "",
    bio: "",
    city: "",
    phone: "",
    whatsappEnabled: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Store data:", form);
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
                <div className="store-photo-circle">📷</div>
                <div className="store-photo-label">صورة المتجر</div>
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
                      <option value="gaza">غزة</option>
                      <option value="khan">خانيونس</option>
                      <option value="northgaza">شمال غزة</option>
                      <option value="wosta">الوسطى</option>
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

              <div className="store-actions">
                <button type="button" className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  إنشاء المتجر
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
