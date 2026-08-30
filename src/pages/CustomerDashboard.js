import { useState, useRef } from "react";
import { Link } from "react-router-dom";

export default function CustomerDashboard() {
  // بيانات المستخدمة المخزّنة محليًا بعد تسجيل الدخول (نفس الفكرة المستخدمة في MediatorDashboard.js)
  // ملاحظة: بنجرب أكثر من اسم حقل محتمل (full_name / name / fullName) لأن التسمية الدقيقة
  // بتعتمد على شكل الرد القادم من الـ API — لو الاسم لسه مش ظاهر صح، لازم نتأكد من اسم الحقل الحقيقي
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName =
    storedUser.full_name || storedUser.name || storedUser.fullName || "زبونة";
  const userFirstName = userName.split(" ")[0];
  const userInitial = userName.charAt(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ name: "", city: "", commission: "" });

  const suggestedScrollRef = useRef(null);
  const scrollSuggested = () => {
    if (suggestedScrollRef.current) {
      suggestedScrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  // خطوات تتبع الطلب الحالي — كل خطوة عندها حالة: done (اكتملت) أو current (الحالية) أو upcoming (لسه)
  const orderSteps = [
    { label: "تم الطلب", status: "done" },
    { label: "تم الطلب من SHEIN", status: "done" },
    { label: "تم الفحص", status: "done" },
    { label: "تم الشحن", status: "current" },
    { label: "وصلت", status: "upcoming" },
    { label: "تم الاستلام", status: "upcoming" },
  ];

  // بيانات تجريبية لوسيطات مقترحة — لاحقًا هذه بتيجي من الـ API بدل ما تكون ثابتة هون
  const suggestedMediators = [
    {
      id: 1,
      name: "متجر ريم الدولي",
      city: "الخليل",
      tag: "متاحة",
      rating: 4.5,
      reviews: 971,
      duration: "15-22 يوم",
      commission: "12%",
    },
    {
      id: 2,
      name: "وسيطة نور للطلبات",
      city: "نابلس",
      tag: "مشغولة",
      rating: 4.9,
      reviews: 302,
      duration: "14-20 يوم",
      commission: "9%",
    },
    {
      id: 3,
      name: "متجر لين SHEIN",
      city: "رام الله",
      tag: "متاحة",
      rating: 4.6,
      reviews: 189,
      duration: "12-18 يوم",
      commission: "10%",
    },
    {
      id: 4,
      name: "متجر سارة لطلبات SHEIN",
      city: "غزة",
      tag: "متاحة",
      rating: 4.8,
      reviews: 214,
      duration: "10-14 يوم",
      commission: "8%",
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: ربط البحث الفعلي بالـ API لاحقًا
    console.log("بحث عن:", searchTerm);
  };

  return (
    <div className="dashboard-layout">
      {/* ===== الشريط الجانبي (Sidebar) ===== */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.PNG" alt="وساطة" className="logo-img" />
          وساطة
        </div>

        <nav className="sidebar-nav">
          <Link to="/customer-dashboard" className="sidebar-link active">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <Link to="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span> الرئيسية
          </Link>
          <Link to="/my-orders" className="sidebar-link">
            <span className="sidebar-icon">📋</span> طلباتي
          </Link>
          <Link to="/explore-mediators" className="sidebar-link">
            <span className="sidebar-icon">🔍</span> استكشاف الوسيطات
          </Link>
          <Link to="/profile" className="sidebar-link">
            <span className="sidebar-icon">👤</span> الملف الشخصي
          </Link>
        </nav>
      </aside>

      {/* ===== المحتوى الرئيسي ===== */}
      <main className="dashboard-main">
        {/* شريط علوي صغير: جرس الإشعارات + بيانات المستخدمة — نفس التسميات المستخدمة في لوحة الوسيطة */}
        <div className="dashboard-topbar">
          <div className="topbar-actions">
            <button className="notif-btn">🔔</button>
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-store">زبونة</div>
            </div>
            <div className="user-avatar">{userInitial}</div>
          </div>
        </div>

        {/* رسالة الترحيب */}
        <div className="dashboard-welcome">
          <h1>مرحبًا، {userFirstName} 👋</h1>
          <p>اختاري الوسيطة المناسبة وابدئي طلبك بسهولة.</p>
        </div>

        {/* شريط البحث — الحقل أولاً (يظهر يمين) وبعده زري التصفية والبحث (يظهروا يسار) */}
        <form className="dashboard-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="ابحثي عن وسيطة بالاسم أو الموقع"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            بحث
          </button>
          <button
            type="button"
            className="filter-btn"
            onClick={() => setShowFilters((v) => !v)}
          >
            ⚙ تصفية
          </button>
        </form>

        {/* لوحة التصفية — بتظهر/بتختفي بالضغط على زر تصفية */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-field">
              <label>اسم الوسيطة</label>
              <input
                type="text"
                placeholder="ابحثي بالاسم"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            <div className="filter-field">
              <label>الموقع</label>
              <input
                type="text"
                placeholder="المدينة"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>
            <div className="filter-field">
              <label>نسبة العمولة</label>
              <select
                value={filters.commission}
                onChange={(e) =>
                  setFilters({ ...filters, commission: e.target.value })
                }
              >
                <option value="">الكل</option>
                <option value="low">أقل من 10%</option>
                <option value="mid">10% - 15%</option>
                <option value="high">أكثر من 15%</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary filter-apply-btn">
              تطبيق
            </button>
          </div>
        )}

        {/* قسم: ابدئي طلبك بثلاث خطوات — تم نقله ليكون تحت شريط البحث مباشرة */}
        <section className="dashboard-steps">
          <h2>ابدئي طلبك بثلاث خطوات</h2>
          <div className="steps">
            <div className="step-card">
              <div className="step-icon">👤</div>
              <h3>١. اختاري الوسيطة</h3>
              <p>تصفحي الوسيطات وقارني العمولة والتقييمات.</p>
            </div>
            <div className="step-card">
              <div className="step-icon">📦</div>
              <h3>٢. أضيفي طلبك</h3>
              <p>أرسلي رابط المنتج من SHEIN وحدّدي التفاصيل.</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🚚</div>
              <h3>٣. تابعي الحالة</h3>
              <p>تلقّي تحديثات مباشرة حتى يصل طلبك.</p>
            </div>
          </div>
        </section>

        {/* الطلب الحالي وتتبعه */}
        <section className="order-card">
          <div className="order-card-top">
            <div>
              <span className="order-status-badge">تم الشحن</span>
              <div className="order-id">طلب #1042</div>
              <div className="order-store">متجر سارة لطلبات SHEIN</div>
            </div>
            <div>
              <div className="order-date-label">تاريخ الطلب</div>
              <div className="order-date-value">20 أغسطس 2026</div>
            </div>
          </div>

          <div className="order-actions">
            <Link to="#" className="btn btn-outline">
              📄 عرض التفاصيل
            </Link>
          </div>

          <div className="order-timeline">
            {orderSteps.map((step, index) => (
              <div key={index} className={`timeline-step ${step.status}`}>
                <div className="timeline-line"></div>
                <div className="timeline-dot">
                  {step.status === "done" ? "✓" : index + 1}
                </div>
                <div className="timeline-label">{step.label}</div>
              </div>
            ))}
          </div>

          <div className="order-updated">آخر تحديث منذ 3 ساعات</div>
        </section>

        {/* وسيطات مقترحة */}
        <section className="suggested-section">
          <div className="suggested-header">
            <h2>وسيطات مقترحة لك</h2>
            <button
              type="button"
              className="scroll-arrow-btn"
              onClick={scrollSuggested}
              aria-label="عرض المزيد من الوسيطات"
            >
              ‹
            </button>
          </div>

          <div className="suggested-grid" ref={suggestedScrollRef}>
            {suggestedMediators.map((m) => (
              <div className="mediator-card" key={m.id}>
                <div className="mediator-card-top">
                  <span className="mediator-tag">{m.tag}</span>
                  <div className="mediator-avatar">
                    {m.name.charAt(0)}
                  </div>
                </div>
                <div className="mediator-name">{m.name}</div>
                <div className="mediator-loc">📍 {m.city}</div>
                <div className="mediator-rating">
                  ⭐ {m.rating} ({m.reviews} تقييم)
                </div>
                <div className="mediator-meta">
                  <span>⏱ {m.duration}</span>
                  <span>عمولة {m.commission}</span>
                </div>
                <Link to="#" className="btn btn-primary">
                  عرض الملف
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}