import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";


// تحويل وقت مخزّن (timestamp) لنص "منذ كذا" — بيتحسب وقت العرض، مش وقت الإنشاء
function getRelativeTime(timestamp) {
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSeconds < 60) return "الآن";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}


export default function MyOrders() {

  // بيانات وهمية مؤقتة — بما إننا لسه بمرحلة التأسيس ومفيش طلبات حقيقية بعد،
  // حطينا طلب وهمي واحد بس بحالة "نشطة" حتى تبين الصفحة شكلها وهي شغالة.
  // لاحقًا هاد المصفوفة بتتجاب من الـ API بدل ما تكون ثابتة هون.
  const [orders] = useState([
    ...(JSON.parse(localStorage.getItem("wasata_new_orders")) || []),
  ]);

  // خطوات مسار الطلب — بنفس الترتيب المتفق عليه بلوحة التحكم
  const timelineSteps = [
    "تم الطلب",
    "تم الطلب من SHEIN",
    "تم الشحن",
    "وصلت",
    "تم الفحص",
    "تم الاستلام",
  ];

  const statusOptionsByTab = {
    active: timelineSteps,
    completed: ["مكتمل"],
    cancelled: ["ملغي", "مرفوض"],
  };

  const tabLabels = {
    active: "النشطة",
    completed: "المكتملة",
    cancelled: "الملغاة / المرفوضة",
  };

  const [activeTab, setActiveTab] = useState("active");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReasonId, setExpandedReasonId] = useState(null);

  const activeCount = orders.filter((o) => o.type === "active").length;
  const completedCount = orders.filter((o) => o.type === "completed").length;
  const cancelledCount = orders.filter((o) => o.type === "cancelled").length;

  const hasActiveFilters = dateFilter || statusFilter || searchTerm;

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("");
    setSearchTerm("");
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    clearFilters();
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.type !== activeTab) return false;
      if (
        statusFilter &&
        (activeTab === "active" ? o.statusLabel : o.statusLabel) !== statusFilter
      ) {
        return false;
      }
      if (
        searchTerm &&
        !(
          o.id.includes(searchTerm.trim()) ||
          o.store.includes(searchTerm.trim())
        )
      ) {
        return false;
      }
      // فلتر التاريخ شكلي حاليًا (بيانات وهمية) — هيتفعّل فعليًا لما توصل الطلبات من الـ API
      return true;
    });
  }, [orders, activeTab, statusFilter, searchTerm]);

   return (
    <DashboardLayout role="customer">
        <div className="dashboard-welcome-row">
          <div className="dashboard-welcome">
            <h1>طلباتي</h1>
            <p>تابعي طلباتك الحالية وراجعي سجل طلباتك السابقة.</p>
          </div>
          <Link to="/new-order" className="new-order-btn">
            + طلب جديد
          </Link>
        </div>

        {/* بطاقات الإحصائيات — ثابتة للعرض فقط، النشطة يمين والملغاة/المرفوضة يسار */}
        <div className="orders-stats-grid">
          <div className="orders-stat-card">
            <div>
              <div className="orders-stat-value">{activeCount}</div>
              <div className="orders-stat-label">طلبات نشطة</div>
            </div>
            <div className="orders-stat-icon icon-purple">📅</div>
          </div>

          <div className="orders-stat-card">
            <div>
              <div className="orders-stat-value">{completedCount}</div>
              <div className="orders-stat-label">طلبات مكتملة</div>
            </div>
            <div className="orders-stat-icon icon-green">✓</div>
          </div>

          <div className="orders-stat-card">
            <div>
              <div className="orders-stat-value">{cancelledCount}</div>
              <div className="orders-stat-label">ملغاة / مرفوضة</div>
            </div>
            <div className="orders-stat-icon icon-red">✕</div>
          </div>
        </div>

        {/* تبويبات الحالة */}
        <div className="orders-tabs">
          <button
            type="button"
            className={`orders-tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => switchTab("active")}
          >
            {activeCount} النشطة
          </button>
          <button
            type="button"
            className={`orders-tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => switchTab("completed")}
          >
            {completedCount} المكتملة
          </button>
          <button
            type="button"
            className={`orders-tab ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => switchTab("cancelled")}
          >
            {cancelledCount} الملغاة / المرفوضة
          </button>
        </div>

        {/* شريط الفلاتر */}
        <div className="orders-filters">
          <input
            type="text"
            placeholder="ابحثي برقم الطلب أو اسم الوسيطة"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">الحالة</option>
            {statusOptionsByTab[activeTab].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="">التاريخ</option>
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يومًا</option>
            <option value="all">كل الفترات</option>
          </select>
          {hasActiveFilters && (
            <button type="button" className="clear-filters-chip" onClick={clearFilters}>
              مسح الفلاتر ✕
            </button>
          )}
        </div>

        {/* قائمة الطلبات */}
        {filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            {hasActiveFilters ? (
              <>
                <p>لا توجد طلبات مطابقة</p>
                <span>حاولي تعديل معايير البحث</span>
              </>
            ) : (
              <p>لا توجد طلبات {tabLabels[activeTab]} حاليًا.</p>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div className="order-list-card" key={order.id}>
              <div className="order-list-top">
                <div className="order-list-info-col">
                  <div className="order-list-badge-row">
                    <span
                      className={`order-list-status-badge status-${order.type}`}
                    >
                      ● {order.statusLabel}
                    </span>
                  </div>
                  <div className="order-id">طلب #{order.id}</div>
                  <div className="order-store">🕐 {order.store}</div>
                  <div className="order-list-info">
                    📦 {order.itemsCount} منتجات &nbsp; 🗓 {order.date}
                  </div>
                </div>
                <div className="order-list-price">{order.price} ₪</div>
              </div>

              <div className="order-list-divider"></div>

              {order.type === "active" && (
                <>
                  <div className="order-path-label">مسار الطلب</div>
                  <div className="order-timeline">
                    {timelineSteps.map((label, index) => {
                      const status =
                        index < order.currentStepIndex
                          ? "done"
                          : index === order.currentStepIndex
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
                  <div className="order-updated">
                    آخر تحديث: {order.updatedAt ? getRelativeTime(order.updatedAt) : order.updatedAgo}
                  </div>
                  <div className="order-actions">
                    <Link to="#" className="btn btn-outline">
                      عرض التفاصيل
                    </Link>
                  </div>
                </>
              )}

              {order.type === "completed" && (
                <>
                  <div className="order-success-banner">✓ تم تسليم هذا الطلب بنجاح</div>
                  <div className="order-actions">
                    <Link to="#" className="btn btn-outline">
                      عرض التفاصيل
                    </Link>
                    {!order.rated && (
                      <Link to="#" className="btn btn-primary">
                        ★ تقييم الوسيطة
                      </Link>
                    )}
                  </div>
                </>
              )}

              {order.type === "cancelled" && (
                <>
                  {order.rejectionReason && (
                    <>
                      <button
                        type="button"
                        className="reject-reason-toggle"
                        onClick={() =>
                          setExpandedReasonId(
                            expandedReasonId === order.id ? null : order.id
                          )
                        }
                      >
                        عرض سبب الرفض{" "}
                        {expandedReasonId === order.id ? "˄" : "˅"}
                      </button>
                      {expandedReasonId === order.id && (
                        <div className="order-reject-banner">
                          {order.rejectionReason}
                        </div>
                      )}
                    </>
                  )}
                  <div className="order-actions">
                    <Link to="#" className="btn btn-outline">
                      عرض التفاصيل
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))
        )}
          </DashboardLayout>
  );
}