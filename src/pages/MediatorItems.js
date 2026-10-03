import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { getStores, getStoreProfile, getStoreStockItems, reserveStockItem } from "../api";
import { STAGNANT_CATEGORIES as CATEGORIES } from "../stagnantItemsStore";
import { getCurrentUserId, saveStockOrder } from "../utils/stockOrders";
import { useAuth } from "../context/AuthContext";
import { zoneFeeFor, feeLabel } from "../utils/deliveryZones";

// صفحة كاملة: القطع المعروضة للبيع عند وسيطة معيّنة — الزبونة بتقدر تطلب القطعة من هون.
// القطع والحجز مؤقتًا بالمتصفح (localStorage) لحد ما يجهز مسار للقطع بالباك اند.

export default function MediatorItems() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // الوسيطة (broker) بتشوف هاي الصفحة بوضع المعاينة لصفحتها: بدون زر طلب
  const { role } = useAuth();
  const isOwnerPreview = role === "broker";

  // زر عودة: بيرجع للصفحة اللي قبل فعلًا (مش رابط ثابت للملف الشخصي — هيك ما بنضل ندور بين الملف والقطع)
  // وإذا فتحت الصفحة مباشرة (ما في صفحة قبل) بنرجعها للملف الشخصي للوسيطة
  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(isOwnerPreview ? "/mediator-profile" : `/mediators/${id}`, { replace: true });
  };

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
  const [items, setItems] = useState([]);
  useEffect(() => {
    getStoreStockItems(id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [id]);
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

  // ===== طريقة الاستلام (نفس خيارات الطلبات العادية) =====
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // "home" | "pickup"
  const [homeAddress, setHomeAddress] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState("");
  const [orderError, setOrderError] = useState("");
  const [storeInfo, setStoreInfo] = useState(null); // نقطة الاستلام + رسوم التوصيل من ملف الوسيطة

  useEffect(() => {
    getStoreProfile(id)
      .then(({ store }) => setStoreInfo(store))
      .catch(() => setStoreInfo(null));
  }, [id]);

  // رسوم التوصيل: إذا الوسيطة حددت أسعار حسب المنطقة بنستخدمها، وإلا بنرجع لسعر عام قديم (إذا موجود)
  const zones = storeInfo?.deliveryZones?.length ? storeInfo.deliveryZones : mediator?.deliveryZones || [];
  const hasZones = zones.length > 0;
  const flatFee = storeInfo?.deliveryFee ?? mediator?.deliveryFee ?? null;
  const deliveryFee = hasZones ? zoneFeeFor(zones, deliveryRegion) : flatFee;
  const homeFeeLabel = feeLabel(deliveryFee);
  const optionFeeLabel = hasZones && !deliveryRegion ? "حسب المنطقة" : homeFeeLabel;
  const pickupLocation = storeInfo?.pickupLocation || "";
  const pickupAvailable = mediator?.pickupAvailable ?? storeInfo?.pickupAvailable ?? true;

  // لو الوسيطة ما عندها نقطة استلام، بنحوّل الاختيار للتوصيل للمنزل
  useEffect(() => {
    if (!pickupAvailable && deliveryMethod === "pickup") setDeliveryMethod("home");
  }, [pickupAvailable, deliveryMethod]);

  const openOrderModal = (item) => {
    setOrderError("");
    setMessage("");
    setSelectedItem(item);
  };

  const [reserving, setReserving] = useState(false);

  const confirmOrder = async () => {
    if (!selectedItem || !mediator) return;

    if (deliveryMethod === "home" && hasZones && !deliveryRegion) {
      setOrderError("اختاري منطقتك عشان نحسب رسوم التوصيل.");
      return;
    }
    if (deliveryMethod === "home" && (!homeAddress.trim() || !homePhone.trim())) {
      setOrderError("عبّي العنوان ورقم التواصل قبل تأكيد الطلب.");
      return;
    }

    setOrderError("");
    setReserving(true);
    try {
      const isHome = deliveryMethod === "home";
      const delivery = {
        method: isHome ? "home_delivery" : "pickup",
        address: isHome ? homeAddress.trim() : "",
        contactPhone: isHome ? homePhone.trim() : "",
        region: isHome && hasZones ? deliveryRegion : "",
        fee: isHome ? deliveryFee : null,
        pickupLocation: !isHome ? pickupLocation || mediator.city || "" : "",
        note: orderNote.trim(),
      };
      // بنحجز القطعة من الباك اند — لو انحجزت قبل (زبونة ثانية) بيرجع خطأ ومنبلّغ الزبونة
const reserved = await reserveStockItem(selectedItem.id, {        deliveryMethod: delivery.method,
        address: delivery.address,
        contactPhone: delivery.contactPhone,
        customerNote: delivery.note,
        deliveryRegion: delivery.region,
      });
      // بنسجّل الطلب عند الزبونة ليظهر مع طلباتها النشطة، وبنفتح شاشة تفاصيله
saveStockOrder(getCurrentUserId(), {
  item: selectedItem,
  mediator,
  delivery,
  orderId: reserved?.orderId ?? null,
});      const orderedId = selectedItem.id;
      setSelectedItem(null);
      setOrderNote("");
      navigate(`/stock-orders/${orderedId}`, { state: { justOrdered: true } });
    } catch (err) {
      getStoreStockItems(id)
        .then(setItems)
        .catch(() => {});
      setSelectedItem(null);
      setMessage(err.message || "عذرًا، هاي القطعة ما عادت متاحة.");
    } finally {
      setReserving(false);
    }
  };

  const topbar = (
    <div className="preview-topbar">
      <button type="button" className="back-link" onClick={goBack}>
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

          {isOwnerPreview && (
            <div className="order-success-banner">👁 هاي معاينة لصفحتك كما بتظهر للزبائن (بدون زر الطلب).</div>
          )}

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
                        <div className="shop-list">
              {visibleItems.map((item) => (
                <div className="stagnant-item" key={item.id}>
                  <div className="stagnant-item-row">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="stagnant-item-thumb" />
                    ) : (
                      <div className={`stagnant-item-icon ${item.category === "أحذية" ? "cat-shoes" : "cat-clothes"}`}>
                        {item.icon}
                      </div>
                    )}

                    <div className="stagnant-item-info">
                      <div className="stagnant-item-name">{item.name}</div>
                      <div className="stagnant-item-meta">
                        <span>الفئة: {item.category}</span>
                        {item.size && <span>مقاس: {item.size}</span>}
                        {item.color && <span>اللون: {item.color}</span>}
                      </div>
                    </div>

                    <div className="stagnant-item-price">{item.price} ₪</div>

                    {!isOwnerPreview && (
                      <div className="stagnant-item-side">
                        <button
                          type="button"
                          className="stagnant-btn primary"
                          disabled={!canOrder}
                          onClick={() => openOrderModal(item)}
                        >
                          {canOrder ? "اطلبي القطعة" : "غير متاحة الآن"}
                        </button>
                      </div>
                    )}
                  </div>
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
              <div className="review-row">
                <span>السعر</span>
                <span>{selectedItem.price} ₪</span>
              </div>
              {deliveryMethod === "home" && homeFeeLabel && (
                <div className="review-row">
                  <span>رسوم التوصيل{hasZones && deliveryRegion ? ` (${deliveryRegion})` : ""}</span>
                  <span>{homeFeeLabel}</span>
                </div>
              )}
              <div className="review-row review-total">
                <span>الإجمالي</span>
                <span>{selectedItem.price + (deliveryMethod === "home" && deliveryFee ? deliveryFee : 0)} ₪</span>
              </div>

              <div className="review-side-header" style={{ marginTop: "16px" }}>
                <span>طريقة استلام الطلب</span>
              </div>
              <label className="delivery-option">
                {optionFeeLabel && (
                  <span className={`delivery-fee-tag ${deliveryFee === 0 && !(hasZones && !deliveryRegion) ? "free" : ""}`}>
                    {optionFeeLabel}
                  </span>
                )}
                <span>التوصيل إلى المنزل</span>
                <input
                  type="radio"
                  name="stock-delivery"
                  checked={deliveryMethod === "home"}
                  onChange={() => {
                    setDeliveryMethod("home");
                    setOrderError("");
                  }}
                />
              </label>

              {deliveryMethod === "home" && (
                <div className="delivery-home-fields">
                  {hasZones && (
                    <label>
                      <span>المنطقة</span>
                      <select
                        value={deliveryRegion}
                        onChange={(e) => {
                          setDeliveryRegion(e.target.value);
                          setOrderError("");
                        }}
                      >
                        <option value="">اختاري منطقتك</option>
                        {zones.map((z) => (
                          <option key={z.region} value={z.region}>
                            {z.region} — {z.fee > 0 ? `${z.fee} ₪` : "مجاني"}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    <span>العنوان</span>
                    <input
                      type="text"
                      placeholder="المدينة، الحي، أقرب معلم..."
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>رقم للتواصل</span>
                    <input
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={homePhone}
                      onChange={(e) => setHomePhone(e.target.value)}
                    />
                  </label>
                </div>
              )}

              <label className="delivery-option" style={!pickupAvailable ? { opacity: 0.55 } : undefined}>
                <span className="delivery-fee-tag free">مجاني</span>
                <span>الاستلام من نقطة استلام</span>
                <input
                  type="radio"
                  name="stock-delivery"
                  checked={deliveryMethod === "pickup"}
                  disabled={!pickupAvailable}
                  onChange={() => {
                    setDeliveryMethod("pickup");
                    setOrderError("");
                  }}
                />
              </label>

              {!pickupAvailable && (
                <p className="delivery-pickup-note">هاي الوسيطة ما حدّدت نقطة استلام بعد.</p>
              )}
              {pickupAvailable && deliveryMethod === "pickup" && (
                <p className="delivery-pickup-note">
                  📍 نقطة الاستلام: {pickupLocation || mediator.city || "غير محددة، تواصلي مع الوسيطة"}
                </p>
              )}

              <textarea
                rows={2}
                placeholder="ملاحظة للوسيطة (اختياري)"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                style={{ width: "100%", marginTop: "10px", boxSizing: "border-box" }}
              ></textarea>

              <p className="review-payment-note">
                🔒 لن يتم خصم أي مبلغ الآن، الدفع يتم بعد تأكيد الوسيطة طلبك.
              </p>
              {orderError && <div className="stagnant-form-error">{orderError}</div>}

              <div className="stagnant-modal-actions">
                <button type="button" className="btn btn-primary shop-card-btn" onClick={confirmOrder} disabled={reserving}>
                  {reserving ? "جاري التأكيد..." : "تأكيد الطلب"}
                </button>
                <button type="button" className="stagnant-btn outline" onClick={() => setSelectedItem(null)} disabled={reserving}>
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