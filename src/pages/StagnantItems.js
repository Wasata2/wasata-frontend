import { useState, useMemo, useEffect } from "react";
import { getOrderStats, getMyStore, BASE_URL } from "../api";
import DashboardLayout from "../components/DashboardLayout";
import {
  STAGNANT_CATEGORIES as CATEGORIES,
  STAGNANT_STATUS as STATUS,
  iconForCategory,
  loadStagnantItems,
  saveStagnantItems,
} from "../stagnantItemsStore";

const SORT_OPTIONS = {
  newest: "الأحدث",
  oldest: "الأقدم",
  priceAsc: "السعر: الأقل أولًا",
  priceDesc: "السعر: الأعلى أولًا",
};

const EMPTY_FORM = { name: "", category: CATEGORIES[0], price: "" };

// رابط صورة المتجر يجي أحيانًا كمسار نسبي — نفس الدالة المستخدمة ببقية صفحات الوسيطة
function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (!clean.includes("/")) {
    return `${BASE_URL}/storage/${clean}`;
  }
  return `${BASE_URL}/${clean}`;
}

export default function StagnantItems() {
  // القطع بتنقرا وبتنحفظ من المخزن المشترك، فالقطع "المعروضة" بتظهر للزبونة
  // كل وسيطة إلها قطعها الخاصة (حسب id المتجر)، فبنستنى نعرف المتجر قبل ما نحمّلها
  const [storeId, setStoreId] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsReady, setItemsReady] = useState(false);
  useEffect(() => {
    if (itemsReady && storeId !== null) {
      saveStagnantItems(storeId, items);
    }
  }, [items, storeId, itemsReady]);

  // بيانات الشريط العلوي (إشعارات + صورة المتجر) — نفس أسلوب بقية صفحات الوسيطة
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getOrderStats().then(setStats).catch(() => {});
  }, []);

  const [imagePreview, setImagePreview] = useState(null);
  useEffect(() => {
    getMyStore()
      .then((data) => {
        const store = data.store || data;
        setImagePreview(resolveImageUrl(store.image_url || store.image));
        setStoreId(store.id);
        setItems(loadStagnantItems(store.id));
        setItemsReady(true);
      })
      .catch(() => {
        // لو تعذر جلب المتجر بنشتغل بمخزن مؤقت عشان الصفحة ما تعلق
        setStoreId("me");
        setItems(loadStagnantItems("me"));
        setItemsReady(true);
      });
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const [expandedId, setExpandedId] = useState(null);

  // نافذة إضافة/تعديل قطعة — editingId = null معناها "إضافة جديدة"
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const editingItem = editingId === null ? null : items.find((i) => i.id === editingId);

  const hasActiveFilters = searchTerm || categoryFilter || statusFilter;

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  const visibleItems = useMemo(() => {
    const term = searchTerm.trim();
    const filtered = items.filter((item) => {
      if (term && !item.name.includes(term)) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      return b.createdAt.localeCompare(a.createdAt); // newest
    });
  }, [items, searchTerm, categoryFilter, statusFilter, sortBy]);

  // ===== أزرار الإجراءات السريعة =====
  const toggleStatusFilter = (status) => {
    setStatusFilter((current) => (current === status ? "" : status));
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, category: item.category, price: String(item.price) });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSave = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setFormError("اكتبي اسم القطعة.");
      return;
    }
    if (!form.price || Number.isNaN(price) || price <= 0) {
      setFormError("اكتبي سعرًا صحيحًا أكبر من صفر.");
      return;
    }

    if (editingId === null) {
      const newItem = {
        id: Date.now(),
        name,
        category: form.category,
        icon: iconForCategory(form.category),
        price,
        status: "notListed",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setItems((prev) => [newItem, ...prev]);
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name, category: form.category, icon: iconForCategory(form.category), price }
            : item
        )
      );
    }
    setShowModal(false);
  };

  // إلغاء العرض: القطعة بترجع "غير معروضة" وبتختفي من صفحة الزبونة
  const unlist = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "notListed" } : item))
    );
    setShowModal(false);
  };

  // القطعة المحجوزة: الوسيطة بتأكد البيع (تم البيع) أو بتلغي الحجز فبترجع معروضة للزبونات
  const setItemStatus = (id, status) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    setExpandedId(null);
  };

  const listForSale = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "listed" } : item))
    );
  };

  const formatDate = (isoDate) =>
    new Date(isoDate).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <DashboardLayout
      role="broker"
      notifBadge={stats && stats.newCount}
      notifLink="/mediator-notifications"
      avatarImage={imagePreview}
    >
      <div className="dashboard-welcome">
        <h1>القطع الراكدة</h1>
        <p>أديري القطع المتوفرة لديكِ واعرضي المناسب منها للبيع — القطع المعروضة بتظهر للزبونات.</p>
      </div>

      {/* إجراءات سريعة */}
      <div className="stagnant-card stagnant-actions">
        <h3 className="stagnant-card-title">إجراءات سريعة</h3>
        <div className="stagnant-actions-row">
          <button type="button" className="stagnant-action-btn" onClick={openAddModal}>
            <span aria-hidden="true">＋</span> إضافة قطعة جديدة
          </button>
          <button
            type="button"
            className={`stagnant-action-btn ${statusFilter === "listed" ? "is-active" : ""}`}
            onClick={() => toggleStatusFilter("listed")}
          >
            <span aria-hidden="true">🛍</span> القطع المعروضة للبيع
          </button>
          <button
            type="button"
            className={`stagnant-action-btn ${statusFilter === "sold" ? "is-active" : ""}`}
            onClick={() => toggleStatusFilter("sold")}
          >
            <span aria-hidden="true">☆</span> القطع المباعة
          </button>
          <button
            type="button"
            className={`stagnant-action-btn ${statusFilter === "" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("")}
          >
            <span aria-hidden="true">☰</span> الكل
          </button>
        </div>
      </div>

      {/* البحث والتصفية والترتيب */}
      <div className="stagnant-card stagnant-toolbar">
        <input
          type="text"
          className="stagnant-search"
          placeholder="ابحثي باسم القطعة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="button"
          className={`stagnant-tool-btn ${showFilters ? "is-active" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          ⚲ تصفية
        </button>
        <select
          className="stagnant-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="ترتيب القطع"
        >
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {showFilters && (
        <div className="stagnant-card stagnant-filter-panel">
          <label>
            <span>الفئة</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">الكل</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>الحالة</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">الكل</option>
              {Object.entries(STATUS).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {hasActiveFilters && (
            <button type="button" className="clear-filters-chip" onClick={clearFilters}>
              مسح الفلاتر ✕
            </button>
          )}
        </div>
      )}

      {/* القائمة */}
      <div className="stagnant-list-head">
        <h2>القطع الراكدة</h2>
        <span className="stagnant-count">{visibleItems.length} قطع</span>
      </div>

      {!itemsReady ? (
        <div className="orders-empty-state">
          <p>جاري التحميل...</p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="orders-empty-state">
          <p>لا توجد قطع مطابقة</p>
          <span>{hasActiveFilters ? "حاولي تعديل البحث أو الفلاتر." : "ابدأي بإضافة قطعة جديدة."}</span>
        </div>
      ) : (
        visibleItems.map((item) => {
          const status = STATUS[item.status];
          const isExpanded = expandedId === item.id;

          return (
            <div className="stagnant-item" key={item.id}>
              <div className="stagnant-item-row">
                <div className={`stagnant-item-icon ${item.category === "أحذية" ? "cat-shoes" : "cat-clothes"}`}>
                  {item.icon}
                </div>

                <div className="stagnant-item-info">
                  <div className="stagnant-item-name">{item.name}</div>
                  <div className="stagnant-item-meta">الفئة: {item.category}</div>
                  <span className={`stagnant-status ${status.className}`}>{status.label}</span>
                </div>

                <div className="stagnant-item-side">
                  <div className="stagnant-item-price">{item.price} ₪</div>

                  {item.status === "notListed" && (
                    <button type="button" className="stagnant-btn primary" onClick={() => listForSale(item.id)}>
                      عرض للبيع
                    </button>
                  )}
                  {item.status === "listed" && (
                    <button type="button" className="stagnant-btn outline-brand" onClick={() => openEditModal(item)}>
                      تعديل العرض
                    </button>
                  )}
                  {item.status === "reserved" && (
                    <div className="stagnant-item-actions">
                      <button type="button" className="stagnant-btn primary" onClick={() => setItemStatus(item.id, "sold")}>
                        تأكيد البيع
                      </button>
                      <button type="button" className="stagnant-btn outline" onClick={() => setItemStatus(item.id, "listed")}>
                        إلغاء الحجز
                      </button>
                    </div>
                  )}
                  {item.status === "sold" && (
                    <button
                      type="button"
                      className="stagnant-btn outline"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      عرض التفاصيل
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="stagnant-item-details">
                  <span>تاريخ الإضافة: {formatDate(item.createdAt)}</span>
                  <span>الحالة: {status.label}</span>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* نافذة إضافة / تعديل قطعة */}
      {showModal && (
        <div className="stagnant-modal-backdrop" onClick={closeModal}>
          <form className="stagnant-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId === null ? "إضافة قطعة جديدة" : "تعديل القطعة"}</h3>

            <label>
              <span>اسم القطعة</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: فستان صيفي"
                autoFocus
              />
            </label>

            <label>
              <span>الفئة</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>السعر (₪)</span>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </label>

            {formError && <div className="stagnant-form-error">{formError}</div>}

            <div className="stagnant-modal-actions">
              <button type="submit" className="stagnant-btn primary">
                حفظ
              </button>
              <button type="button" className="stagnant-btn outline" onClick={closeModal}>
                إلغاء
              </button>
              {editingItem && editingItem.status === "listed" && (
                <button type="button" className="stagnant-btn danger" onClick={() => unlist(editingItem.id)}>
                  إلغاء العرض
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}