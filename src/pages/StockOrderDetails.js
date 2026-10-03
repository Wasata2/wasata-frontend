import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { formatDateTime } from "../utils/dates";
import {
  getCurrentUserId,
  getStockOrder,
  syncStockOrders,
  getStockOrderFee,
  getStockOrderTotal,
  STOCK_ORDER_LABELS,
} from "../utils/stockOrders";

// شاشة طلب قطعة راكدة — نفس ستايل مراجعة الطلب لكن بمعلومات القطعة،
// وبدون مسار تتبع لأن التسليم فوري: الحالة إما "تم الطلب" أو "تم الاستلام"
export default function StockOrderDetails() {
  const { itemId } = useParams();
  const location = useLocation();
  const userId = getCurrentUserId();
  const [order, setOrder] = useState(() => getStockOrder(userId, itemId));

  // بنحدّث الحالة من الباك اند كل ما تنفتح الصفحة (تم الاستلام / ملغي)
  useEffect(() => {
    let active = true;
    syncStockOrders(userId)
      .then(() => {
        if (active) setOrder(getStockOrder(userId, itemId));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, itemId]);

  const isHome = order?.deliveryMethod === "home_delivery";
  const fee = getStockOrderFee(order);
  const total = getStockOrderTotal(order);

  const type = !order
    ? "active"
    : order.status === "received"
      ? "completed"
      : order.status === "cancelled"
        ? "cancelled"
        : "active";

  return (
    <DashboardLayout role="customer">
      <Link to="/my-orders" className="back-link order-details-back">
        ‹ العودة إلى طلباتي
      </Link>

      {!order && (
        <div className="empty-orders">
          <p>ما لقينا هذا الطلب على هذا الجهاز.</p>
          <Link to="/my-orders" className="btn btn-outline">
            الذهاب إلى طلباتي
          </Link>
        </div>
      )}

      {order && (
        <>
          {location.state?.justOrdered && (
            <div className="order-success-banner">✓ تم إرسال طلبك للوسيطة، وتقدري تتابعيه من طلباتي</div>
          )}

          {/* ===== بطاقة الطلب: الحالة + السعر الإجمالي (شامل التوصيل) ===== */}
          <div className="order-details-card">
            <div className="order-details-top">
              <h1>طلب قطعة راكدة</h1>
              <span className="order-list-price">{total} ₪</span>
            </div>
            <p className="order-store">🕐 {order.storeName}</p>
            <div style={{ marginTop: "14px" }}>
              <span className={`order-list-status-badge status-${type}`}>
                ● {STOCK_ORDER_LABELS[order.status] || STOCK_ORDER_LABELS.ordered}
              </span>
            </div>
            {type === "cancelled" ? (
              <div className="order-reject-banner" style={{ marginTop: "16px" }}>
                الوسيطة ألغت حجز هذه القطعة، وصارت متاحة للعرض من جديد.
              </div>
            ) : type === "completed" ? (
              <div className="order-success-banner" style={{ marginTop: "16px" }}>
                ✓ تم استلام القطعة
              </div>
            ) : (
              <p className="stock-order-instant-note">⚡ تسليم فوري — القطعة جاهزة عند الوسيطة، فما في مسار تتبع لهذا الطلب (بس "تم الطلب" و"تم الاستلام").</p>
            )}
          </div>

          {/* ===== القطعة ===== */}
          <div className="order-details-card">
            <h3 className="order-details-section-title">القطعة المطلوبة</h3>
            <div className="order-item-row">
              {order.image && <img src={order.image} alt={order.name} className="order-item-image" />}
              <div className="order-item-info">
                <div className="order-item-name">{order.name}</div>
                <div className="order-item-tags">
                  {order.category && <span className="service-fee-tag">الفئة: {order.category}</span>}
                  {order.color && <span className="service-fee-tag">اللون: {order.color}</span>}
                  {order.size && <span className="service-fee-tag">المقاس: {order.size}</span>}
                  <span className="service-fee-tag">الكمية: 1</span>
                  <span className="service-fee-tag">سعر القطعة: {order.price} ₪</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== الوسيطة والاستلام ===== */}
          <div className="order-details-card">
            <h3 className="order-details-section-title">الوسيطة والاستلام</h3>
            <div className="order-details-meta">
              <div>
                <div className="profile-field-label">الوسيطة</div>
                <div className="profile-field-value">
                  <Link to={`/mediators/${order.storeId}`}>{order.storeName}</Link>
                </div>
              </div>
              {order.city && (
                <div>
                  <div className="profile-field-label">المدينة</div>
                  <div className="profile-field-value">{order.city}</div>
                </div>
              )}
              {order.storePhone && (
                <div>
                  <div className="profile-field-label">رقم الوسيطة</div>
                  <div className="profile-field-value" dir="ltr" style={{ textAlign: "right" }}>
                    {order.storePhone}
                  </div>
                </div>
              )}
              <div>
                <div className="profile-field-label">تاريخ الطلب</div>
                <div className="profile-field-value">{formatDateTime(order.createdAt)}</div>
              </div>
              <div>
                <div className="profile-field-label">طريقة الاستلام</div>
                <div className="profile-field-value">
                  {isHome ? "توصيل إلى المنزل" : "استلام من نقطة استلام"}
                </div>
              </div>
              {isHome && order.deliveryRegion && (
                <div>
                  <div className="profile-field-label">منطقة التوصيل</div>
                  <div className="profile-field-value">{order.deliveryRegion}</div>
                </div>
              )}
              {isHome && (
                <div>
                  <div className="profile-field-label">العنوان</div>
                  <div className="profile-field-value">{order.address || "—"}</div>
                </div>
              )}
              {isHome && (
                <div>
                  <div className="profile-field-label">رقم التواصل</div>
                  <div className="profile-field-value" dir="ltr" style={{ textAlign: "right" }}>
                    {order.contactPhone || "—"}
                  </div>
                </div>
              )}
              {!isHome && order.pickupLocation && (
                <div>
                  <div className="profile-field-label">نقطة الاستلام</div>
                  <div className="profile-field-value">📍 {order.pickupLocation}</div>
                </div>
              )}
            </div>
            {order.customerNote && (
              <p style={{ marginTop: "12px", whiteSpace: "pre-line" }}>📝 ملاحظاتك: {order.customerNote}</p>
            )}
            <p className="review-payment-note">🔒 لم يتم خصم أي مبلغ، الدفع يتم بعد تأكيد الوسيطة طلبك.</p>

            <div className="review-row">
              <span>سعر القطعة</span>
              <span>{order.price} ₪</span>
            </div>
            {isHome && fee > 0 && (
              <div className="review-row">
                <span>رسوم التوصيل{order.deliveryRegion ? ` (${order.deliveryRegion})` : ""}</span>
                <span>{fee} ₪</span>
              </div>
            )}
            <div className="stock-order-total">
              <span>إجمالي الطلب</span>
              <span>{total} ₪</span>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}