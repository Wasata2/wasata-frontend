import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getStores, getMyOrders } from "../api";

// خطوات مسار الطلب — نفس ترتيب صفحة "طلباتي"
const TIMELINE_STEPS = [
  "تم الطلب",
  "تم الطلب من SHEIN",
  "تم الشحن",
  "وصلت",
  "تم الفحص",
  "تم الاستلام",
];

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.full_name || user?.name || "زبونة";
  const userFirstName = userName.split(" ")[0];

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ name: "", city: "", commission: "" });

  const suggestedScrollRef = useRef(null);
  const scrollSuggested = () => {
    if (suggestedScrollRef.current) {
      suggestedScrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  // الطلب النشط الحالي: آخر طلب لسا ما انقبل ولا انرفض من الوسيطة (أول خطوة بمسار الطلب: "تم الطلب")
  const [pendingOrder, setPendingOrder] = useState(null);
  useEffect(() => {
    getMyOrders()
      .then(({ orders }) => {
        const pending = orders.find((o) => o.type === "active" && o.currentStepIndex === 0);
        setPendingOrder(pending || null);
      })
      .catch(() => {});
  }, []);

  // وسيطات مقترحة — نفس بيانات صفحة استكشاف الوسيطات الحقيقية، أول 4 بس
  const [suggestedMediators, setSuggestedMediators] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  useEffect(() => {
    getStores()
      .then((list) => setSuggestedMediators(list.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoadingSuggested(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: ربط البحث الفعلي بالـ API لاحقًا
    console.log("بحث عن:", searchTerm);
  };

  return (
    <DashboardLayout role="customer">

      {/* ===== المحتوى الرئيسي ===== */}


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

      {/* الطلب الحالي وتتبعه — بيظهر بس إذا في طلب لسا ما انقبل ولا انرفض */}
      {pendingOrder && (
        <section className="order-card">
          <div className="order-card-top">
            <div>
              <span className="order-status-badge">بانتظار رد الوسيطة</span>
              <div className="order-id">طلب #{pendingOrder.id}</div>
              <div className="order-store">{pendingOrder.store}</div>
            </div>
            <div>
              <div className="order-date-label">تاريخ الطلب</div>
              <div className="order-date-value">{pendingOrder.date}</div>
            </div>
          </div>

          <div className="order-actions">
            <Link to="/my-orders" className="btn btn-outline">
              📄 عرض التفاصيل
            </Link>
          </div>

          <div className="order-timeline">
            {TIMELINE_STEPS.map((label, index) => {
              const status =
                index < pendingOrder.currentStepIndex
                  ? "done"
                  : index === pendingOrder.currentStepIndex
                    ? "current"
                    : "upcoming";
              return (
                <div key={label} className={`timeline-step ${status}`}>
                  <div className="timeline-line"></div>
                  <div className="timeline-dot">{status === "done" ? "✓" : index + 1}</div>
                  <div className="timeline-label">{label}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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

        {loadingSuggested ? (
          <p className="explore-loading">جاري تحميل الوسيطات...</p>
        ) : suggestedMediators.length === 0 ? (
          <p className="explore-loading">لا توجد وسيطات حاليًا.</p>
        ) : (
          <div className="suggested-grid" ref={suggestedScrollRef}>
            {suggestedMediators.map((m) => (
              <div className="mediator-card" key={m.id}>
                <div className="mediator-card-top">
                  <span className={`mediator-tag ${m.acceptingOrders ? "" : "off"}`}>
                    {m.acceptingOrders ? "متاحة" : "غير متاحة"}
                  </span>
                  <div className="mediator-avatar">{(m.name || "و").charAt(0)}</div>
                </div>
                <div className="mediator-name">{m.name}</div>
                {m.city && <div className="mediator-loc">📍 {m.city}</div>}
                <div className="mediator-meta">
                  <span>{m.completedOrders} طلب مكتمل</span>
                  {m.commission !== null && m.commission !== "" && (
                    <span>عمولة {parseFloat(m.commission)}%</span>
                  )}
                </div>
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/mediators/${m.id}`)}>
                  عرض الملف
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}