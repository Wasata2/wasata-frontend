import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// TODO: تقييم واحد وهمي بس لتوضيح الشكل — لاحقًا لازم يتعبى من تقييمات الزبائن
// الحقيقية عن طريق endpoint من الباك اند (نفس ملاحظة الطلبات بصفحة MediatorOrders)
const DEMO_REVIEWS = [
  {
    id: 1,
    customer: "سارة أحمد",
    date: "2026-08-24",
    rating: 5,
    comment:
      "الخدمة كانت ممتازة والطلب وصل في الموعد المحدد تمامًا. أنصح الجميع بالتعامل مع هذه الوسيطة.",
    orderId: "1042",
  },
];

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
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName = storedUser.full_name || "مستخدمة";
  const userInitial = userName.charAt(0);

  const [reviews] = useState(DEMO_REVIEWS);
  const [sortBy, setSortBy] = useState("newest");

  // ملخص التقييمات (المتوسط + توزيع النجوم) محسوب تلقائيًا من البيانات الفعلية —
  // مش أرقام ثابتة، عشان يضل صحيح مهما تغيّر عدد التقييمات الحقيقي لاحقًا
  const summary = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      const pct = total ? Math.round((count / total) * 100) : 0;
      return { star, pct };
    });
    return { total, avg: avg.toFixed(1), dist };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sortBy === "highest") copy.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "lowest") copy.sort((a, b) => a.rating - b.rating);
    else copy.sort((a, b) => new Date(b.date) - new Date(a.date));
    return copy;
  }, [reviews, sortBy]);

  return (
    <div className="dashboard-layout">
      {/* ===== نفس القائمة الجانبية الموجودة بباقي صفحات لوحة التحكم ===== */}
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
          <Link to="/mediator-orders" className="sidebar-link">
            <span className="sidebar-icon">📋</span> الطلبات
          </Link>
          <a href="#" className="sidebar-link">
            <span className="sidebar-icon">🛍</span> الخدمات
          </a>
          <Link to="/mediator-reviews" className="sidebar-link active">
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
        {sortedReviews.length === 0 ? (
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
      </main>
    </div>
  );
}