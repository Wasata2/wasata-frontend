import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getMyOrderDetail, cancelOrder } from "../api";
import DashboardLayout from "../components/DashboardLayout";

const STATUS_STEPS = [
    { key: "pending", label: "تم الطلب" },
    { key: "ordered_from_shein", label: "تم الطلب من SHEIN" },
    { key: "shipped", label: "تم الشحن" },
    { key: "arrived", label: "وصلت" },
    { key: "inspected", label: "تم الفحص" },
    { key: "received", label: "تم الاستلام" },
];

export default function CustomerOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

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

    const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
    const isCancelled = order?.status === "cancelled";

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
                        <h3 className="order-details-section-title">تفاصيل التوصيل</h3>
                        <p>📦 {order.deliveryMethod}</p>
                        {order.customerNote && <p style={{ marginTop: "10px" }}>📝 {order.customerNote}</p>}
                    </div>
                    <div className="order-details-card">
                        <div className="order-details-top">
                            <h1>طلب #{order.id}</h1>
                            <span className="order-list-price">
                                {order.price != null ? `${order.price} ₪` : "السعر قيد التحديد"}
                            </span>
                        </div>
                        <p className="order-store">🕐 {order.store}</p>

                        {isCancelled ? (
                            <div className="order-reject-banner" style={{ marginTop: "16px" }}>
                                هذا الطلب ملغى{order.rejectionReason ? `: ${order.rejectionReason}` : ""}
                            </div>
                        ) : (
                            <div className="order-timeline" style={{ marginTop: "20px" }}>
                                {STATUS_STEPS.map((step, index) => {
                                    const status =
                                        index < currentStepIndex ? "done" : index === currentStepIndex ? "current" : "upcoming";
                                    return (
                                        <div key={step.key} className={`timeline-step ${status}`}>
                                            <div className="timeline-line"></div>
                                            <div className="timeline-dot">{status === "done" ? "✓" : index + 1}</div>
                                            <div className="timeline-label">{step.label}</div>
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

                    <div className="order-details-card">
                        <h3 className="order-details-section-title">المنتجات ({order.items.length})</h3>
                        {order.items.map((item) => (
                            <div className="order-item-row" key={item.id}>
                                {item.image && <img src={item.image} alt={item.name} className="order-item-image" />}
                                <div className="order-item-info">
                                    <div className="order-item-name">{item.name}</div>
                                    {item.sheinUrl && (
                                        <a href={item.sheinUrl} target="_blank" rel="noreferrer" className="order-item-link">
                                            رابط المنتج
                                        </a>
                                    )}
                                    <div className="order-item-tags">
                                        {item.color && <span className="service-fee-tag">اللون: {item.color}</span>}
                                        {item.size && <span className="service-fee-tag">المقاس: {item.size}</span>}
                                        <span className="service-fee-tag">الكمية: {item.quantity}</span>
                                        {item.price != null && <span className="service-fee-tag">{item.price} ₪</span>}
                                    </div>
                                    {item.notes && <p className="order-item-notes">📌 {item.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}