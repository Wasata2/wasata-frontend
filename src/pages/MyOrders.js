import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, cancelOrder } from "../api";
import DashboardLayout from "../components/DashboardLayout";

// خطوات مسار الطلب — نفس الحالات الحقيقية السبع من الباك اند (عدا "ملغى")
const STATUS_STEPS = [
  { key: "pending", label: "تم الطلب" },
  { key: "ordered_from_shein", label: "تم الطلب من SHEIN" },
  { key: "shipped", label: "تم الشحن" },
  { key: "arrived", label: "وصلت" },
  { key: "inspected", label: "تم الفحص" },
  { key: "received", label: "تم الاستلام" },
];

const STATUS_LABELS = {
  pending: "تم الطلب",
  ordered_from_shein: "تم الطلب من SHEIN",
  shipped: "تم الشحن",
  arrived: "وصلت",
  inspected: "تم الفحص",
  received: "تم الاستلام",
  cancelled: "ملغي",
};

// تحويل وقت مخزّن (تاريخ من الباك اند) لنص "منذ كذا"
function getRelativeTime(dateString) {
  if (!dateString) return "";
  const diffSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSeconds < 60) return "الآن";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadOrders = () => {
    setLoading(true);
    setLoadError("");
    getMyOrders()
      .then(setOrders)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const statusOptionsByTab = {
    active: STATUS_STEPS.map((s) => s.label),
    completed: ["تم الاستلام"],
    cancelled: ["ملغي"],
  };

  const tabLabels = {
    active: "النشطة",
    completed: "المكتملة",
    cancelled: "الملغاة",
  };

  const [activeTab, setActiveTab] = useState("active");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReasonId, setExpandedReasonId] = useState(null);

  // حالة عملية الإلغاء (لتعطيل الزر وقت الطلب + عرض الأخطاء)
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

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
      if (statusFilter && STATUS_LABELS[o.status] !== statusFilter) return false;
      if (
        searchTerm &&
        !(
          String(o.id).includes(searchTerm.trim()) ||
          (o.store || "").includes(searchTerm.trim())
        )
      ) {
        return false;
      }
      return true;
    });
  }, [orders, activeTab, statusFilter, searchTerm]);

  const handleCancel = async (orderId) => {
    setCancelError("");
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      // بعد الإلغاء، نحدّث القائمة من جديد عشان الطلب ينتقل لتبويب "الملغاة" مباشرة
      loadOrders();
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

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

        {loadError && (
          <div className="orders-empty-state">
            <p>تعذر تحميل الطلبات: {loadError}</p>
          </div>
        )}

        {cancelError && <p className="form-error">{cancelError}</p>}

        {/* بطاقات الإحصائيات */}
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
              <div className="orders-stat-label">ملغاة</div>
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
            {cancelledCount} الملغاة
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
        {loading ? (
          <div className="orders-empty-state">
            <p>جاري تحميل طلباتك...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
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
          filteredOrders.map((order) => {
            const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

            return (
              <div className="order-list-card" key={order.id}>
                <div className="order-list-top">
                  <div className="order-list-info-col">
                    <div className="order-list-badge-row">
                      <span className={`order-list-status-badge status-${order.type}`}>
                        ● {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="order-id">طلب #{order.id}</div>
                    <div className="order-store">🕐 {order.store}</div>
                    <div className="order-list-info">
                      📦 {order.itemsCount} منتجات &nbsp; 🗓{" "}
                      {order.date ? new Date(order.date).toLocaleDateString("ar-EG") : ""}
                    </div>
                  </div>
                  <div className="order-list-price">
                    {order.price != null ? `${order.price} ₪` : "السعر قيد التحديد"}
                  </div>
                </div>

                <div className="order-list-divider"></div>

                {order.type === "active" && (
                  <>
                    <div className="order-path-label">مسار الطلب</div>
                    <div className="order-timeline">
                      {STATUS_STEPS.map((step, index) => {
                        const status =
                          index < currentStepIndex
                            ? "done"
                            : index === currentStepIndex
                              ? "current"
                              : "upcoming";
                        return (
                          <div key={step.key} className={`timeline-step ${status}`}>
                            <div className="timeline-line"></div>
                            <div className="timeline-dot">
                              {status === "done" ? "✓" : index + 1}
                            </div>
                            <div className="timeline-label">{step.label}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="order-updated">
                      آخر تحديث: {getRelativeTime(order.statusUpdatedAt)}
                    </div>
                    <div className="order-actions">
                      <Link to="#" className="btn btn-outline">
                        عرض التفاصيل
                      </Link>
                      {/* زر الإلغاء يظهر بس لو الطلب لسا بحالة "تم الطلب" (pending) —
                          بعدها الوسيطة تصير ملتزمة فعليًا، فما يجوز الإلغاء */}
                      {order.status === "pending" && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ color: "#dc2626", borderColor: "#dc2626" }}
                          onClick={() => handleCancel(order.id)}
                          disabled={cancellingId === order.id}
                        >
                          {cancellingId === order.id ? "جاري الإلغاء..." : "إلغاء الطلب"}
                        </button>
                      )}
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
                      <Link to="#" className="btn btn-primary">
                        ★ تقييم الوسيطة
                      </Link>
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
                          عرض سبب الإلغاء {expandedReasonId === order.id ? "˄" : "˅"}
                        </button>
                        {expandedReasonId === order.id && (
                          <div className="order-reject-banner">{order.rejectionReason}</div>
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
            );
          })
        )}
    </DashboardLayout>
  );
}