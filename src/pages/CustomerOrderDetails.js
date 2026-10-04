import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getMyOrderDetail,
  cancelOrder,
  approveOrderPrice,
  declineOrderPrice,
} from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import { getStepTime } from "../utils/orders";

const STATUS_STEPS = [
  { key: "pending", label: "تم الطلب" },
  { key: "ordered_from_shein", label: "تم الطلب من SHEIN" },
  { key: "shipped", label: "تم الشحن" },
  { key: "arrived", label: "وصلت" },
  { key: "inspected", label: "تم الفحص" },
  { key: "received", label: "تم الاستلام" },
];
function decideErrorMessage(err) {
  if (err.code === "ORDER_NOT_AWAITING_APPROVAL")
    return "هاد الطلب ما عاد بانتظار موافقتك، حدّثنا الصفحة.";
  if (err.code === "ORDER_NOT_YOURS") return "هاد الطلب مش إلك.";
  return err.message;
}
export default function CustomerOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [decideError, setDecideError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    getMyOrderDetail(id)
      .then(setOrder)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("هل أنتِ متأكدة من إلغاء هذا الطلب؟")) return;
    setCancelError("");
    setCancelling(true);
    try {
      await cancelOrder(id);
      navigate("/my-orders");
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleApprove = async () => {
    setDecideError("");
    setDeciding(true);
    try {
      await approveOrderPrice(id);
      load();
    } catch (err) {
setDecideError(decideErrorMessage(err))    } finally {
      setDeciding(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm("رفض السعر بيلغي الطلب. متأكدة؟")) return;
    setDecideError("");
    setDeciding(true);
    try {
      await declineOrderPrice(id);
      navigate("/my-orders");
    } catch (err) {
setDecideError(decideErrorMessage(err))
    } finally {
      setDeciding(false);
    }
  };

  const isAwaiting = order?.status === "awaiting_approval";
  const currentStepIndex = order
    ? isAwaiting
      ? 0
      : STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;
  const isRejected = order?.status === "rejected";
  const isCancelled = order?.status === "cancelled" || isRejected;
  const isHomeDelivery = order?.deliveryType === "home_delivery";

  return (
    <DashboardLayout role="customer">
      <Link to="/my-orders" className="back-link order-details-back">
        ‹ العودة إلى طلباتي
      </Link>

      {loading && <p className="explore-loading">جاري التحميل...</p>}
      {loadError && (
        <div className="empty-orders">
          <p>تعذر تحميل الطلب: {loadError}</p>
        </div>
      )}

      {order && (
        <>
          <div className="order-details-card">
            <div className="order-details-top">
              <h1>طلب #{order.id}</h1>
              <span className="order-list-price">
                {order.price != null ? `${order.price} ₪` : "السعر قيد التحديد"}
              </span>
            </div>
            <p className="order-store">🕐 {order.store}</p>

            {isCancelled ? (
              <div
                className="order-reject-banner"
                style={{ marginTop: "16px" }}
              >
                هذا الطلب {isRejected ? "مرفوض" : "ملغى"}
                {order.rejectionReason ? `: ${order.rejectionReason}` : ""}
              </div>
            ) : (
              <div className="order-timeline" style={{ marginTop: "20px" }}>
                {STATUS_STEPS.map((step, index) => {
                  const status =
                    index < currentStepIndex
                      ? "done"
                      : index === currentStepIndex
                        ? "current"
                        : "upcoming";
                  const stepTime =
                    status === "upcoming"
                      ? null
                      : getStepTime(order, step.key, index, currentStepIndex);
                  return (
                    <div key={step.key} className={`timeline-step ${status}`}>
                      <div className="timeline-line"></div>
                      <div className="timeline-dot">
                        {status === "done" ? "✓" : index + 1}
                      </div>
                      <div className="timeline-label">{step.label}</div>
                      {stepTime && (
                        <div className="timeline-date">
                          {formatDateTime(stepTime)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isCancelled && order.status === "pending" && (
              <div className="order-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: "#dc2626", borderColor: "#dc2626" }}
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? "جاري الإلغاء..." : "إلغاء الطلب"}
                </button>
              </div>
            )}
            {cancelError && <p className="form-error">{cancelError}</p>}
          </div>

          {isAwaiting && (
            <div className="order-details-card price-approval-card">
              <h3 className="order-details-section-title">
                🔔 الوسيطة حددت سعر طلبك
              </h3>
              <p className="price-approval-text">
                السعر النهائي شامل التوصيل (إن وجد). إذا قبلتي بيبدأ تنفيذ
                الطلب، وإذا رفضتي بيتلغى.
              </p>

              {order.items.map((item) => (
                <div className="review-row" key={item.id}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    {item.price != null
                      ? `${item.price * Number(item.quantity)} ₪`
                      : "—"}
                  </span>
                </div>
              ))}
              {order.totals && order.totals.deliveryFee > 0 && (
                <div className="review-row">
                  <span>رسوم التوصيل</span>
                  <span>{order.totals.deliveryFee} ₪</span>
                </div>
              )}
              <div className="review-row review-total">
                <span>الإجمالي</span>
                <span>{order.price} ₪</span>
              </div>

              {decideError && <p className="form-error">{decideError}</p>}

              <div className="order-actions" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApprove}
                  disabled={deciding}
                >
                  {deciding ? "جاري المعالجة..." : "✓ أقبل السعر"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: "#dc2626", borderColor: "#dc2626" }}
                  onClick={handleDecline}
                  disabled={deciding}
                >
                  ✕ أرفض
                </button>
              </div>
            </div>
          )}

          <div className="order-details-card">
            <h3 className="order-details-section-title">تفاصيل التوصيل</h3>
            <div className="order-details-meta">
              <div>
                <div className="profile-field-label">طريقة الاستلام</div>
                <div className="profile-field-value">
                  {isHomeDelivery
                    ? "توصيل إلى المنزل"
                    : "استلام من نقطة استلام"}
                </div>
              </div>
              {isHomeDelivery && (
                <div>
                  <div className="profile-field-label">العنوان</div>
                  <div className="profile-field-value">
                    {order.address || "—"}
                  </div>
                </div>
              )}
              {!isHomeDelivery && (
                <div>
                  <div className="profile-field-label">نقطة الاستلام</div>
                  <div className="profile-field-value">
                    {order.pickupLocation || "غير محددة، تواصلي مع الوسيطة"}
                  </div>
                </div>
              )}
              {isHomeDelivery && (
                <div>
                  <div className="profile-field-label">رقم التواصل</div>
                  <div
                    className="profile-field-value"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  >
                    {order.contactPhone || "—"}
                  </div>
                </div>
              )}
            </div>
            {order.customerNote && (
              <p style={{ marginTop: "12px", whiteSpace: "pre-line" }}>
                📝 ملاحظاتك: {order.customerNote}
              </p>
            )}
          </div>

          <div className="order-details-card">
            <h3 className="order-details-section-title">
              المنتجات ({order.items.length})
            </h3>
            {order.items.map((item) => (
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
                  {item.sheinUrl && (
                    <a
                      href={item.sheinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="order-item-link"
                    >
                      رابط المنتج
                    </a>
                  )}
                  <div className="order-item-tags">
                    {item.color && (
                      <span className="service-fee-tag">
                        اللون: {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="service-fee-tag">
                        المقاس: {item.size}
                      </span>
                    )}
                    <span className="service-fee-tag">
                      الكمية: {item.quantity}
                    </span>
                    {item.price != null && (
                      <span className="service-fee-tag">
                        سعر القطعة: {item.price} ₪
                      </span>
                    )}
                    {item.price != null && Number(item.quantity) > 1 && (
                      <span className="service-fee-tag">
                        المجموع: {item.price * Number(item.quantity)} ₪
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="order-item-notes">📌 {item.notes}</p>
                  )}
                </div>
              </div>
            ))}

            {order.totals && order.totals.deliveryFee > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "14px",
                }}
              >
                <span>رسوم التوصيل</span>
                <span>{order.totals.deliveryFee} ₪</span>
              </div>
            )}
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
                {order.price != null ? `${order.price} ₪` : "السعر قيد التحديد"}
              </span>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}