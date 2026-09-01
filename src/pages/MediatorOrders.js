import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// وصف كل حالة طلب: النص الظاهر وصنف الـ CSS الخاص فيها (status-badge.<className>)
const STATUS_META = {
  new: { label: "جديد", className: "new" },
  in_progress: { label: "قيد التنفيذ", className: "progress" },
  ordered_shein: { label: "تم الطلب من SHEIN", className: "ordered" },
  shipped: { label: "تم الشحن", className: "shipped" },
  ready: { label: "جاهزة للاستلام", className: "ready" },
  done: { label: "مكتمل", className: "done" },
  rejected: { label: "مرفوضة", className: "rejected" },
};

const PAGE_SIZE = 6;

export default function MediatorOrders() {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

  // TODO: نجيب الطلبات الحقيقية من الباك اند لما يصير عندنا endpoint لهيك (متل getMyStore بصفحة MediatorProfile)
  // لهلق القائمة فاضية وبتتعبى تلقائيًا أول ما توصل طلبات فعلية من الزبونات
  const [orders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // عدد الطلبات لكل حالة، لعرضه جوا تبويبات الفلترة
  const counts = useMemo(() => {
    const c = { all: orders.length };
    Object.keys(STATUS_META).forEach((key) => {
      c[key] = orders.filter((o) => o.status === key).length;
    });
    return c;
  }, [orders]);

  // إحصائيات البطاقات العلوية — "قيد التنفيذ" هون بتجمع كل الحالات يلي الطلب لسا فيها بالطريق
  const summary = useMemo(
    () => ({
      done: counts.done || 0,
      inProgress:
        (counts.in_progress || 0) + (counts.ordered_shein || 0) + (counts.shipped || 0),
      new: counts.new || 0,
      total: orders.length,
    }),
    [counts, orders.length],
  );

  const hasActiveFilters = dateFilter || statusFilter || search || activeTab !== "all";

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== "all" && o.status !== activeTab) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (dateFilter && o.date !== dateFilter) return false;
      if (search && !`${o.id} ${o.customer}`.includes(search)) return false;
      return true;
    });
  }, [orders, activeTab, statusFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setActiveTab("all");
    setDateFilter("");
    setStatusFilter("");
    setSearch("");
    setPage(1);
  };

  const tabs = [
    { key: "rejected", label: "مرفوضة" },
    { key: "done", label: "مكتملة" },
    { key: "ready", label: "جاهزة للاستلام" },
    { key: "shipped", label: "تم الشحن" },
    { key: "ordered_shein", label: "تم الطلب من SHEIN" },
    { key: "in_progress", label: "قيد التنفيذ" },
    { key: "new", label: "جديدة" },
    { key: "all", label: "الكل" },
  ];

  return (
    <div className="dashboard-layout">
      {/* ===== نفس القائمة الجانبية الموجودة بـ MediatorDashboard بالضبط ===== */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.PNG" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span> الرئيسية
          </Link>
          <Link to="/mediator-dashboard" className="sidebar-link">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <Link to="/mediator-orders" className="sidebar-link active">
            <span className="sidebar-icon">📋</span> الطلبات
          </Link>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">🛍</span> الخدمات
          </a>
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

        <div className="dashboard-welcome">
          <h1>الطلبات</h1>
          <p>إدارة ومتابعة جميع طلبات الزبائن.</p>
        </div>

        {/* بطاقات الإحصائيات */}
      <div className="dashboard-stats cols-4">
          <div className="stat-card">
            <div>
              <div className="stat-label">مكتملة</div>
              <div className="stat-value">{summary.done}</div>
            </div>
            <div className="stat-icon">✅</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">قيد التنفيذ</div>
              <div className="stat-value">{summary.inProgress}</div>
            </div>
            <div className="stat-icon">📈</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">طلبات جديدة</div>
              <div className="stat-value">{summary.new}</div>
            </div>
            <div className="stat-icon">📦</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">إجمالي الطلبات</div>
              <div className="stat-value">{summary.total}</div>
            </div>
            <div className="stat-icon">🧾</div>
          </div>
        </div>

        {/* شريط الفلاتر: تاريخ + حالة + بحث */}
        <div className="orders-filters-bar">
          <input
            type="text"
            className="filter-search-input"
            placeholder="ابحثي برقم الطلب أو اسم الزبونة"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              مسح الفلاتر ✕
            </button>
          )}
          <input
            type="date"
            className="filter-date-input"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="filter-status-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">الحالة</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          
        </div>

        {/* تبويبات فلترة سريعة حسب الحالة */}
        <div className="status-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`status-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              <span className="status-tab-count">{counts[tab.key] || 0}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* جدول الطلبات */}
        <div className="dashboard-orders">
          {pagedOrders.length === 0 ? (
            <div className="empty-orders">
              <p>لا توجد طلبات مطابقة.</p>
            </div>
          ) : (
            <>
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>اسم الزبونة</th>
                      <th>التاريخ</th>
                      <th>عدد المنتجات</th>
                      <th>المبلغ التقديري</th>
                      <th>الحالة</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}#</td>
                        <td>{order.customer}</td>
                        <td>{order.date}</td>
                        <td>{order.items}</td>
                        <td>{order.amount} ر.س</td>
                        <td>
                          <span className={`status-badge ${STATUS_META[order.status].className}`}>
                            {STATUS_META[order.status].label}
                          </span>
                        </td>
                        <td>
                          <a href="#" className="details-link">
                            عرض التفاصيل
                          </a>
                          {order.status === "new" && (
                            <span className="row-actions">
                              <button className="icon-btn accept">✓</button>
                              <button className="icon-btn reject">✕</button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="orders-pagination">
                <button
                  className="page-arrow"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹
                </button>
                <span className="page-number">{page}</span>
                <button
                  className="page-arrow"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ›
                </button>
                <span className="pagination-summary">
                  عرض {pagedOrders.length} من {filteredOrders.length} طلب
                </span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}