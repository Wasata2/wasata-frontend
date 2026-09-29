import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getMyOrders, createOrderReview } from "../api";
import { formatDateTime } from "../utils/dates";

const RATING_LABELS = {
  1: "سيئ",
  2: "مقبول",
  3: "جيد",
  4: "جيد جدًا",
  5: "ممتاز",
};

const MAX_COMMENT_LENGTH = 500;

export default function OrderReview() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // بنجيب الطلب من قائمة طلبات الزبونة نفسها (نفس مصدر صفحة "طلباتي")
  useEffect(() => {
    let active = true;
    getMyOrders()
      .then(({ orders }) => {
        if (!active) return;
        setOrder(orders.find((o) => String(o.id) === String(id)) || null);
      })
      .catch((err) => active && setLoadError(err.message || "تعذر جلب بيانات الطلب"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setSubmitError("اختاري عدد النجوم أولًا.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      await createOrderReview(id, { rating, comment: comment.trim() });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "تعذر إرسال التقييم");
    } finally {
      setSubmitting(false);
    }
  };

  const shownRating = hoverRating || rating;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="orders-empty-state">
          <p>جاري تحميل بيانات الطلب...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="orders-empty-state">
          <p>تعذر تحميل الطلب</p>
          <span>{loadError}</span>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="orders-empty-state">
          <p>لم نجد هذا الطلب ضمن طلباتك.</p>
          <Link to="/my-orders" className="btn btn-outline">
            العودة إلى طلباتي
          </Link>
        </div>
      );
    }

    if (submitted) {
      return (
        <div className="review-page-card">
          <div className="review-page-done">
            <div className="review-page-done-icon">✓</div>
            <h2>شكرًا لتقييمك!</h2>
            <p>وصل تقييمك لـ {order.store}، ورأيك بيساعد الزبائن التانيين يختاروا صح.</p>
            <Link to="/my-orders" className="btn btn-primary">
              العودة إلى طلباتي
            </Link>
          </div>
        </div>
      );
    }

    if (order.type !== "completed") {
      return (
        <div className="orders-empty-state">
          <p>التقييم متاح بعد استلام الطلب.</p>
          <span>بتقدري تقيّمي الوسيطة أول ما يوصلك طلبك.</span>
          <Link to="/my-orders" className="btn btn-outline">
            العودة إلى طلباتي
          </Link>
        </div>
      );
    }

    if (order.reviewed) {
      return (
        <div className="orders-empty-state">
          <p>سبق وقيّمتِ هذه الوسيطة على هذا الطلب.</p>
          <Link to="/my-orders" className="btn btn-outline">
            العودة إلى طلباتي
          </Link>
        </div>
      );
    }

    return (
      <form className="review-page-card" onSubmit={handleSubmit}>
        <div className="review-page-order">
          <div className="review-page-order-icon">🏪</div>
          <div>
            <div className="review-page-order-name">{order.store}</div>
            <div className="review-page-order-meta">
              طلب #{order.id} · {formatDateTime(order.date)}
            </div>
          </div>
        </div>

        <span className="review-page-label">كيف كانت تجربتك مع الوسيطة؟</span>
        <div
          className="star-picker"
          role="radiogroup"
          aria-label="التقييم من 5 نجوم"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} من 5 — ${RATING_LABELS[star]}`}
              className={`star-picker-btn ${star <= shownRating ? "filled" : ""}`}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
        </div>
        <div className="star-picker-hint">{shownRating ? RATING_LABELS[shownRating] : ""}</div>

        <label className="review-page-label" htmlFor="review-comment">
          رأيك بالوسيطة <span>(اختياري)</span>
        </label>
        <textarea
          id="review-comment"
          className="review-page-textarea"
          placeholder="احكيلنا عن تجربتك: الالتزام بالوقت، جودة التعامل، حالة القطع عند الوصول..."
          value={comment}
          maxLength={MAX_COMMENT_LENGTH}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="review-page-counter">
          {comment.length} / {MAX_COMMENT_LENGTH}
        </div>

        {submitError && <p className="form-error">{submitError}</p>}

        <div className="review-page-actions">
          <Link to="/my-orders" className="btn btn-outline">
            إلغاء
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting || rating < 1}>
            {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <DashboardLayout role="customer">
      <Link to="/my-orders" className="back-link order-details-back">
        ‹ العودة إلى طلباتي
      </Link>

      <div className="dashboard-welcome-row">
        <div className="dashboard-welcome">
          <h1>تقييم الوسيطة</h1>
          <p>شاركينا رأيك بالوسيطة بعد استلام طلبك.</p>
        </div>
      </div>

      {renderBody()}
    </DashboardLayout>
  );
}