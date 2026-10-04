import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getOrders,
  getOrderStats,
  getOrderDetails,
  acceptOrder,
  rejectOrder,
  getMyStore,
  BASE_URL,
} from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import { formatProductsCount, applyStatusUpdate } from "../utils/orders";

// رابط صورة المتجر يجي أحيانًا من الباك اند كمسار نسبي (بدون دومين) —
// هاي الدالة بتتأكد إنه رابط كامل قبل ما نعرضه، وإلا بترجع null
function resolveImageUrl(path) {
  if (!path) return null;
  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (!clean.includes("/")) {
    return `${BASE_URL}/storage/${clean}`;
  }
  return `${BASE_URL}/${clean}`;
}

// طلب "ملغي" فعليًا (ألغته الزبونة مثلاً) أو "مرفوض" من الوسيطة — كلاهما
// بيندرجوا تحت نفس تبويب/عدّاد "ملغاة"، وما إلهم تفاصيل ولا تحديث حالة
function isClosedNegative(status) {
  return status === "cancelled" || status === "rejected";
}

const STATUS_META = {
  pending: { label: "تم الطلب", className: "pending" },
  awaiting_approval: { label: "بانتظار موافقة الزبونة", className: "pending" },
  ordered_from_shein: { label: "تم الطلب من SHEIN", className: "ordered" },
  shipped: { label: "تم الشحن", className: "shipped" },
  arrived: { label: "وصلت", className: "progress" },
  inspected: { label: "تم الفحص", className: "ready" },
  received: { label: "تم الاستلام", className: "done" },
  cancelled: { label: "ملغي", className: "rejected" },
  rejected: { label: "مرفوض", className: "rejected" },
};

const PAGE_SIZE = 6;

