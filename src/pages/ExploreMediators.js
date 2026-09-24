import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getStores } from "../api";
import { useFavorites } from "../context/FavoritesContext";

const CITIES = ["غزة", "خانيونس", "شمال غزة", "الوسطى", "رفح"];

const SORT_OPTIONS = [
  { value: "popular", label: "الأكثر انتشارًا" },
  { value: "newest", label: "الأحدث" },
];

// بطاقة وسيطة واحدة — نفس تصميم البطاقة المتفق عليه:
// من غير شارة "الأكثر طلبًا" ومن غير تقييم النجوم وسنوات الخبرة،
// وبدل سطر التخصص بنعرض نبذة عني الحقيقية يلي كتبتها الوسيطة
// نسبة العمولة كنص جاهز للعرض: "4%" — أو "—" إذا الباك اند ما رجّعها
function formatCommission(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = parseFloat(value);
  return Number.isFinite(n) ? `${n}%` : "—";
}

export function MediatorCard({ mediator, onSelect, onViewProfile }) {
  const initial = (mediator.name || "و").charAt(0);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(mediator.id);

  return (
    <div className="explore-card">
      <button
        className={`explore-card-heart ${favorite ? "is-active" : ""}`}
        type="button"
        aria-label={favorite ? "إزالة من المفضلة" : "أضيفي للمفضلة"}
        aria-pressed={favorite}
        onClick={() => toggleFavorite(mediator.id)}
      >
        {favorite ? "♥" : "♡"}
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
        <div className="explore-stat-box">
          <div className="explore-stat-value">+{mediator.completedOrders}</div>
          <div className="explore-stat-label">طلب مكتمل</div>
        </div>
        <div className="explore-stat-box">
          <div className="explore-stat-value">{formatCommission(mediator.commission)}</div>
          <div className="explore-stat-label">عمولة</div>
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
      // بنبحث باسم المتجر وباسم الوسيطة نفسها
      list = list.filter((m) =>
        [m.name, m.ownerName].some((v) => v && v.toLowerCase().includes(q))
      );
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
    // منوجّه لصفحة إنشاء الطلب ومعنا الوسيطة المختارة، فما بتنعرض مرحلة اختيار الوسيطة
    navigate("/new-order", { state: { mediatorId: mediator.id } });
  };

  // عرض الملف: بنفتح الملف العام للوسيطة (نفس شكل "معاينة الملف كما يظهر للزبائن")
  const handleViewProfile = (mediator) => {
    navigate(`/mediators/${mediator.id}`);
  };

  // إذا في بحث أو تصفية بالمدينة، بنعرض النتائج فوق مباشرة
  const isSearching = search.trim() !== "" || cityFilter !== "";

  const renderResults = (title) => (
    <section className="explore-section">
      <div className="explore-section-header">
        <h2>{title}</h2>
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
  );

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
          {/* نتائج البحث بتظهر فوق مباشرة، والوسيطات الأكثر انتشارًا بتضل ثابتة تحتها */}
          {isSearching && renderResults("نتائج البحث")}

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

          {!isSearching && renderResults("جميع الوسيطات")}
        </>
      )}
    </DashboardLayout>
  );
}