import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStores } from "../api";
import { STAGNANT_CATEGORIES as CATEGORIES, loadListedItems, reserveItem } from "../stagnantItemsStore";

// صفحة كاملة: القطع المعروضة للبيع عند وسيطة معيّنة — الزبونة بتقدر تطلب القطعة من هون.
// القطع والحجز مؤقتًا بالمتصفح (localStorage) لحد ما يجهز مسار للقطع بالباك اند.

export default function MediatorItems() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ===== الوسيطة =====
  const [mediator, setMediator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getStores()
      .then((list) => {
        if (!cancelled) setMediator(list.find((m) => String(m.id) === String(id)) || null);
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

  // ===== القطع المعروضة =====
  const [items, setItems] = useState(() => loadListedItems(id));
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const visibleItems = useMemo(() => {
    const term = searchTerm.trim();
    return items.filter((item) => {
      if (term && !item.name.includes(term)) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      return true;
    });
  }, [items, searchTerm, categoryFilter]);

  // ===== طلب قطعة =====
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState("");

  const confirmOrder = () => {
    if (!selectedItem || !mediator) return;

    // بنحجز القطعة أول شي، ولو انحجزت قبل (زبونة ثانية) بنبلّغ الزبونة
    const reserved = reserveItem(id, selectedItem.id);
    if (!reserved) {
      setItems(loadListedItems(id));
      setSelectedItem(null);
      setMessage("عذرًا، هاي القطعة ما عادت متاحة.");
      return;
    }

    // نفس شكل الطلبات الموجودة بصفحة "طلباتي"
    const newOrder = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      type: "active",
      price: String(selectedItem.price),
      store: mediator.name,
      mediatorId: mediator.id,
      itemsCount: 1,
      date: new Date().toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      statusLabel: "تم الطلب",
      updatedAt: Date.now(),
      currentStepIndex: 0,
    };
    const existing = JSON.parse(localStorage.getItem("wasata_new_orders")) || [];
    localStorage.setItem("wasata_new_orders", JSON.stringify([newOrder, ...existing]));

    navigate("/my-orders");
  };

  const topbar = (
    <div className="preview-topbar">
      <Link to={`/mediators/${id}`} className="back-link">
        ‹ عودة
      </Link>
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
          <p className="explore-loading">جاري التحميل...</p>
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
            <h3>{error ? "تعذر تحميل الصفحة" : "ما لقينا هاي الوسيطة"}</h3>
            <p>{error || "يمكن الوسيطة مش موجودة أو تم حذفها."}</p>
            <Link to="/explore-mediators" className="btn btn-outline">
              الرجوع لاستكشاف الوسيطات
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const canOrder = mediator.acceptingOrders;

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        {topbar}

        <div className="items-page-wrap">
          <div className="dashboard-welcome">
            <h1>القطع المعروضة</h1>
            <p>القطع المعروضة للبيع عند {mediator.name}. اختاري القطعة اللي عجبتك واطلبيها.</p>
          </div>

          {message && <div className="stagnant-form-error">{message}</div>}

          {!canOrder && (
            <div className="stagnant-form-error">هاي الوسيطة غير متاحة حاليًا، ما بتقدري تطلبي منها هلأ.</div>
          )}

          <div className="stagnant-card stagnant-toolbar">
            <input
              type="text"
              className="stagnant-search"
              placeholder="ابحثي باسم القطعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="stagnant-sort"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="الفئة"
            >
              <option value="">كل الفئات</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="stagnant-list-head">
            <h2>القطع المتوفرة</h2>
            <span className="stagnant-count">{visibleItems.length} قطع</span>
          </div>

          {visibleItems.length === 0 ? (
            <div className="orders-empty-state">
              <p>{items.length === 0 ? "لا توجد قطع معروضة حاليًا" : "لا توجد قطع مطابقة"}</p>
              <span>
                {items.length === 0
                  ? "ارجعي لاحقًا، الوسيطة ممكن تضيف قطع جديدة."
                  : "جربي كلمة بحث ثانية أو غيّري الفئة."}
              </span>
            </div>
          ) : (
            <div className="shop-grid">
              {visibleItems.map((item) => (
                <div className="shop-card" key={item.id}>
                  <div className={`shop-card-icon ${item.category === "أحذية" ? "cat-shoes" : "cat-clothes"}`}>
                    {item.icon}
                  </div>
                  <div className="shop-card-name">{item.name}</div>
                  <div className="shop-card-meta">الفئة: {item.category}</div>
                  <div className="shop-card-price">{item.price} ₪</div>
                  <button
                    type="button"
                    className="btn btn-primary shop-card-btn"
                    disabled={!canOrder}
                    onClick={() => {
                      setMessage("");
                      setSelectedItem(item);
                    }}
                  >
                    {canOrder ? "اطلبي القطعة" : "غير متاحة الآن"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تأكيد الطلب */}
        {selectedItem && (
          <div className="stagnant-modal-backdrop" onClick={() => setSelectedItem(null)}>
            <div className="stagnant-modal" onClick={(e) => e.stopPropagation()}>
              <h3>تأكيد طلب القطعة</h3>

              <div className="review-row">
                <span>القطعة</span>
                <span>{selectedItem.name}</span>
              </div>
              <div className="review-row">
                <span>الوسيطة</span>
                <span>{mediator.name}</span>
              </div>
              <div className="review-row review-total">
                <span>السعر</span>
                <span>{selectedItem.price} ₪</span>
              </div>
              <p className="review-payment-note">
                🔒 لن يتم خصم أي مبلغ الآن، الدفع يتم بعد تأكيد الوسيطة طلبك.
              </p>

              <div className="stagnant-modal-actions">
                <button type="button" className="btn btn-primary shop-card-btn" onClick={confirmOrder}>
                  تأكيد الطلب
                </button>
                <button type="button" className="stagnant-btn outline" onClick={() => setSelectedItem(null)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}