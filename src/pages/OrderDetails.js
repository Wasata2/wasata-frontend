import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderDetails, updateOrderStatus } from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import { formatProductsCount, getStepTime, applyStatusUpdate } from "../utils/orders";

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
  rejected: { label: "مرفوض", className: "rejected" },
};

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
  const isCancelled = order && (order.status === "cancelled" || order.status === "rejected");
  // طلب "تم الطلب" (pending) لسا ما انقبل رسميًا — الانتقال منه لأي حالة بعده
  // لازم يصير فقط عن طريق "قبول الطلب" (مع تسعير المنتجات)، مش زر "تحديث الحالة"
  // العام هون، عشان هيك منمنع نفس هالزر من تخطي هاي الخطوة
  const isPending = order && order.status === "pending";
  const isFinalStep = currentStepIndex === STATUS_STEPS.length - 1;
  const nextStep =
    !isCancelled && !isPending && currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length - 1
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
      // نحافظ على اسم الزبونة والمنتجات (رد الـ PATCH ما بيرجّعهم)
      setOrder((prev) => applyStatusUpdate(prev, updated));
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
                  <div className="profile-field-value">{formatDateTime(order.date)}</div>
                </div>
                <div>
                  <div className="profile-field-label">اسم الزبونة</div>
                  <div className="profile-field-value">{order.customer}</div>
                </div>
                <div>
                  <div className="profile-field-label">عدد المنتجات</div>
                  <div className="profile-field-value">{formatProductsCount(order)}</div>
                </div>
              </div>
            </div>

            {/* ===== بيانات التوصيل (عنوان الزبونة ورقم تواصلها) ===== */}
            <div className="order-details-card">
              <h2 className="order-details-section-title">بيانات التوصيل</h2>
              <div className="order-details-meta">
                <div>
                  <div className="profile-field-label">طريقة الاستلام</div>
                  <div className="profile-field-value">
                    {order.deliveryType === "home_delivery"
                      ? "توصيل إلى المنزل"
                      : order.deliveryType === "pickup"
                        ? "استلام من نقطة استلام"
                        : "—"}
                  </div>
                </div>
                {order.deliveryType === "pickup" && (
                  <div>
                    <div className="profile-field-label">نقطة الاستلام</div>
                    <div className="profile-field-value">{order.pickupLocation || "—"}</div>
                  </div>
                )}
                {order.deliveryType === "home_delivery" && (
                  <div>
                    <div className="profile-field-label">العنوان</div>
                    <div className="profile-field-value">{order.address || "—"}</div>
                  </div>
                )}
                <div>
                  <div className="profile-field-label">رقم التواصل</div>
                  <div className="profile-field-value">
                    {order.contactPhone ? (
                      <a href={`tel:${order.contactPhone}`} dir="ltr">
                        {order.contactPhone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>
              {order.customerNote && (
                <div className="service-notes" style={{ whiteSpace: "pre-line", marginTop: "12px" }}>
                  ملاحظات الزبونة: {order.customerNote}
                </div>
              )}
            </div>

            {/* ===== مسار الطلب ===== */}
            {!isCancelled && (
              <div className="order-details-card">
                <h2 className="order-details-section-title">مسار الطلب</h2>

                <div className="order-track-row">
                  {STATUS_STEPS.map((step, index) => {
                    // آخر مرحلة (تم الاستلام) لما توصلها تعتبر مكتملة: ✓ وخط كامل
                    const isDone = index < currentStepIndex || (isFinalStep && index === currentStepIndex);
                    const isCurrent = index === currentStepIndex && !isFinalStep;
                    const timestamp = getStepTime(order, step.key, index, currentStepIndex);
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
                          {/* خط بيربط هاي المرحلة بالمرحلة اللي قبلها */}
                          {index > 0 && (
                            <div
                              className={`order-track-connector ${
                                index <= currentStepIndex ? "filled" : ""
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
                        {(isDone || isCurrent) && timestamp && (
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
                  {isPending ? (
                    <p className="service-description">
                      هاد الطلب لسا بانتظار قبول أو رفض — أكّدي القبول (مع تحديد السعر النهائي
                      لكل منتج) أو الرفض من صفحة "الطلبات".
                    </p>
                  ) : (
                    <>
                      <p className="service-description">
                        اختاري الحالة المناسبة للانتقال إلى المرحلة التالية
                      </p>
                      <span className="current-status-pill">
                        <span className="current-status-dot" /> الحالة الحالية:{" "}
                        {STATUS_META[order.status]?.label}
                      </span>
                    </>
                  )}
                </div>

                {isPending ? (
                  <Link to="/mediator-orders" className="btn btn-outline">
                    الرجوع لصفحة الطلبات
                  </Link>
                ) : isFinalStep ? (
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
                        {item.price != null && (
                          <span className="service-fee-tag">سعر القطعة: {item.price} ₪</span>
                        )}
                        {item.price != null && Number(item.quantity) > 1 && (
                          <span className="service-fee-tag">
                            المجموع: {item.price * Number(item.quantity)} ₪
                          </span>
                        )}
                      </div>
                      {item.notes && <div className="service-notes">ملاحظة: {item.notes}</div>}
                    </div>
                  </div>
                ))
              )}
              {(order.items || []).length > 0 && order.totals && order.totals.deliveryFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
                  <span>رسوم التوصيل</span>
                  <span>{order.totals.deliveryFee} ₪</span>
                </div>
              )}
              {(order.items || []).length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "14px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--line)",
                    fontWeight: 800,
                  }}
                >
                  <span>إجمالي سعر الطلب</span>
                  <span>
                    {order.totals?.priced
                      ? `${order.totals.totalAmount} ₪`
                      : order.totalPrice != null
                        ? `${order.totalPrice} ₪`
                        : "لم يتم التسعير بعد"}
                  </span>
                </div>
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