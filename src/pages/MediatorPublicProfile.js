import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStores, getStoreProfile, getStoreReviews } from "../api";
import { loadListedItems } from "../stagnantItemsStore";

// الملف العام للوسيطة — بنفس شكل "معاينة الملف كما يظهر للزبائن" بصفحة ملف الوسيطة،
// بس هون بيانات أي وسيطة (حسب الـ id بالرابط) مش وسيطة واحدة.

// أيقونات الخدمة — نفس القيم يلي بصفحة إدارة الخدمات
const ICONS = [
  { value: "search", label: "🔍" },
  { value: "diamond", label: "💎" },
  { value: "scissors", label: "✂️" },
  { value: "gift", label: "🎁" },
  { value: "tag", label: "🏷️" },
  { value: "chat", label: "💬" },
  { value: "refresh", label: "🔄" },
  { value: "pin", label: "📍" },
  { value: "truck", label: "🚚" },
  { value: "photo", label: "🖼️" },
];

function iconEmoji(value) {
  return ICONS.find((i) => i.value === value)?.label || "❔";
}

function feeLabel(service) {
  if (service.feeType === "free") return "مجاني";
  if (service.feeType === "variable") return "حسب الحالة";
  if (service.feeType === "percentage") return `عمولة ${service.feeValue}%`;
  if (service.feeType === "fixed") return `ابتداء من ${service.feeValue} ₪`;
  return "";
}

function formatCommission(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? `${n}%` : null;
}

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