export default function MediatorOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

  // ===== قبول الطلب مع تحديد السعر النهائي لكل منتج =====
  const [acceptOrderData, setAcceptOrderData] = useState(null);
  const [acceptPrices, setAcceptPrices] = useState({});
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);
  const [acceptModalError, setAcceptModalError] = useState("");

  // نافذة سبب الرفض: بنفتحها لما الوسيطة تضغط "رفض"، والسبب اختياري
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    getMyStore()
      .then((data) => {
        const store = data.store || data;
        setImagePreview(resolveImageUrl(store.image_url || store.image));
      })
      .catch(() => {});
  }, []);

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

  // فتح نافذة تحديد السعر النهائي — منجيب تفاصيل الطلب كاملة (بمنتجاتها)
  // لأنه جدول الطلبات نفسه ما بالضرورة يجيب قائمة منتجات كاملة لكل طلب
  const openAcceptModal = async (orderId) => {
    setActionError("");
    setAcceptModalError("");
    setAcceptOrderData(null);
    setAcceptLoading(true);
    try {
      const full = await getOrderDetails(orderId);
      const initialPrices = {};
      (full.items || []).forEach((item) => {
        initialPrices[item.id] = "";
      });
      setAcceptPrices(initialPrices);
      setAcceptOrderData(full);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAcceptLoading(false);
    }
  };

  const closeAcceptModal = () => {
    setAcceptOrderData(null);
    setAcceptPrices({});
    setAcceptModalError("");
  };

  const handlePriceChange = (itemId, value) => {
    setAcceptPrices((prev) => ({ ...prev, [itemId]: value }));
  };

  const confirmAccept = async () => {
    if (!acceptOrderData) return;
    const items = acceptOrderData.items || [];
    const hasInvalidPrice = items.some((item) => {
      const value = acceptPrices[item.id];
      return (
        value === "" ||
        value === undefined ||
        isNaN(Number(value)) ||
        Number(value) < 0
      );
    });
    if (hasInvalidPrice) {
      setAcceptModalError(
        "لازم تحددي سعر نهائي صحيح لكل منتج بالطلب قبل التأكيد",
      );
      return;
    }

    setAcceptSubmitting(true);
    setAcceptModalError("");
    try {
      const payload = items.map((item) => ({
        id: item.id,
        unit_price: Number(acceptPrices[item.id]),
      }));
      const updated = await acceptOrder(acceptOrderData.id, payload);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updated.id ? applyStatusUpdate(o, updated) : o,
        ),
      );
      closeAcceptModal();
    } catch (err) {
      setAcceptModalError(err.message);
    } finally {
      setAcceptSubmitting(false);
    }
  };

  // الضغطة على "رفض" بس بتفتح النافذة، الرفض الفعلي بصير بـ confirmReject
  const openRejectModal = (orderId) => {
    setActionError("");
    setRejectReason("");
    setRejectTargetId(orderId);
  };

  const closeRejectModal = () => {
    setRejectTargetId(null);
    setRejectReason("");
  };

  const confirmReject = async () => {
    const orderId = rejectTargetId;
    if (orderId === null) return;
    setActionError("");
    setActionOrderId(orderId);
    try {
      // السبب اختياري: لو فاضي الباك اند بيخزّن null
      const updated = await rejectOrder(orderId, rejectReason);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? applyStatusUpdate(o, updated) : o)),
      );
      closeRejectModal();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionOrderId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: orders.length };
    Object.keys(STATUS_META).forEach((key) => {
      c[key] =
        key === "cancelled"
          ? orders.filter((o) => isClosedNegative(o.status)).length
          : orders.filter((o) => o.status === key).length;
    });
    return c;
  }, [orders]);

  const hasActiveFilters =
    dateFilter || statusFilter || search || activeTab !== "all";

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== "all") {
        if (
          activeTab === "cancelled"
            ? !isClosedNegative(o.status)
            : o.status !== activeTab
        ) {
          return false;
        }
      }
      if (statusFilter && o.status !== statusFilter) return false;
      if (dateFilter && o.date !== dateFilter) return false;
      if (search && !`${o.id} ${o.customer}`.includes(search)) return false;
      return true;
    });
  }, [orders, activeTab, statusFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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
    { key: "awaiting_approval", label: "بانتظار الموافقة" },
    { key: "ordered_from_shein", label: "تم الطلب من SHEIN" },
    { key: "shipped", label: "تم الشحن" },
    { key: "arrived", label: "وصلت" },
    { key: "inspected", label: "تم الفحص" },
    { key: "received", label: "تم الاستلام" },
    { key: "cancelled", label: "ملغاة" },
  ];

  return (
    <DashboardLayout
      role="broker"
      ordersBadge={stats && stats.newCount}
      notifBadge={stats && stats.newCount}
      notifLink="/mediator-notifications"
      avatarImage={imagePreview}
    >
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
            <span className="status-tab-count">{counts[tab.key] || 0}</span>{" "}
            {tab.label}
          </button>
        ))}
      </div>

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
                    <th>المبلغ </th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{formatDateTime(order.date)}</td>
                      <td>{formatProductsCount(order)}</td>
                      <td>
                        {order.totalPrice != null
                          ? `${order.totalPrice} ₪`
                          : `${order.amount} ₪`}
                      </td>{" "}
                      <td>
                        <span
                          className={`status-badge ${STATUS_META[order.status]?.className || ""}`}
                        >
                          {STATUS_META[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td>
                        {isClosedNegative(order.status) ? (
                          // الطلب المرفوض/الملغي خلص، ما إلو تفاصيل نعرضها ولا حالة نحدثها
                          <span className="no-action">—</span>
                        ) : (
                          <Link
                            to={`/mediator-orders/${order.id}`}
                            className="details-link"
                          >
                            عرض التفاصيل
                          </Link>
                        )}
                        {order.status === "pending" && (
                          <span className="row-actions">
                            <button
                              className="text-action-btn accept"
                              onClick={() => openAcceptModal(order.id)}
                              disabled={acceptLoading}
                            >
                              قبول
                            </button>
                            <button
                              className="text-action-btn reject"
                              onClick={() => openRejectModal(order.id)}
                              disabled={actionOrderId === order.id}
                            >
                              رفض
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

      {/* ===== نافذة تحديد السعر النهائي لكل منتج قبل تأكيد القبول ===== */}
      {acceptOrderData && (
        <div className="modal-overlay" onClick={closeAcceptModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>تسعير الطلب #{acceptOrderData.id}</span>
              <button className="modal-close-btn" onClick={closeAcceptModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="service-description">
                حددي السعر النهائي لكل منتج، وبيوصل للزبونة لتوافق عليه قبل ما
                يبدأ التنفيذ.
              </p>

              {(acceptOrderData.items || []).length === 0 ? (
                <p className="service-description">
                  لا توجد منتجات بهذا الطلب.
                </p>
              ) : (
                acceptOrderData.items.map((item) => (
                  <div className="order-item-row" key={item.id}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="order-item-image"
                      />
                    )}
                    <div className="order-item-info">
                      <div className="order-item-name">{item.name}</div>
                      {item.quantity && (
                        <span className="service-fee-tag">
                          الكمية: {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="accept-price-field">
                      <label
                        className="accept-price-label"
                        htmlFor={`price-${item.id}`}
                      >
                        السعر (₪)
                      </label>
                      <input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="accept-price-input"
                        value={acceptPrices[item.id] ?? ""}
                        onChange={(e) =>
                          handlePriceChange(item.id, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))
              )}

              {acceptModalError && (
                <p className="form-error">{acceptModalError}</p>
              )}

              <div className="modal-actions confirm-actions">
                <button
                  className="btn btn-outline"
                  onClick={closeAcceptModal}
                  disabled={acceptSubmitting}
                >
                  إلغاء
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmAccept}
                  disabled={acceptSubmitting}
                >
                  {acceptSubmitting ? "جاري الإرسال..." : "إرسال السعر للزبونة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== نافذة سبب الرفض (اختياري) ===== */}
      {rejectTargetId !== null && (
        <div className="modal-overlay" onClick={closeRejectModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>رفض الطلب #{rejectTargetId}</span>
              <button className="modal-close-btn" onClick={closeRejectModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="service-description">
                تقدري تكتبي سبب الرفض وبيوصل للزبونة (اختياري).
              </p>
              <textarea
                className="accept-price-input"
                style={{ width: "100%", minHeight: "90px" }}
                placeholder="مثال: المنتج غير متوفر حاليًا"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              {actionError && <p className="form-error">{actionError}</p>}
              <div className="modal-actions confirm-actions">
                <button
                  className="btn btn-outline"
                  onClick={closeRejectModal}
                  disabled={actionOrderId === rejectTargetId}
                >
                  رجوع
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmReject}
                  disabled={actionOrderId === rejectTargetId}
                >
                  {actionOrderId === rejectTargetId
                    ? "جاري الرفض..."
                    : "تأكيد الرفض"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {acceptLoading && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-body">
              <p>جاري تحميل تفاصيل الطلب...</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
