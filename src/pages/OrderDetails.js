import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderDetails, updateOrderStatus } from "../api";
import DashboardLayout from "../components/DashboardLayout";

// خطوات مسار الطلب — بنفس ترتيب وأسماء الحالات الحقيقية القادمة من الباك اند
// (pending, ordered_from_shein, shipped, arrived, inspected, received)
const STATUS_STEPS = [
  { key: "pending", label: "تم الطلب" },
  { key: "ordered_from_shein", label: "تم الطلب من SHEIN" },
  { key: "shipped", label: "تم الشحن" },
  { key: "arrived", label: "وصلت" },
  { key: "inspected", label: "تم الفحص" },
  { key: "received", label: "تم الاستلام" },
];

const STATUS_META = {
  pending: { label: "تم الطلب", className: "pending" },
  ordered_from_shein: { label: "تم الطلب من SHEIN", className: "ordered" },
  shipped: { label: "تم الشحن", className: "shipped" },
  arrived: { label: "وصلت", className: "progress" },
  inspected: { label: "تم الفحص", className: "ready" },
  received: { label: "تم الاستلام", className: "done" },
  cancelled: { label: "ملغي", className: "rejected" },
};

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return `${date} — ${time}`;
}

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===== تحديث حالة الطلب =====
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    getOrderDetails(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order && order.status === "cancelled";
  const isFinalStep = currentStepIndex === STATUS_STEPS.length - 1;
  const nextStep =
    !isCancelled && currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length - 1
      ? STATUS_STEPS[currentStepIndex + 1]
      : null;

  const openUpdateModal = () => {
    setUpdateError("");
    setUpdateModalOpen(true);
  };

  const goToConfirm = () => {
    setUpdateModalOpen(false);
    setConfirmModalOpen(true);
  };

  const cancelConfirm = () => {
    setConfirmModalOpen(false);
  };

  const confirmUpdate = async () => {
    if (!nextStep) return;
    setUpdating(true);
    setUpdateError("");
    try {
      const updated = await updateOrderStatus(order.id, nextStep.key);
      setOrder(updated);
      setConfirmModalOpen(false);
    } catch (err) {
      setUpdateError(err.message);
      setConfirmModalOpen(false);
    } finally {
      setUpdating(false);
    }
  };

    return (
    <DashboardLayout role="broker">

        <Link to="/mediator-orders" className="back-link order-details-back">
          ‹ العودة إلى الطلبات
        </Link>

        {loading ? (
          <div className="empty-orders">
            <p>جاري تحميل تفاصيل الطلب...</p>
          </div>
        ) : error ? (
          <div className="empty-orders">
            <p>تعذر تحميل الطلب: {error}</p>
          </div>
        ) : (
          <>
            <div className="order-details-card">
              <div className="order-details-top">
                <div>
                  <h1>طلب #{order.id}</h1>
                  <span
                    className={`status-badge ${STATUS_META[order.status]?.className || ""}`}
                  >
                    {STATUS_META[order.status]?.label || order.status}
                  </span>
                </div>
              </div>

              <div className="order-details-meta">
                <div>
                  <div className="profile-field-label">رقم الطلب</div>
                  <div className="profile-field-value">#{order.id}</div>
                </div>
                <div>
                  <div className="profile-field-label">تاريخ الطلب</div>
                  <div className="profile-field-value">{order.date}</div>
                </div>
                <div>
                  <div className="profile-field-label">اسم الزبونة</div>
                  <div className="profile-field-value">{order.customer}</div>
                </div>
                <div>
                  <div className="profile-field-label">عدد المنتجات</div>
                  <div className="profile-field-value">{order.itemsCount}</div>
                </div>
              </div>
            </div>

            {/* ===== مسار الطلب ===== */}
            {!isCancelled && (
              <div className="order-details-card">
                <h2 className="order-details-section-title">مسار الطلب</h2>

                <div className="order-track-row">
                  {STATUS_STEPS.map((step, index) => {
                    const isDone = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const timestamp = index === 0 ? order.date : order.statusUpdatedAt;
                    return (
                      <div className="order-track-step" key={step.key}>
                        <div className="order-track-step-top">
                          <div
                            className={`order-track-circle ${
                              isDone ? "done" : isCurrent ? "current" : "upcoming"
                            }`}
                          >
                            {isDone ? "✓" : index + 1}
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div
                              className={`order-track-connector ${
                                index < currentStepIndex ? "filled" : ""
                              }`}
                            />
                          )}
                        </div>
                        <div
                          className={`order-track-label ${
                            isDone || isCurrent ? "active" : ""
                          }`}
                        >
                          {step.label}
                        </div>
                        {(isDone || isCurrent) && (
                          <div className="order-track-date">{formatDateTime(timestamp)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isFinalStep && <div className="order-track-progress-bar-wrap"><div className="order-track-progress-bar" /></div>}

                <div className="order-track-updated-at">
                  آخر تحديث: {formatDateTime(order.statusUpdatedAt)}
                </div>
              </div>
            )}

            {/* ===== تحديث حالة الطلب ===== */}
            {!isCancelled && (
              <div className="order-details-card order-status-update-card">
                <div>
                  <h2 className="order-details-section-title">تحديث حالة الطلب</h2>
                  <p className="service-description">
                    اختاري الحالة المناسبة للانتقال إلى المرحلة التالية
                  </p>
                  <span className="current-status-pill">
                    <span className="current-status-dot" /> الحالة الحالية:{" "}
                    {STATUS_META[order.status]?.label}
                  </span>
                </div>

                {isFinalStep ? (
                  <span className="order-completed-pill">✓ تم إتمام الطلب</span>
                ) : (
                  <button className="btn btn-primary" onClick={openUpdateModal}>
                    تحديث الحالة
                  </button>
                )}
              </div>
            )}

            {updateError && <p className="form-error">{updateError}</p>}

            <div className="order-details-card">
              <h2 className="order-details-section-title">المنتجات</h2>
              {(order.items || []).length === 0 ? (
                <p className="service-description">لا توجد تفاصيل منتجات لهذا الطلب.</p>
              ) : (
                order.items.map((item) => (
                  <div className="order-item-row" key={item.id}>
                    {item.image && (
                      <img src={item.image} alt={item.name} className="order-item-image" />
                    )}
                    <div className="order-item-info">
                      <div className="order-item-name">{item.name}</div>
                      {item.sheinUrl && (
                        <a
                          href={item.sheinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-item-link"
                        >
                          🔗 رابط المنتج على SHEIN
                        </a>
                      )}
                      <div className="order-item-tags">
                        {item.size && <span className="service-fee-tag">المقاس: {item.size}</span>}
                        {item.color && <span className="service-fee-tag">اللون: {item.color}</span>}
                        {item.quantity && (
                          <span className="service-fee-tag">الكمية: {item.quantity}</span>
                        )}
                      </div>
                      {item.notes && <div className="service-notes">ملاحظة: {item.notes}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ===== نافذة اختيار الحالة التالية ===== */}
            {updateModalOpen && (
              <div className="modal-overlay" onClick={() => setUpdateModalOpen(false)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <span>تغيير حالة الطلب</span>
                    <button className="modal-close-btn" onClick={() => setUpdateModalOpen(false)}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <p className="current-status-line">
                      الحالة الحالية: <strong>{STATUS_META[order.status]?.label}</strong>
                    </p>
                    <label>الانتقال إلى:</label>
                    {nextStep && (
                      <button className="btn btn-primary next-status-btn" onClick={goToConfirm}>
                        {nextStep.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== نافذة تأكيد التحديث ===== */}
            {confirmModalOpen && (
              <div className="modal-overlay" onClick={cancelConfirm}>
                <div className="modal-card confirm-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <span>تأكيد التحديث</span>
                    <button className="modal-close-btn" onClick={cancelConfirm}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <p className="confirm-question">
                      هل تريدين تحديث حالة الطلب إلى <strong>{nextStep?.label}</strong>؟
                    </p>
                    <div className="modal-actions confirm-actions">
                      <button className="btn btn-outline" onClick={cancelConfirm} disabled={updating}>
                        إلغاء
                      </button>
                      <button className="btn btn-primary" onClick={confirmUpdate} disabled={updating}>
                        {updating ? "جاري التحديث..." : "تأكيد"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
         </DashboardLayout>
  );
}