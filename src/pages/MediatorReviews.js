import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getReviews } from "../api";
import DashboardLayout from "../components/DashboardLayout";

function StarRating({ rating, size }) {
  return (
    <span className={`star-rating ${size || ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </span>
  );
}

const SORT_TABS = [
  { key: "newest", label: "الأحدث" },
  { key: "highest", label: "الأعلى تقييمًا" },
  { key: "lowest", label: "الأقل تقييمًا" },
];

export default function MediatorReviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ total: 0, avg: "0.0", dist: [] });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // تقييمات الزبائن الحقيقية + ملخصها (المتوسط والتوزيع) — جاهزين من الباك اند
  // مباشرة، ما في داعي نحسبهم يدويًا بالفرونت
  useEffect(() => {
    getReviews()
      .then((data) => {
        setReviews(data.reviews);
        setSummary({
          total: data.totalReviews,
          avg: data.averageRating.toFixed(1),
          dist: data.distribution,
        });
        setLoadingReviews(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setLoadingReviews(false);
      });
  }, []);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sortBy === "highest") copy.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "lowest") copy.sort((a, b) => a.rating - b.rating);
    else copy.sort((a, b) => new Date(b.date) - new Date(a.date));
    return copy;
  }, [reviews, sortBy]);

  return (
    <DashboardLayout role="broker">
        <div className="dashboard-welcome">
          <h1>التقييمات والمراجعات</h1>
          <p>اطّلعي على تقييمات الزبائن وآرائهم حول خدماتك.</p>
        </div>

        {/* بطاقة ملخص التقييمات: التوزيع + المتوسط العام */}
        <div className="reviews-summary-card">
          <div className="rating-distribution">
            <div className="rating-distribution-title">توزيع التقييمات</div>
            {summary.dist.map((row) => (
              <div className="rating-dist-row" key={row.star}>
                <span className="rating-dist-pct">{row.pct}%</span>
                <div className="rating-bar-track">
                  <div className="rating-bar-fill" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="rating-dist-label">{row.star} نجوم</span>
              </div>
            ))}
          </div>

          <div className="rating-average">
            <div className="rating-average-number">{summary.avg}</div>
            <StarRating rating={Number(summary.avg)} size="lg" />
            <div className="rating-average-sub">من 5</div>
            <span className="reviews-count-pill">{summary.total} تقييم</span>
          </div>
        </div>

        {/* رأس قسم آراء الزبائن + تبويبات الترتيب */}
        <div className="reviews-list-header">
          <h2>آراء الزبائن</h2>
          <div className="status-tabs">
            {SORT_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`status-tab ${sortBy === tab.key ? "active" : ""}`}
                onClick={() => setSortBy(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة التقييمات */}
        {loadingReviews ? (
          <div className="empty-orders">
            <p>جاري التحميل...</p>
          </div>
        ) : loadError ? (
          <div className="empty-orders">
            <p>تعذر تحميل التقييمات: {loadError}</p>
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="empty-orders">
            <p>لا توجد تقييمات بعد.</p>
          </div>
        ) : (
          sortedReviews.map((review) => (
            <div className="review-card" key={review.id}>
              <div className="review-card-top">
                <div className="review-date">
                  {new Date(review.date).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="review-author">
                  <div className="review-author-info">
                    <div className="review-author-name">{review.customer}</div>
                    <StarRating rating={review.rating} />
                  </div>
                  <div className="review-avatar">{review.customer.charAt(0)}</div>
                </div>
              </div>

              <p className="review-comment">{review.comment}</p>

              <span className="review-order-tag">طلب #{review.orderId}</span>
            </div>
          ))
        )}
    </DashboardLayout>
  );
}