import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getStores, getStoreProfile } from "../api";

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  // لو الزبونة جاية من "بدء طلب مع هذه الوسيطة" أو "اختيار الوسيطة" بنكون عارفين الوسيطة مسبقًا
  const preselectedId = location.state?.mediatorId ?? null;


  // مراحل الطلب: إضافة منتجات ← اختيار وسيطة ← مراجعة وإرسال
  const [step, setStep] = useState("products"); // "products" | "mediator" | "review"

  // ===== مرحلة ١: إضافة المنتجات =====
  const [activeTab, setActiveTab] = useState("links"); // "cart" | "links"
  const [cartLink, setCartLink] = useState("");
  const [linksText, setLinksText] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [products, setProducts] = useState([]);
  const [openNotesId, setOpenNotesId] = useState(null);

  // ===== مرحلة ٢: اختيار الوسيطة =====
  // الوسيطات الحقيقية (نفس مصدر صفحة استكشاف الوسيطات)
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

  const [selectedMediatorId, setSelectedMediatorId] = useState(preselectedId);
  // بنقبل بس وسيطة مستقبلة للطلبات
  const selectedMediator = mediators.find((m) => m.id === selectedMediatorId && m.acceptingOrders);

  // الوسيطة كانت مختارة مسبقًا: بنتخطى مرحلة "اختيار الوسيطة" ونروح على المراجعة
  const hasChosenMediator = preselectedId !== null && selectedMediator?.id === preselectedId;

  // خدمات الوسيطة المختارة (جاية من بروفايل المتجر) — بنستخدمها لعرض الخدمات وخيار التوصيل
  const [profile, setProfile] = useState({ services: [], loading: false });
  useEffect(() => {
    if (selectedMediatorId === null) return undefined;
    let cancelled = false;
    setProfile({ services: [], loading: true });
    getStoreProfile(selectedMediatorId)
      .then(({ services }) => {
        if (!cancelled) setProfile({ services: services.filter((sv) => sv.available), loading: false });
      })
      .catch(() => {
        if (!cancelled) setProfile({ services: [], loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMediatorId]);

  // ===== مرحلة ٣: مراجعة الطلب =====
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // "home" | "pickup"
  const [notesToMediator, setNotesToMediator] = useState("");

  const isValidSheinLink = (url) => /^https?:\/\/.*shein\.com/i.test(url.trim());

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const addMockProduct = (sourceLabel) => {
    const newProduct = {
      id: Date.now() + Math.random(),
      title: `منتج من ${sourceLabel}`,
      size: "M",
      color: "غير محدد",
      price: Math.floor(Math.random() * (180 - 30 + 1)) + 30, // سعر تقديري وهمي — لسه بدون جلب حقيقي من SHEIN
      qty: 1,
      notes: "",
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const handleImportCart = () => {
    if (!isValidSheinLink(cartLink)) {
      setError("يرجى إدخال رابط سلة صحيح من SHEIN");
      return;
    }
    setError("");
    addMockProduct("السلة");
    showToast("تمت إضافة المنتجات إلى الطلب");
    setCartLink("");
  };

  const handleFetchLinks = () => {
    const links = linksText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (links.length === 0 || !links.every(isValidSheinLink)) {
      setError("يرجى إدخال روابط صحيحة من SHEIN");
      return;
    }
    setError("");
    links.forEach(() => addMockProduct("SHEIN"));
    showToast(`تمت إضافة ${links.length} منتجات إلى الطلب`);
    setLinksText("");
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
  const totalValue = products.reduce((sum, p) => sum + p.price * p.qty, 0);

  // التوصيل للمنزل متوفر بس إذا الوسيطة عندها خدمة توصيل (أيقونة الشاحنة) — والرسوم من الخدمة نفسها
  const deliveryService = profile.services.find((sv) => sv.icon === "truck");
  const homeDeliveryAvailable = !!deliveryService;
  const effectiveDeliveryMethod = homeDeliveryAvailable ? deliveryMethod : "pickup";
  const deliveryFeeAmount =
    deliveryService && deliveryService.feeType === "fixed" ? Number(deliveryService.feeValue) || 0 : 0;
  const deliveryFee = effectiveDeliveryMethod === "home" ? deliveryFeeAmount : 0;

  const deliveryTag = deliveryService
    ? deliveryService.feeType === "free"
      ? "مجاني"
      : deliveryService.feeType === "fixed"
        ? `${deliveryFeeAmount} ₪`
        : "حسب الوسيطة"
    : "غير متوفر";

  // العمولة الحقيقية للوسيطة (ممكن تكون فاضية إذا ما حددتها)
  const commissionRate =
    selectedMediator && selectedMediator.commission !== null && selectedMediator.commission !== ""
      ? parseFloat(selectedMediator.commission) || 0
      : null;
  const commissionValue = commissionRate !== null ? Math.round((totalValue * commissionRate) / 100) : 0;
  const commissionText = (m) =>
    m.commission !== null && m.commission !== "" && Number.isFinite(parseFloat(m.commission))
      ? `العمولة ${parseFloat(m.commission)}%`
      : null;
  const estimatedTotal = totalValue + commissionValue + deliveryFee;

  // إرسال الطلب النهائي — بيتحول لنفس تصميم كارت الطلب الموجود أصلًا بصفحة "طلباتي"
  const handleFinalSubmit = () => {
    const newOrder = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      type: "active",
      price: String(estimatedTotal),
      store: selectedMediator ? selectedMediator.name : "—",
      mediatorId: selectedMediator ? selectedMediator.id : null,
      itemsCount: totalPieces,
      date: new Date().toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      statusLabel: "تم الطلب",
      updatedAt: Date.now(), // وقت حقيقي — صفحة طلباتي بتحسب منه "منذ كذا" ديناميكيًا وقت العرض
      currentStepIndex: 0,
    };

    const existing = JSON.parse(localStorage.getItem("wasata_new_orders")) || [];
    localStorage.setItem("wasata_new_orders", JSON.stringify([newOrder, ...existing]));

    navigate("/my-orders");
  };

  const pageTitle =
    step === "products" ? "طلب جديد" : step === "mediator" ? "اختيار الوسيطة" : "مراجعة الطلب";

    return (
    <DashboardLayout role="customer">

        <div className="dashboard-welcome">
          <h1>{pageTitle}</h1>
          {step === "products" && (
            <p>ألصقي رابط منتج واحد أو عدة روابط من SHEIN لبدء طلب جديد.</p>
          )}
        </div>

        {/* ============ المرحلة ١: إضافة المنتجات ============ */}
        {step === "products" && (
          <>
            <div className="new-order-card">
              <div className="new-order-tabs">
                <button
                  type="button"
                  className={`new-order-tab ${activeTab === "cart" ? "active" : ""}`}
                  onClick={() => switchTab("cart")}
                >
                  🛍 سلة
                </button>
                <button
                  type="button"
                  className={`new-order-tab ${activeTab === "links" ? "active" : ""}`}
                  onClick={() => switchTab("links")}
                >
                  ▦ الروابط
                </button>
              </div>

              {activeTab === "cart" && (
                <div className="new-order-panel">
                  <label className="new-order-label">رابط سلة SHEIN</label>
                  <div className="cart-link-row">
                    <button type="button" className="btn btn-primary" onClick={handleImportCart}>
                      استيراد السلة →
                    </button>
                    <input
                      type="text"
                      placeholder="https://www.shein.com/cart/..."
                      value={cartLink}
                      onChange={(e) => setCartLink(e.target.value)}
                      className={error ? "input-error" : ""}
                    />
                  </div>
                  <p className="new-order-hint">سيتم إضافة المنتجات المتاحة من السلة إلى طلبك.</p>
                </div>
              )}

              {activeTab === "links" && (
                <div className="new-order-panel">
                  <label className="new-order-label">روابط المنتجات</label>
                  <textarea
                    rows={5}
                    placeholder="https://www.shein.com/..."
                    value={linksText}
                    onChange={(e) => setLinksText(e.target.value)}
                    className={error ? "input-error" : ""}
                  ></textarea>
                  <p className="new-order-hint">
                    يمكنك إضافة أكثر من منتج من نفس الطلب — ألصقي كل رابط بسطر لحاله.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary fetch-products-btn"
                    onClick={handleFetchLinks}
                  >
                    جلب المنتجات
                  </button>
                </div>
              )}

              {error && <p className="new-order-error">⚠ {error}</p>}

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
                    <div className="product-line-image">🖼</div>
                    <div className="product-line-info">
                      <div className="product-line-title">{p.title}</div>
                      <div className="product-line-attrs">
                        <span>المقاس: {p.size}</span>
                        <span>اللون: {p.color}</span>
                        <span>{p.price} ₪</span>
                      </div>
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
                    <div>
                      <div className="summary-value">{totalValue} ₪</div>
                      <div className="summary-label">القيمة التقديرية</div>
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

        {/* ============ المرحلة ٢: اختيار الوسيطة (بتنعرض بس إذا ما كانت الوسيطة مختارة مسبقًا) ============ */}
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
              <div className="mediator-pick-grid">
                {mediators.map((m) => (
                  <div className="mediator-pick-card" key={m.id}>
                    <div className="mediator-pick-top">
                      <span className={`mediator-pick-tag ${m.acceptingOrders ? "" : "off"}`}>
                        {m.acceptingOrders ? "● تستقبل طلبات" : "● غير متاحة"}
                      </span>
                      <div className="mediator-pick-avatar">{(m.name || "و").charAt(0)}</div>
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
                  <div className="mediator-pick-avatar">{(selectedMediator.name || "و").charAt(0)}</div>
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
            <div className="review-order-summary">
              <div className="review-row">
                <span>عدد المنتجات</span>
                <span>{totalItems} منتج ({totalPieces} قطعة)</span>
              </div>
              <div className="review-row">
                <span>قيمة المنتجات</span>
                <span>{totalValue} ₪</span>
              </div>
              <div className="review-row">
                <span>عمولة الوسيطة{commissionRate !== null ? ` (${commissionRate}%)` : ""}</span>
                <span>{commissionValue} ₪</span>
              </div>
              <div className="review-row">
                <span>رسوم التوصيل</span>
                <span>{deliveryFee > 0 ? `${deliveryFee} ₪` : "مجاني"}</span>
              </div>
              <div className="review-row review-total">
                <span>الإجمالي التقديري</span>
                <span>{estimatedTotal} ₪</span>
              </div>
              <p className="review-disclaimer">
                ⚠ المبلغ تقديري وقد يتغير حسب السعر النهائي للمنتجات.
              </p>

              <button type="button" className="btn btn-primary review-submit-btn" onClick={handleFinalSubmit}>
                إرسال الطلب إلى {selectedMediator.name} →
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

            <div className="review-order-side">
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
                  <div className="mediator-pick-avatar">{(selectedMediator.name || "و").charAt(0)}</div>
                  <div>
                    <div className="mediator-pick-bar-name">{selectedMediator.name}</div>
                    <div className="mediator-pick-bar-meta">
                      {[selectedMediator.city && `📍 ${selectedMediator.city}`, commissionText(selectedMediator)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="mediator-pick-services">
                      {profile.loading ? (
                        <span>جاري تحميل الخدمات...</span>
                      ) : profile.services.length === 0 ? (
                        <span>لا توجد خدمات معروضة</span>
                      ) : (
                        profile.services.map((sv) => <span key={sv.id}>{sv.name}</span>)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="review-side-card">
                <div className="review-side-header">
                  <span>طريقة استلام الطلب</span>
                </div>
                <label className={`delivery-option ${homeDeliveryAvailable ? "" : "disabled"}`}>
                  <span className="delivery-fee-tag">{deliveryTag}</span>
                  <span>التوصيل إلى المنزل</span>
                  <input
                    type="radio"
                    name="delivery"
                    disabled={!homeDeliveryAvailable}
                    checked={effectiveDeliveryMethod === "home"}
                    onChange={() => setDeliveryMethod("home")}
                  />
                </label>
                <label className="delivery-option">
                  <span className="delivery-fee-tag free">مجاني</span>
                  <span>الاستلام من نقطة استلام</span>
                  <input
                    type="radio"
                    name="delivery"
                    checked={effectiveDeliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                  />
                </label>
              </div>

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
            </div>
          </div>
        )}

        {toast && <div className="new-order-toast">✓ {toast}</div>}
          </DashboardLayout>
  );
}