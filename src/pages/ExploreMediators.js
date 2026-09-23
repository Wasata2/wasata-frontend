import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getStores } from "../api";

const CITIES = ["غزة", "خانيونس", "شمال غزة", "الوسطى", "رفح"];

const SORT_OPTIONS = [
  { value: "popular", label: "الأكثر انتشارًا" },
  { value: "newest", label: "الأحدث" },
];

// بطاقة وسيطة واحدة — نفس تصميم البطاقة المتفق عليه:
// من غير شارة "الأكثر طلبًا" ومن غير تقييم النجوم وسنوات الخبرة،
// وبدل سطر التخصص بنعرض نبذة عني الحقيقية يلي كتبتها الوسيطة
function MediatorCard({ mediator, onSelect, onViewProfile }) {
  const initial = (mediator.name || "و").charAt(0);

  return (
    <div className="explore-card">
      <button className="explore-card-heart" type="button" aria-label="أضيفي للمفضلة">
        ♡
      </button>

      <div className="explore-card-avatar">
        {mediator.image ? (
          <img src={mediator.image} alt={mediator.name} />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      <div className="explore-card-name-row">
        <h3>{mediator.name}</h3>
        {mediator.verified && <span className="explore-card-verified">★ موثقة</span>}
      </div>

      <p className="explore-card-bio">
        {mediator.bio ? mediator.bio : "لم تتم إضافة نبذة تعريفية بعد"}
      </p>

      <div className="explore-card-status">
        <span className={`status-dot ${mediator.acceptingOrders ? "on" : "off"}`}></span>
        {mediator.acceptingOrders ? "متاحة الآن" : "غير متاحة حاليًا"}
      </div>

      <div className="explore-card-stats">
        {mediator.commission !== null && (
          <div className="explore-stat-box">
            <div className="explore-stat-value">{mediator.commission}%</div>
            <div className="explore-stat-label">عمولة</div>
          </div>
        )}
        <div className="explore-stat-box">
          <div className="explore-stat-value">+{mediator.completedOrders}</div>
          <div className="explore-stat-label">طلب مكتمل</div>
        </div>
      </div>

      <div className="explore-card-actions">
        <button type="button" className="btn btn-outline" onClick={() => onViewProfile(mediator)}>
          عرض الملف
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onSelect(mediator)}>
          اختيار الوسيطة
        </button>
      </div>
    </div>
  );
}

export default function ExploreMediators() {
  const navigate = useNavigate();

  const [mediators, setMediators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  const [toast, setToast] = useState("");
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const loadMediators = () => {
    setLoading(true);
    setError("");
    getStores()
      .then((list) => setMediators(list))
      .catch((err) => setError(err.message || "تعذر جلب قائمة الوسيطات"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMediators();
  }, []);

  // الوسيطات الأكثر انتشارًا (الأعلى طلبات مكتملة) — بيانات حقيقية من نفس القائمة
  const topMediators = useMemo(() => {
    return [...mediators]
      .sort((a, b) => b.completedOrders - a.completedOrders)
      .slice(0, 3);
  }, [mediators]);

  // جميع الوسيطات بعد تطبيق البحث/التصفية/الترتيب
  const filteredMediators = useMemo(() => {
    let list = [...mediators];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }

    if (cityFilter) {
      list = list.filter((m) => m.city === cityFilter);
    }

    if (sortBy === "popular") {
      list.sort((a, b) => b.completedOrders - a.completedOrders);
    } else if (sortBy === "newest") {
      list.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    return list;
  }, [mediators, search, cityFilter, sortBy]);

  const handleSelect = (mediator) => {
    // منوجّه لصفحة إنشاء الطلب — ربط اختيار الوسيطة تلقائيًا جوا NewOrder
    // لسه بده تعديل منفصل هناك (حاليًا بيعتمد على قائمة وسيطات تجريبية محليًا)
    navigate("/new-order");
  };

  const handleViewProfile = () => {
    showToast("صفحة الملف الشخصي العامة للوسيطة قيد التطوير قريبًا");
  };

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-welcome">
        <h1>استكشفي الوسيطة المناسبة لك</h1>
        <p>ابحثي وقارني بين الوسيطات واختاري الأنسب لطلبك.</p>
      </div>

      <form className="dashboard-search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="ابحثي باسم الوسيطة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="filter-btn"
          onClick={() => setShowFilters((v) => !v)}
        >
          ⚙ تصفية
        </button>
        <select
          className="explore-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </form>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-field">
            <label>المدينة</label>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">كل المدن</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          {cityFilter && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={() => setCityFilter("")}
            >
              مسح التصفية
            </button>
          )}
        </div>
      )}

      {toast && <div className="toast-notification">{toast}</div>}

      {loading && <p className="explore-loading">جاري تحميل الوسيطات...</p>}

      {!loading && error && (
        <div className="explore-empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>تعذر تحميل الوسيطات</h3>
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={loadMediators}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && mediators.length === 0 && (
        <div className="explore-empty-state">
          <div className="empty-icon">🔍</div>
          <h3>لا توجد وسيطات متاحة حاليًا</h3>
          <p>راجعي هذه الصفحة لاحقًا.</p>
        </div>
      )}

      {!loading && !error && mediators.length > 0 && (
        <>
          {topMediators.length > 0 && (
            <section className="explore-section">
              <div className="explore-section-header">
                <h2>الوسيطات الأكثر انتشارًا</h2>
                <span className="explore-section-count">{topMediators.length} وسيطة مميزة</span>
              </div>
              <div className="explore-grid">
                {topMediators.map((m) => (
                  <MediatorCard
                    key={m.id}
                    mediator={m}
                    onSelect={handleSelect}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="explore-section">
            <div className="explore-section-header">
              <h2>جميع الوسيطات</h2>
              <span className="explore-section-count">{filteredMediators.length} وسيطة</span>
            </div>

            {filteredMediators.length === 0 ? (
              <div className="explore-empty-state">
                <div className="empty-icon">🔍</div>
                <h3>ما في وسيطات مطابقة</h3>
                <p>جربي كلمة بحث تانية أو غيّري التصفية.</p>
              </div>
            ) : (
              <div className="explore-grid">
                {filteredMediators.map((m) => (
                  <MediatorCard
                    key={m.id}
                    mediator={m}
                    onSelect={handleSelect}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}