import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// بيانات وسيطات تجريبية (Mock) — لاحقًا لازم تجي من الـ API بدل ما تكون ثابتة هون
const MOCK_MEDIATORS = [
  {
    id: 1,
    name: "نور أحمد",
    city: "رام الله",
    completedOrders: 142,
    commission: 8,
    rating: 4.8,
    reviewsCount: 64,
    services: ["استلام من نقطة", "توصيل للمنزل"],
    deliveryFee: 10,
  },
  {
    id: 2,
    name: "سارة خليل",
    city: "البيرة",
    completedOrders: 318,
    commission: 7,
    rating: 4.9,
    reviewsCount: 201,
    services: ["استلام من نقطة", "تخزين مؤقت", "توصيل للمنزل"],
    deliveryFee: 12,
  },
  {
    id: 3,
    name: "دينا عمر",
    city: "الخليل",
    completedOrders: 63,
    commission: 9,
    rating: 4.6,
    reviewsCount: 47,
    services: ["تخزين مؤقت", "استلام من نقطة"],
    deliveryFee: 10,
  },
  {
    id: 4,
    name: "رنا مصطفى",
    city: "نابلس",
    completedOrders: 97,
    commission: 10,
    rating: 4.7,
    reviewsCount: 88,
    services: ["توصيل للمنزل"],
    deliveryFee: 8,
  },
];

export default function NewOrder() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const userName =
    storedUser.full_name || storedUser.name || storedUser.fullName || "زبونة";
  const userInitial = userName.charAt(0);

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
  const [selectedMediatorId, setSelectedMediatorId] = useState(null);
  const selectedMediator = MOCK_MEDIATORS.find((m) => m.id === selectedMediatorId);

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

  const deliveryFee =
    deliveryMethod === "home" && selectedMediator ? selectedMediator.deliveryFee : 0;
  const commissionValue = selectedMediator
    ? Math.round((totalValue * selectedMediator.commission) / 100)
    : 0;
  const estimatedTotal = totalValue + commissionValue + deliveryFee;

  // إرسال الطلب النهائي — بيتحول لنفس تصميم كارت الطلب الموجود أصلًا بصفحة "طلباتي"
  const handleFinalSubmit = () => {
    const newOrder = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      type: "active",
      price: String(estimatedTotal),
      store: selectedMediator ? selectedMediator.name : "—",
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
    <div className="dashboard-layout">
      {/* ===== الشريط الجانبي — عدّلي هذا الجزء ليطابق باقي الصفحات بالضبط (اللوجو) ===== */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span> الرئيسية
          </Link>
          <Link to="/customer-dashboard" className="sidebar-link">
            <span className="sidebar-icon">▦</span> لوحة التحكم
          </Link>
          <Link to="/my-orders" className="sidebar-link active">
            <span className="sidebar-icon">📋</span> طلباتي
          </Link>
          <Link to="/explore-mediators" className="sidebar-link">
            <span className="sidebar-icon">🔍</span> استكشاف الوسيطات
          </Link>
          <Link to="/profile" className="sidebar-link">
            <span className="sidebar-icon">👤</span> الملف الشخصي
          </Link>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="topbar-actions">
            <button className="notif-btn">🔔</button>
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-store">زبونة</div>
            </div>
            <div className="user-avatar">{userInitial}</div>
          </div>
        </div>

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
                  <button type="button" className="btn btn-primary" onClick={() => setStep("mediator")}>
                    متابعة الطلب →
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
            <div className="mediator-pick-grid">
              {MOCK_MEDIATORS.map((m) => (
                <div className="mediator-pick-card" key={m.id}>
                  <div className="mediator-pick-top">
                    <span className="mediator-pick-tag">● تستقبل طلبات</span>
                    <div className="mediator-pick-avatar">{m.name.charAt(0)}</div>
                  </div>
                  <div className="mediator-pick-name">{m.name}</div>
                  <div className="mediator-pick-loc">📍 {m.city}</div>
                  <div className="mediator-pick-stats">
                    <span>{m.completedOrders} طلب مكتمل</span>
                    <span>العمولة {m.commission}%</span>
                    <span>⭐ {m.rating} ({m.reviewsCount} تقييم)</span>
                  </div>
                  <div className="mediator-pick-services">
                    {m.services.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`btn ${selectedMediatorId === m.id ? "btn-primary" : "btn-outline"} mediator-pick-btn`}
                    onClick={() => setSelectedMediatorId(m.id)}
                  >
                    {selectedMediatorId === m.id ? "✓ تم الاختيار" : "اختيار"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mediator-pick-bar">
              {selectedMediator ? (
                <div className="mediator-pick-bar-selected">
                  <div className="mediator-pick-avatar">{selectedMediator.name.charAt(0)}</div>
                  <div>
                    <div className="mediator-pick-bar-name">{selectedMediator.name}</div>
                    <div className="mediator-pick-bar-meta">
                      العمولة {selectedMediator.commission}% · ⭐ {selectedMediator.rating}
                    </div>
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
                <span>عمولة الوسيطة ({selectedMediator.commission}%)</span>
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
              <button type="button" className="btn btn-outline review-back-btn" onClick={() => setStep("mediator")}>
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
                  <button type="button" className="change-mediator-link" onClick={() => setStep("mediator")}>
                    تغيير الوسيطة
                  </button>
                </div>
                <div className="review-mediator-row">
                  <div className="mediator-pick-avatar">{selectedMediator.name.charAt(0)}</div>
                  <div>
                    <div className="mediator-pick-bar-name">{selectedMediator.name}</div>
                    <div className="mediator-pick-bar-meta">
                      📍 {selectedMediator.city} · العمولة {selectedMediator.commission}% · ⭐{" "}
                      {selectedMediator.rating}
                    </div>
                    <div className="mediator-pick-services">
                      {selectedMediator.services.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="review-side-card">
                <div className="review-side-header">
                  <span>طريقة استلام الطلب</span>
                </div>
                <label className="delivery-option">
                  <span className="delivery-fee-tag">{selectedMediator.deliveryFee} ₪</span>
                  <span>التوصيل إلى المنزل</span>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "home"}
                    onChange={() => setDeliveryMethod("home")}
                  />
                </label>
                <label className="delivery-option">
                  <span className="delivery-fee-tag free">مجاني</span>
                  <span>الاستلام من نقطة استلام</span>
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "pickup"}
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
      </main>
    </div>
  );
}