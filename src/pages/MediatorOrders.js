import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrderStats, acceptOrder, rejectOrder } from "../api";

// وصف كل حالة طلب: النص الظاهر وصنف الـ CSS الخاص فيها (status-badge.<className>) —
// نفس الحالات الحقيقية السبعة القادمة من الباك اند (وليس new/in_progress/completed القديمة الوهمية)
const STATUS_META = {
  pending: { label: "تم الطلب", className: "pending" },
  ordered_from_shein: { label: "تم الطلب من SHEIN", className: "ordered" },
  shipped: { label: "تم الشحن", className: "shipped" },
  arrived: { label: "وصلت", className: "progress" },
  inspected: { label: "تم الفحص", className: "ready" },
  received: { label: "تم الاستلام", className: "done" },
  cancelled: { label: "ملغي", className: "rejected" },
};

const PAGE_SIZE = 6;

export default function MediatorOrders() {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadError, setLoadError] = useState("");

  // معرف الطلب يلي عم تنعمل عليه عملية قبول/رفض حاليًا (لتعطيل زرارها وقت الطلب فقط)
  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([getOrders(), getOrderStats()])
      .then(([ordersData, statsData]) => {
        setOrders(ordersData);
        setStats(statsData);
        setLoadingOrders(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setLoadingOrders(false);
      });
  }, []);

  const handleAccept = async (orderId) => {
    setActionError("");
    setActionOrderId(orderId);
    try {
      const updated = await acceptOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionOrderId(null);
    }
  };

  const handleReject = async (orderId) => {
    setActionError("");
    setActionOrderId(orderId);
    try {
      const updated = await rejectOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionOrderId(null);
    }
  };

  // عدد الطلبات لكل حالة، لعرضه جوا تبويبات الفلترة
  const counts = useMemo(() => {
    const c = { all: orders.length };
    Object.keys(STATUS_META).forEach((key) => {
      c[key] = orders.filter((o) => o.status === key).length;
    });
    return c;
  }, [orders]);

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
    { key: "all", label: "الكل" },
    { key: "pending", label: "تم الطلب" },
    { key: "ordered_from_shein", label: "تم الطلب من SHEIN" },
    { key: "shipped", label: "تم الشحن" },
    { key: "arrived", label: "وصلت" },
    { key: "inspected", label: "تم الفحص" },
    { key: "received", label: "تم الاستلام" },
    { key: "cancelled", label: "ملغاة" },
  ];

  return (
    <div className="dashboard-layout">
      {/* ===== نفس القائمة الجانبية الموجودة بباقي صفحات لوحة التحكم ===== */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
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
            {stats && stats.newCount > 0 && (
              <span className="sidebar-badge">{stats.newCount}</span>
            )}
          </Link>
          <Link to="/mediator-services" className="sidebar-link">
            <span className="sidebar-icon">🛍</span> الخدمات
          </Link>
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

        {loadError && (
          <div className="empty-orders">
            <p>تعذر تحميل الطلبات: {loadError}</p>
          </div>
        )}

        {actionError && <p className="form-error">{actionError}</p>}

        {/* بطاقات الإحصائيات */}
        {stats && (
          <div className="dashboard-stats cols-4">
            <div className="stat-card">
              <div>
                <div className="stat-label">مكتملة</div>
                <div className="stat-value">{stats.completedCount}</div>
              </div>
              <div className="stat-icon">✅</div>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">قيد التنفيذ</div>
                <div className="stat-value">{stats.inProgressCount}</div>
              </div>
              <div className="stat-icon">📈</div>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">طلبات جديدة</div>
                <div className="stat-value">{stats.newCount}</div>
              </div>
              <div className="stat-icon">📦</div>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">إجمالي الطلبات</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-icon">🧾</div>
            </div>
          </div>
        )}

        {/* شريط الفلاتر: تاريخ + حالة + بحث */}
        <div className="orders-filters-bar">
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
          {loadingOrders ? (
            <div className="empty-orders">
              <p>جاري تحميل الطلبات...</p>
            </div>
          ) : pagedOrders.length === 0 ? (
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
                        <td>#{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{order.date}</td>
                        <td>{order.itemsCount}</td>
                        <td>{order.amount} ر.س</td>
                        <td>
                          <span
                            className={`status-badge ${STATUS_META[order.status]?.className || ""}`}
                          >
                            {STATUS_META[order.status]?.label || order.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/mediator-orders/${order.id}`} className="details-link">
                            عرض التفاصيل
                          </Link>
                          {order.status === "pending" && (
                            <span className="row-actions">
                              <button
                                className="icon-btn accept"
                                onClick={() => handleAccept(order.id)}
                                disabled={actionOrderId === order.id}
                                title="قبول الطلب"
                              >
                                ✓
                              </button>
                              <button
                                className="icon-btn reject"
                                onClick={() => handleReject(order.id)}
                                disabled={actionOrderId === order.id}
                                title="رفض الطلب"
                              >
                                ✕
                              </button>
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