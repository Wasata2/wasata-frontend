import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getStores, getMyOrders } from "../api";
import { MediatorCard } from "./ExploreMediators";
import { formatDateTime } from "../utils/dates";


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
  const userCity = (user?.location || user?.city || "").trim();
  const [searchTerm, setSearchTerm] = useState("");

  const suggestedScrollRef = useRef(null);
  const scrollSuggested = (direction) => {
  if (suggestedScrollRef.current) {
    // الصفحة RTL: القيمة السالبة = لجهة اليسار (الوسيطات الباقية)
    suggestedScrollRef.current.scrollBy({
      left: direction * -260,
      behavior: "smooth",
    });
  }
};

  const [pendingOrder, setPendingOrder] = useState(null);
useEffect(() => {
  getMyOrders()
    .then(({ orders }) => {
      // بنعرض بس الطلبات الجديدة: "تم الطلب" أو "بانتظار موافقتك على السعر"
      const fresh = orders.filter(
        (o) => o.rawStatus === "pending" || o.rawStatus === "awaiting_approval",
      );
      // الأحدث أولًا
fresh.sort(
  (a, b) =>
    Number(b.awaitingApproval) - Number(a.awaitingApproval) ||
    new Date(b.date) - new Date(a.date),
);      setPendingOrder(fresh[0] || null);
    })
    .catch(() => {});
}, []);

  // كل الوسيطات — منها بنطلّع المقترحات ونتائج البحث
  const [allMediators, setAllMediators] = useState([]);
  const [loadingMediators, setLoadingMediators] = useState(true);
  useEffect(() => {
    getStores()
      .then((list) => setAllMediators(list))
      .catch(() => {})
      .finally(() => setLoadingMediators(false));
  }, []);

  // ===== البحث: باسم الوسيطة أو بنسبة العمولة (مثال: 5 أو 5%) =====
  const query = searchTerm.trim().toLowerCase().replace("%", "").trim();
  const isNumberQuery = query !== "" && !isNaN(Number(query));
  const searchResults = query
    ? allMediators.filter((m) => {
        const nameMatch = (m.name || "").toLowerCase().includes(query);
        const commissionMatch =
          isNumberQuery && parseFloat(m.commission) === Number(query);
        return nameMatch || commissionMatch;
      })
    : [];

  // ===== المقترحات: وسيطات نفس منطقة الزبونة (6 كحد أقصى) =====
  // ===== المقترحات: وسيطات نفس مدينة الزبونة (6 كحد أقصى) =====
  const sameCityMediators = userCity
    ? allMediators.filter((m) => (m.city || "").trim() === userCity)
    : [];
  const hasCityMatch = sameCityMediators.length > 0;
  const suggestedMediators = (
    hasCityMatch ? sameCityMediators : allMediators
  ).slice(0, 6);

  const renderCard = (m) => (
    <MediatorCard
      key={m.id}
      mediator={m}
      onSelect={() => navigate("/new-order", { state: { mediatorId: m.id } })}
      onViewProfile={() => navigate(`/mediators/${m.id}`)}
    />
  );

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-welcome">
        <h1>مرحبًا، {userFirstName} 👋</h1>
        <p>اختاري الوسيطة المناسبة وابدئي طلبك بسهولة.</p>
      </div>

      {/* شريط البحث — بيفلتر مباشرة وأنتِ بتكتبي */}
      <div className="dashboard-search">
        <input
          type="text"
          placeholder="ابحثي باسم الوسيطة أو نسبة العمولة (مثال: 5)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* نتائج البحث */}
      {query && (
        <section className="explore-section">
          <div className="explore-section-header">
            <h2>نتائج البحث</h2>
            <span className="explore-section-count">
              {searchResults.length} وسيطة
            </span>
          </div>
          {loadingMediators ? (
            <p className="explore-loading">جاري التحميل...</p>
          ) : searchResults.length === 0 ? (
            <div className="explore-empty-state">
              <div className="empty-icon">🔍</div>
              <h3>ما لقينا وسيطة مطابقة</h3>
              <p>جربي اسم تاني أو نسبة عمولة مختلفة.</p>
            </div>
          ) : (
            <div className="explore-grid">{searchResults.map(renderCard)}</div>
          )}
        </section>
      )}

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

      {pendingOrder && (
        <section className="order-card">
          <div className="order-card-top">
            <div>
              <span className="order-status-badge">
                {pendingOrder.statusLabel}
              </span>
              <div className="order-id">طلب #{pendingOrder.id}</div>
              <div className="order-store">{pendingOrder.store}</div>
            </div>
            <div>
              <div className="order-date-label">تاريخ الطلب</div>
<div className="order-date-value">{formatDateTime(pendingOrder.date)}</div>            </div>
          </div>

         <div className="order-actions">
  <Link
    to={`/orders/${pendingOrder.id}`}
    className={`btn ${pendingOrder.awaitingApproval ? "btn-primary" : "btn-outline"}`}
  >
    {pendingOrder.awaitingApproval ? "🔔 مراجعة السعر والرد" : "📄 عرض التفاصيل"}
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
                  <div className="timeline-dot">
                    {status === "done" ? "✓" : index + 1}
                  </div>
                  <div className="timeline-label">{label}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* وسيطات مقترحة حسب منطقة الزبونة */}
      <section className="suggested-section">
        <div className="suggested-header">
          <h2>
            {hasCityMatch ? "وسيطات مقترحة حسب مدينتك" : "وسيطات مقترحة لك"}
          </h2>
          <div className="scroll-arrows">
            <button
              type="button"
              className="scroll-arrow-btn"
              onClick={() => scrollSuggested(-1)}
              aria-label="رجوع"
            >
              ‹
            </button>
            <button
              type="button"
              className="scroll-arrow-btn"
              onClick={() => scrollSuggested(1)}
              aria-label="عرض المزيد من الوسيطات"
            >
              ›
            </button>
          </div>
        </div>

        {loadingMediators ? (
          <p className="explore-loading">جاري تحميل الوسيطات...</p>
        ) : suggestedMediators.length === 0 ? (
          <p className="explore-loading">لا توجد وسيطات حاليًا.</p>
        ) : (
          <div className="suggested-grid" ref={suggestedScrollRef}>
            {suggestedMediators.map(renderCard)}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
