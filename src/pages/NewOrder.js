import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getStores, getStoreProfile, createOrder } from "../api";
import { zoneFeeFor, feeLabel } from "../utils/deliveryZones";

// صورة الوسيطة — وإذا ما في صورة أو فشل تحميلها بنعرض أول حرف من الاسم
function MediatorAvatar({ mediator }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [mediator.image]);

  return (
    <div className="mediator-pick-avatar">
      {mediator.image && !failed ? (
        <img src={mediator.image} alt={mediator.name} onError={() => setFailed(true)} />
      ) : (
        (mediator.name || "و").charAt(0)
      )}
    </div>
  );
}

// توحيد النص العربي للبحث
function normalizeSearch(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedId = location.state?.mediatorId ?? null;

  const [step, setStep] = useState("products"); // "products" | "mediator" | "review"

  // ===== مرحلة ١: إضافة المنتجات =====
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [products, setProducts] = useState([]);
  const [openNotesId, setOpenNotesId] = useState(null);

  const emptyForm = { name: "", url: "", color: "", size: "", image: null, imagePreview: null, qty: 1 };
  const [form, setForm] = useState(emptyForm);

  const handleFormImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }));
  };

  // الباك اند بيتحقق إنه رابط المنتج URL صحيح، فبنتحقق قبله. لو الرابط بدون https:// بنضيفه.
  const normalizeProductUrl = (raw) => {
    let value = (raw || "").trim();
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    try {
      const parsed = new URL(value);
      if (!parsed.hostname.includes(".")) return null;
      return parsed.href;
    } catch (e) {
      return null;
    }
  };

  const addProduct = () => {
    if (!form.name.trim() || !form.url.trim()) {
      setError("يرجى إدخال اسم المنتج ورابطه.");
      return;
    }
    const cleanUrl = normalizeProductUrl(form.url);
    if (!cleanUrl) {
      setError("رابط المنتج غير صحيح. انسخي الرابط كامل من موقع SHEIN (مثال: https://www.shein.com/...).");
      return;
    }
    // رابط صفحة التحقق (captcha) من SHEIN مش رابط منتج
    if (cleanUrl.includes("/risk/challenge")) {
      setError("هاد رابط صفحة تحقق من SHEIN مش رابط المنتج. افتحي المنتج وانسخي رابطه من شريط العنوان.");
      return;
    }
    setError("");
    setProducts((prev) => [...prev, { id: Date.now() + Math.random(), notes: "", ...form, url: cleanUrl }]);
    setForm(emptyForm);
    showToast("تمت إضافة المنتج إلى الطلب");
  };

  // ===== مرحلة ٢: اختيار الوسيطة =====
  const [mediators, setMediators] = useState([]);
  const [loadingMediators, setLoadingMediators] = useState(true);
  const [mediatorsError, setMediatorsError] = useState("");

  const loadMediators = () => {
    setLoadingMediators(true);
    setMediatorsError("");
    getStores()
      .then((list) => setMediators(list))
      .catch((err) => setMediatorsError(err.message || "تعذر جلب قائمة الوسيطات"))
      .finally(() => setLoadingMediators(false));
  };

  useEffect(() => {
    loadMediators();
  }, []);

  const [mediatorSearch, setMediatorSearch] = useState("");

  const rankedMediators = useMemo(() => {
    const q = normalizeSearch(mediatorSearch);
    const list = q
      ? mediators.filter((m) =>
          [m.name, m.ownerName, m.city].some((v) => normalizeSearch(v).includes(q))
        )
      : [...mediators];

    return list.sort((a, b) => {
      if (a.acceptingOrders !== b.acceptingOrders) return a.acceptingOrders ? -1 : 1;
      const diff = (Number(b.completedOrders) || 0) - (Number(a.completedOrders) || 0);
      if (diff !== 0) return diff;
      return String(a.name || "").localeCompare(String(b.name || ""), "ar");
    });
  }, [mediators, mediatorSearch]);

  const [selectedMediatorId, setSelectedMediatorId] = useState(preselectedId);
  const selectedMediator = mediators.find((m) => m.id === selectedMediatorId && m.acceptingOrders);
  const hasChosenMediator = preselectedId !== null && selectedMediator?.id === preselectedId;

  const [profile, setProfile] = useState({ services: [], store: null, loading: false });
  useEffect(() => {
    if (selectedMediatorId === null) return undefined;
    let cancelled = false;
    setProfile({ services: [], store: null, loading: true });
    getStoreProfile(selectedMediatorId)
      .then(({ store, services }) => {
        if (cancelled) return;
        const available = services.filter((sv) => sv.available);
        setProfile({ services: available, store, loading: false });
        setSelectedServiceId(available.length > 0 ? String(available[0].id) : "");
      })
      .catch(() => {
        if (!cancelled) setProfile({ services: [], store: null, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMediatorId]);

  // ===== مرحلة ٣: مراجعة الطلب =====
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // "home" | "pickup"
  const [homeAddress, setHomeAddress] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState("");
  const [notesToMediator, setNotesToMediator] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pickupUnavailable, setPickupUnavailable] = useState(false);

  const translateOrderError = (message) => {
    if (!message) return "";
    if (/pickup location/i.test(message)) {
      return "هاي الوسيطة ما حدّدت نقطة استلام بعد، فما بتقدري تختاري \"الاستلام من نقطة استلام\" معها حاليًا. جربي التوصيل إلى المنزل إذا كان متوفر، أو تواصلي مع الوسيطة مباشرة.";
    }
    if (/product_url/i.test(message)) {
      return "رابط أحد المنتجات غير صحيح. ارجعي لخطوة المنتجات وتأكدي إنه رابط كامل من SHEIN.";
    }
    if (/delivery (area|region)/i.test(message)) {
      return "لازم تختاري منطقة التوصيل عشان تكمّلي طلب التوصيل إلى المنزل.";
    }
    return message;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const updateQty = (id, delta) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p))
    );
  };
  const removeProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));
  const updateNotes = (id, notes) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)));
  const clearAll = () => setProducts([]);

  const totalItems = products.length;
  const totalPieces = products.reduce((sum, p) => sum + p.qty, 0);

  // ===== خيارات التوصيل الحقيقية للوسيطة المختارة =====
  const zones = profile.store?.deliveryZones?.length
    ? profile.store.deliveryZones
    : selectedMediator?.deliveryZones || [];
  const hasZones = zones.length > 0;
  const flatFee = profile.store?.deliveryFee ?? selectedMediator?.deliveryFee ?? null;
  const deliveryFee = hasZones ? zoneFeeFor(zones, deliveryRegion) : flatFee;
  const homeFeeLabel = feeLabel(deliveryFee);
  const optionFeeLabel = hasZones && !deliveryRegion ? "حسب المنطقة" : homeFeeLabel;

  useEffect(() => {
    setDeliveryRegion("");
  }, [selectedMediatorId]);

  const pickupLocation = profile.store?.pickupLocation || "";
  const pickupAvailable = selectedMediator?.pickupAvailable ?? profile.store?.pickupAvailable ?? true;

  useEffect(() => {
    if (!pickupAvailable && deliveryMethod === "pickup") setDeliveryMethod("home");
  }, [pickupAvailable, deliveryMethod]);

  const commissionText = (m) =>
    m.commission !== null && m.commission !== "" && Number.isFinite(parseFloat(m.commission))
      ? `العمولة ${parseFloat(m.commission)}%`
      : null;

  const handleFinalSubmit = async () => {
    if (!selectedMediator || submitting) return;

    if (!selectedServiceId) {
      setSubmitError("هاي الوسيطة ما ضافت أي خدمة، ما بتقدري تطلبي منها حاليًا.");
      return;
    }

    if (deliveryMethod === "home" && hasZones && !deliveryRegion) {
      setSubmitError("اختاري منطقتك عشان نحسب رسوم التوصيل.");
      return;
    }

    if (deliveryMethod === "home" && (!homeAddress.trim() || !homePhone.trim())) {
      setSubmitError("عبّي العنوان ورقم التواصل قبل إرسال الطلب.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const customerNote = notesToMediator.trim();

      await createOrder({
        storeId: selectedMediator.id,
        deliveryMethod: deliveryMethod === "home" ? "home_delivery" : "pickup",
        deliveryRegion: deliveryMethod === "home" && hasZones ? deliveryRegion : undefined,
        address: deliveryMethod === "home" ? homeAddress.trim() : undefined,
        contactPhone: deliveryMethod === "home" ? homePhone.trim() : undefined,
        customerNote,
        items: products.map((p) => ({
          serviceListingId: selectedServiceId,
          quantity: p.qty,
          productName: p.name,
          productUrl: p.url,
          productImage: p.image || undefined,
          color: p.color || undefined,
          size: p.size || undefined,
          itemNote: p.notes || undefined,
        })),
      });
      navigate("/my-orders");
    } catch (err) {
     if (err.code === "PICKUP_NOT_AVAILABLE" || /pickup location/i.test(err.message || "")) {
        setPickupUnavailable(true);
      }
      setSubmitError(translateOrderError(err.message) || "تعذر إرسال الطلب، حاولي مرة ثانية.");
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle =
    step === "products" ? "طلب جديد" : step === "mediator" ? "اختيار الوسيطة" : "مراجعة الطلب";

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-welcome">
        <h1>{pageTitle}</h1>
        {step === "products" && (
          <p>أضيفي منتجاتك من SHEIN واحدًا تلو الآخر: اسم المنتج، رابطه، ولونه ومقاسه إذا حبيتي.</p>
        )}
      </div>

      {/* ============ المرحلة ١: إضافة المنتجات ============ */}
      {step === "products" && (
        <>
          <div className="new-order-card">
            <label className="new-order-label">اسم المنتج *</label>
            <input
              type="text"
              placeholder="مثال: فستان أسود قصير"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={error ? "input-error" : ""}
            />

            <label className="new-order-label" style={{ marginTop: "14px" }}>رابط المنتج *</label>
            <input
              type="text"
              placeholder="https://www.shein.com/..."
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />

            <div className="form-row" style={{ marginTop: "14px" }}>
              <div>
                <label className="new-order-label">اللون</label>
                <input
                  type="text"
                  placeholder="مثال: أسود"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
              </div>
              <div>
                <label className="new-order-label">المقاس</label>
                <input
                  type="text"
                  placeholder="مثال: M"
                  value={form.size}
                  onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                />
              </div>
            </div>

            <label className="new-order-label" style={{ marginTop: "14px" }}>صورة المنتج (اختياري)</label>
            <input type="file" accept="image/*" onChange={handleFormImage} />
            {form.imagePreview && (
              <img src={form.imagePreview} alt="معاينة" style={{ width: "60px", height: "60px", borderRadius: "8px", marginTop: "8px", objectFit: "cover" }} />
            )}

            {error && <p className="new-order-error">⚠ {error}</p>}

            <button type="button" className="btn btn-primary fetch-products-btn" onClick={addProduct}>
              + إضافة المنتج للطلب
            </button>

            <div className="new-order-store-badge">
              <span>المتجر المدعوم</span>
              <span className="shein-badge">● SHEIN</span>
            </div>
          </div>

          {products.length > 0 ? (
            <>
              <div className="added-products-header">
                <h2>المنتجات المضافة ({totalItems})</h2>
                <button type="button" className="clear-all-link" onClick={clearAll}>
                  مسح الكل
                </button>
              </div>

              {products.map((p) => (
                <div className="product-line-card" key={p.id}>
                  <div className="product-line-image">
                    {p.imagePreview ? <img src={p.imagePreview} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} /> : "🖼"}
                  </div>
                  <div className="product-line-info">
                    <div className="product-line-title">{p.name}</div>
                    <div className="product-line-attrs">
                      {p.size && <span>المقاس: {p.size}</span>}
                      {p.color && <span>اللون: {p.color}</span>}
                    </div>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="order-item-link" style={{ display: "block", marginBottom: "8px" }}>
                        🔗 رابط المنتج
                      </a>
                    )}
                    {openNotesId === p.id ? (
                      <input
                        type="text"
                        className="product-line-notes-input"
                        placeholder="اكتبي ملاحظاتك..."
                        value={p.notes}
                        onChange={(e) => updateNotes(p.id, e.target.value)}
                        onBlur={() => setOpenNotesId(null)}
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="product-line-notes-btn"
                        onClick={() => setOpenNotesId(p.id)}
                      >
                        ✎ {p.notes ? p.notes : "إضافة ملاحظات"}
                      </button>
                    )}
                    <div className="product-line-qty">
                      <button type="button" onClick={() => updateQty(p.id, 1)}>+</button>
                      <span>{p.qty}</span>
                      <button type="button" onClick={() => updateQty(p.id, -1)}>-</button>
                      <span className="qty-label">الكمية</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="product-line-delete"
                    onClick={() => removeProduct(p.id)}
                    aria-label="حذف"
                  >
                    🗑
                  </button>
                </div>
              ))}

              <div className="order-summary-bar">
                <div className="order-summary-note">الأسعار تقديرية ولا تشمل رسوم الخدمة</div>
                <div className="order-summary-stats">
                  <div>
                    <div className="summary-value">{totalItems}</div>
                    <div className="summary-label">عدد المنتجات</div>
                  </div>
                  <div>
                    <div className="summary-value">{totalPieces}</div>
                    <div className="summary-label">إجمالي القطع</div>
                  </div>
                </div>
              </div>

              <div className="new-order-final-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={preselectedId !== null && loadingMediators}
                  onClick={() => setStep(hasChosenMediator ? "review" : "mediator")}
                >
                  {preselectedId !== null && loadingMediators ? "جاري التحميل..." : "متابعة الطلب →"}
                </button>
                <Link to="/my-orders" className="cancel-link">
                  إلغاء
                </Link>
              </div>
            </>
          ) : (
            <div className="new-order-empty-state">
              <div className="empty-icon">🛍</div>
              <h3>ابدئي بإضافة منتجاتك</h3>
              <p>ألصقي رابط منتج واحد أو عدة روابط من SHEIN لبدء إنشاء طلبك.</p>
            </div>
          )}
        </>
      )}

      {/* ============ المرحلة ٢: اختيار الوسيطة ============ */}
      {step === "mediator" && (
        <>
          {loadingMediators && <p className="explore-loading">جاري تحميل الوسيطات...</p>}

          {!loadingMediators && mediatorsError && (
            <div className="explore-empty-state">
              <div className="empty-icon">⚠️</div>
              <h3>تعذر تحميل الوسيطات</h3>
              <p>{mediatorsError}</p>
              <button type="button" className="btn btn-outline" onClick={loadMediators}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loadingMediators && !mediatorsError && mediators.length === 0 && (
            <div className="explore-empty-state">
              <div className="empty-icon">🔍</div>
              <h3>ما في وسيطات حاليًا</h3>
              <p>جربي مرة ثانية بعد شوي.</p>
            </div>
          )}

          {!loadingMediators && !mediatorsError && mediators.length > 0 && (
            <input
              type="text"
              className="mediator-pick-search"
              placeholder="ابحثي باسم الوسيطة أو المدينة..."
              value={mediatorSearch}
              onChange={(e) => setMediatorSearch(e.target.value)}
            />
          )}

          {!loadingMediators && !mediatorsError && mediators.length > 0 && rankedMediators.length === 0 && (
            <div className="explore-empty-state">
              <div className="empty-icon">🔍</div>
              <h3>ما في وسيطات مطابقة</h3>
              <p>جربي اسم أو مدينة تانية.</p>
            </div>
          )}

          {!loadingMediators && !mediatorsError && rankedMediators.length > 0 && (
            <div className="mediator-pick-grid">
              {rankedMediators.map((m) => (
                <div className="mediator-pick-card" key={m.id}>
                  <div className="mediator-pick-top">
                    <span className={`mediator-pick-tag ${m.acceptingOrders ? "" : "off"}`}>
                      {m.acceptingOrders ? "● تستقبل طلبات" : "● غير متاحة"}
                    </span>
                    <MediatorAvatar mediator={m} />
                  </div>
                  <div className="mediator-pick-name">{m.name}</div>
                  {m.city && <div className="mediator-pick-loc">📍 {m.city}</div>}
                  <div className="mediator-pick-stats">
                    <span>{m.completedOrders} طلب مكتمل</span>
                    {commissionText(m) && <span>{commissionText(m)}</span>}
                  </div>
                  <button
                    type="button"
                    className={`btn ${selectedMediatorId === m.id ? "btn-primary" : "btn-outline"} mediator-pick-btn`}
                    disabled={!m.acceptingOrders}
                    onClick={() => setSelectedMediatorId(m.id)}
                  >
                    {!m.acceptingOrders
                      ? "غير متاحة الآن"
                      : selectedMediatorId === m.id
                        ? "✓ تم الاختيار"
                        : "اختيار"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mediator-pick-bar">
            {selectedMediator ? (
              <div className="mediator-pick-bar-selected">
                <MediatorAvatar mediator={selectedMediator} />
                <div>
                  <div className="mediator-pick-bar-name">{selectedMediator.name}</div>
                  {commissionText(selectedMediator) && (
                    <div className="mediator-pick-bar-meta">{commissionText(selectedMediator)}</div>
                  )}
                </div>
              </div>
            ) : (
              <span className="mediator-pick-bar-hint">اختاري وسيطة للمتابعة</span>
            )}
            <div className="mediator-pick-bar-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedMediator}
                onClick={() => setStep("review")}
              >
                متابعة إلى مراجعة الطلب →
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setStep("products")}>
                العودة للمنتجات
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ المرحلة ٣: مراجعة الطلب وإرساله ============ */}
      {step === "review" && selectedMediator && (
        <div className="review-order-layout">
          {/* العمود الأول (اليمين): الوسيطة + طريقة الاستلام */}
          <div className="review-order-col">
            <div className="review-side-card">
              <div className="review-side-header">
                <span>الوسيطة</span>
                {!hasChosenMediator && (
                  <button type="button" className="change-mediator-link" onClick={() => setStep("mediator")}>
                    تغيير الوسيطة
                  </button>
                )}
              </div>
              <div className="review-mediator-row">
                <MediatorAvatar mediator={selectedMediator} />
                <div>
                  <div className="mediator-pick-bar-name">{selectedMediator.name}</div>
                  <div className="mediator-pick-bar-meta">
                    {[selectedMediator.city && `📍 ${selectedMediator.city}`, commissionText(selectedMediator)]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </div>

              <div className="mediator-services-info">
                <span>خدمات الوسيطة</span>
                {profile.loading ? (
                  <span>جاري تحميل الخدمات...</span>
                ) : profile.services.length === 0 ? (
                  <span className="stagnant-form-error">هاي الوسيطة ما ضافت أي خدمة، ما بتقدري تطلبي منها حاليًا.</span>
                ) : (
                  <div className="mediator-services-chips">
                    {profile.services.map((sv) => (
                      <span key={sv.id} className="mediator-service-chip">
                        {sv.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="review-side-card">
              <div className="review-side-header">
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
                  name="delivery"
                  checked={deliveryMethod === "home"}
                  onChange={() => {
                    setDeliveryMethod("home");
                    setSubmitError("");
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
                          setSubmitError("");
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
                  name="delivery"
                  checked={deliveryMethod === "pickup"}
                  disabled={!pickupAvailable}
                  onChange={() => setDeliveryMethod("pickup")}
                />
              </label>

              {!pickupAvailable && (
                <p className="delivery-pickup-note">هاي الوسيطة ما حدّدت نقطة استلام بعد.</p>
              )}

              {pickupAvailable && deliveryMethod === "pickup" && (
                <p className="delivery-pickup-note">
                  📍 نقطة الاستلام:{" "}
                  {pickupLocation || selectedMediator.city || "غير محددة، تواصلي مع الوسيطة"}
                </p>
              )}
            </div>
          </div>

          {/* العمود الثاني (اليسار): الملاحظات + صندوق الإرسال */}
          <div className="review-order-col">
            <div className="review-side-card">
              <div className="review-side-header">
                <span>ملاحظات للوسيطة</span>
              </div>
              <textarea
                rows={4}
                placeholder="أضيفي أي ملاحظات مهمة حول الطلب"
                value={notesToMediator}
                onChange={(e) => setNotesToMediator(e.target.value)}
              ></textarea>
              <p className="review-notes-hint">اختياري — ستصل ملاحظاتك إلى الوسيطة مع الطلب.</p>
            </div>

            <div className="review-order-summary">
              <div className="review-row">
                <span>عدد المنتجات</span>
                <span>{totalItems} منتج ({totalPieces} قطعة)</span>
              </div>
              {deliveryMethod === "home" && homeFeeLabel && (
                <div className="review-row">
                  <span>رسوم التوصيل{hasZones && deliveryRegion ? ` (${deliveryRegion})` : ""}</span>
                  <span>{homeFeeLabel}</span>
                </div>
              )}
              <p className="review-disclaimer">
                ⚠ السعر بيتحدد من الوسيطة بعد ما توافق على طلبك، وبيوصلك إشعار فيه. رسوم التوصيل (إن وجدت) بتنضاف تلقائيًا للإجمالي.
              </p>

              {submitError && <div className="stagnant-form-error">{submitError}</div>}

              <button
                type="button"
                className="btn btn-primary review-submit-btn"
                onClick={handleFinalSubmit}
                disabled={submitting || (pickupUnavailable && deliveryMethod === "pickup")}
              >
                {submitting ? "جاري الإرسال..." : `إرسال الطلب إلى ${selectedMediator.name} →`}
              </button>
              <button
                type="button"
                className="btn btn-outline review-back-btn"
                onClick={() => setStep(hasChosenMediator ? "products" : "mediator")}
              >
                العودة
              </button>
              <p className="review-payment-note">
                🔒 لن يتم خصم أي مبلغ الآن، الدفع يتم بعد تأكيد الوسيطة استلام طلبك.
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="new-order-toast">✓ {toast}</div>}
    </DashboardLayout>
  );
}