export default function MediatorPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ===== بيانات الوسيطة (من قائمة الوسيطات الحقيقية) =====
  const [mediator, setMediator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getStores()
      .then((list) => {
        if (cancelled) return;
        setMediator(list.find((m) => String(m.id) === String(id)) || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "تعذر جلب بيانات الوسيطة");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ===== الخدمات المتاحة (جاية مع بروفايل المتجر: GET /api/stores/{id}) =====
  const [services, setServices] = useState([]);
  // حقول إضافية من بروفايل المتجر بنستخدمها لو قائمة الوسيطات ما رجّعتها (التلفون والعمولة)
  const [extra, setExtra] = useState({ phone: "", commission: null });
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingServices(true);
    setServicesError(false);
    getStoreProfile(id)
      .then(({ store, services: list }) => {
        if (cancelled) return;
        setServices(list.filter((s) => s.available));
        setExtra({ phone: store.phone, commission: store.commission });
      })
      .catch((err) => {
        // بنسجّل سبب الفشل بالـ console عشان نعرف مسار الخدمات الصحيح مع الباك اند
        console.log("تعذر جلب خدمات الوسيطة:", err.message);
        if (!cancelled) setServicesError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ===== التقييمات =====
  const [reviews, setReviews] = useState([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingReviews(true);
    setReviewsError(false);
    getStoreReviews(id)
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews);
        setRatingAvg(data.averageRating);
      })
      .catch(() => {
        if (!cancelled) setReviewsError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ===== القطع المعروضة للبيع عند هالوسيطة =====
  const [showItems, setShowItems] = useState(false);
  const [listedItems, setListedItems] = useState([]);
  const openItems = () => {
    setListedItems(loadListedItems(id));
    setShowItems(true);
  };

  const topbar = (
    <div className="preview-topbar">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ‹ عودة
      </button>
      <div className="sidebar-logo">
        <img src="/logo.svg" alt="وساطة" className="logo-img" />
        وساطة
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main">
          {topbar}
          <p className="explore-loading">جاري تحميل الملف...</p>
        </main>
      </div>
    );
  }

  if (error || !mediator) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main">
          {topbar}
          <div className="explore-empty-state">
            <div className="empty-icon">{error ? "⚠️" : "🔍"}</div>
            <h3>{error ? "تعذر تحميل الملف" : "ما لقينا هاي الوسيطة"}</h3>
            <p>{error || "يمكن الوسيطة مش موجودة أو تم حذفها."}</p>
            <Link to="/explore-mediators" className="btn btn-outline">
              الرجوع لاستكشاف الوسيطات
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const commission = formatCommission(mediator.commission ?? extra.commission);
  const phone = mediator.phone || extra.phone;
  const initial = (mediator.name || "و").charAt(0);

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        {topbar}

        <div className="profile-preview-wrap">
          <div className="profile-hero-card">
            <div className="profile-hero-banner">
              <button type="button" className="profile-preview-link" onClick={openItems}>
                🛍 القطع المعروضة
              </button>
            </div>
            <div className="profile-hero-body">
              <div className="profile-hero-avatar-wrap">
                <div
                  className="profile-hero-avatar"
                  style={{ backgroundImage: mediator.image ? `url(${mediator.image})` : "none" }}
                >
                  {!mediator.image && initial}
                </div>
              </div>

              <div className="profile-hero-info">
                <div className="profile-hero-name-row">
                  <h2>{mediator.name}</h2>
                </div>
                <div className="profile-hero-facts">
                  <span className="profile-hero-fact-row">🏷️ وسيطة</span>
                  {mediator.city && <span className="profile-hero-fact-row">📍 {mediator.city}</span>}
                  {phone && <span className="profile-hero-fact-row">📞 {phone}</span>}
                  {commission && <span className="profile-hero-fact-row">💰 {commission} عمولة</span>}
                  <span className="profile-hero-fact-row">
                    <span className={`status-dot ${mediator.acceptingOrders ? "on" : "off"}`}></span>
                    {mediator.acceptingOrders ? "متاحة" : "غير متاحة"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="public-info-card">
            <h3 className="public-info-card-title">عن الوسيطة</h3>
            <p className="public-info-bio-text">{mediator.bio || "لم تتم إضافة نبذة بعد."}</p>
          </div>

          <div className="public-info-card">
            <h3 className="public-info-card-title">الخدمات المتاحة</h3>
            {loadingServices ? (
              <p className="service-description">جاري التحميل...</p>
            ) : servicesError ? (
              <p className="service-description">تعذر تحميل الخدمات حاليًا.</p>
            ) : services.length === 0 ? (
              <p className="service-description">لا توجد خدمات متاحة حاليًا.</p>
            ) : (
              <div className="public-services-list">
                {services.map((s) => (
                  <div className="service-card" key={s.id}>
                    <div className="service-icon-badge">{iconEmoji(s.icon)}</div>
                    <div className="service-content">
                      <div className="service-name">{s.name}</div>
                      <div className="service-description">{s.description}</div>
                      {s.notes && <div className="service-notes">📌 {s.notes}</div>}
                    </div>
                    <div className="service-meta-row">
                      <span className="service-fee-tag">{feeLabel(s)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="public-info-card">
            <h3 className="public-info-card-title">التقييمات</h3>
            {loadingReviews ? (
              <p className="service-description">جاري التحميل...</p>
            ) : reviewsError ? (
              <p className="service-description">تعذر تحميل التقييمات حاليًا.</p>
            ) : (
              <>
                <div className="rating-average standalone">
                  <div className="rating-average-number">{ratingAvg || "0.0"}</div>
                  <StarRating rating={ratingAvg} size="lg" />
                </div>

                {reviews.length === 0 ? (
                  <p className="service-description">لا توجد تقييمات بعد.</p>
                ) : (
                  reviews.map((review) => (
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
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        <div className="preview-bottom-bar">
          <Link
            to="/new-order"
            state={{ mediatorId: mediator.id }}
            className="btn btn-primary preview-cta"
          >
            بدء طلب مع هذه الوسيطة
          </Link>
        </div>

        {showItems && (
          <div className="stagnant-modal-backdrop" onClick={() => setShowItems(false)}>
            <div className="stagnant-modal wide" onClick={(e) => e.stopPropagation()}>
              <h3>القطع المعروضة للبيع</h3>

              {listedItems.length === 0 ? (
                <p className="service-description">لا توجد قطع معروضة حاليًا.</p>
              ) : (
                listedItems.map((item) => (
                  <div className="stagnant-item" key={item.id}>
                    <div className="stagnant-item-row">
                      <div
                        className={`stagnant-item-icon ${
                          item.category === "أحذية" ? "cat-shoes" : "cat-clothes"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="stagnant-item-info">
                        <div className="stagnant-item-name">{item.name}</div>
                        <div className="stagnant-item-meta">الفئة: {item.category}</div>
                      </div>
                      <div className="stagnant-item-price">{item.price} ₪</div>
                    </div>
                  </div>
                ))
              )}

              <div className="stagnant-modal-actions">
                <button type="button" className="stagnant-btn outline" onClick={() => setShowItems(false)}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}