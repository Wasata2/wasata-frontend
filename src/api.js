import { parseApiDate } from './utils/dates';

const BASE_URL = "https://wasata-backend-production-nojkxd.laravel.cloud";

export async function getCsrfCookie() {
  await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

// نقطة مرور وحيدة لكل طلبات الشبكة بالتطبيق. أي دالة تانية بهاد الملف
// (getOrders, createService...) بتنده على هاي بدل ما تكرر نفس الكود.
async function request(
  endpoint,
  { method = "GET", body, isFormData = false, errorMessage } = {},
) {
  const token = localStorage.getItem("token");

  const headers = { Accept: "application/json" };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    credentials: "include",
    headers,
    body: isFormData
      ? body
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  // ===== معالجة انتهاء الجلسة (401) — بمكان واحد بس، بتغطي كل الطلبات =====
  const isAuthEndpoint =
    endpoint.includes("/auth/login") || endpoint.includes("/auth/register");
  if (response.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  // بعض الطلبات (متل DELETE) ممكن ترجع بدون body، فمنحاول نقرا الـ JSON
  // بأمان بدون ما نوقّع لو كان فاضي
  let result = {};
  try {
    result = await response.json();
  } catch (e) {}

  if (!response.ok) {
    const details = result.errors
      ? Object.values(result.errors).flat().join(" / ")
      : "";
    throw new Error(details || result.message || errorMessage || "حدث خطأ ما");
  }

  return result;
}

export async function registerUser(data) {
  await getCsrfCookie();
  return request("/api/auth/register", {
    method: "POST",
    body: data,
    errorMessage: "حدث خطأ أثناء إنشاء الحساب",
  });
}

export async function loginUser(data) {
  await getCsrfCookie();

  const result = await request("/api/auth/login", {
    method: "POST",
    body: data,
    errorMessage: "خطأ في البريد الإلكتروني أو كلمة المرور",
  });

  // مسح أي بيانات جلسة سابقة قبل تخزين الجديدة
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  localStorage.setItem("token", result.token);
  localStorage.setItem("user", JSON.stringify(result.user));

  return result;
}

export async function apiPostWithAuth(endpoint, data) {
  return request(endpoint, { method: "POST", body: data });
}

export async function createStore(data) {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("bio", data.bio || "");
  formData.append("phone", data.phone);
  formData.append("city", data.city);
  formData.append(
    "accepts_whatsapp_orders",
    data.accepts_whatsapp_orders ? 1 : 0,
  );
  if (data.image) {
    formData.append("image", data.image);
  }

  return request("/api/stores", {
    method: "POST",
    body: formData,
    isFormData: true,
    errorMessage: "حدث خطأ أثناء إنشاء المتجر",
  });
}

export async function getMyStore() {
  return request("/api/stores/me", {
    errorMessage: "تعذر جلب بيانات المتجر",
  });
}

export async function logoutUser() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.log("logout error (ignored):", err);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

// ملاحظة: تعديل المتجر بيصير دايمًا على متجر المستخدمة الحالية —
// endpoint الصحيح PATCH /api/stores/me (من غير storeId بالمسار، حسب توثيق الباك اند)
export async function updateStore(data) {
  const formData = new FormData();
  // Laravel بيحتاج POST + _method=PATCH لما بيكون فيه ملف (multipart/form-data)
  formData.append("_method", "PATCH");
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.bio !== undefined) formData.append("bio", data.bio);
  if (data.phone !== undefined) formData.append("phone", data.phone);
  if (data.city !== undefined) formData.append("city", data.city);
  if (data.accepts_whatsapp_orders !== undefined) {
    formData.append(
      "accepts_whatsapp_orders",
      data.accepts_whatsapp_orders ? 1 : 0,
    );
  }
  // سويتش "استقبال الطلبات" — حقل منفصل تمامًا عن استقبال طلبات واتساب
  if (data.is_accepting_orders !== undefined) {
    formData.append("is_accepting_orders", data.is_accepting_orders ? 1 : 0);
  }
  // نسبة العمولة — صارت مدعومة فعليًا بالباك اند (commission_rate)
  if (data.commission_rate !== undefined) {
    formData.append("commission_rate", data.commission_rate);
  }
  if (data.image) {
    formData.append("image", data.image);
  }

  return request("/api/stores/me", {
    method: "POST",
    body: formData,
    isFormData: true,
    errorMessage: "حدث خطأ أثناء تحديث بيانات المتجر",
  });
}

export async function updateProfile(data) {
  const hasImage = !!data.image;

  let result;
  if (hasImage) {
    // فيه ملف => لازم multipart/form-data. الباك اند (Laravel) ما بيقرأ PUT حقيقي
    // مع FormData، فلازم نبعتها POST مع حقل _method=PUT (method override)
    const formData = new FormData();
    formData.append("_method", "PUT");
    if (data.full_name !== undefined)
      formData.append("full_name", data.full_name);
    if (data.phone !== undefined) formData.append("phone", data.phone);
    formData.append("image", data.image);

    result = await request("/api/auth/profile", {
      method: "POST",
      body: formData,
      isFormData: true,
      errorMessage: "حدث خطأ أثناء تحديث الصورة",
    });
  } else {
    // تعديل نصي بس (بدون صورة) => JSON عادي بـ PUT حقيقي، زي ما كان
    const body = {};
    if (data.full_name !== undefined) body.full_name = data.full_name;
    if (data.phone !== undefined) body.phone = data.phone;

    result = await request("/api/auth/profile", {
      method: "PUT",
      body,
      errorMessage: "حدث خطأ أثناء تحديث البيانات",
    });
  }

  // نحدّث localStorage بالبيانات الحقيقية الراجعة من الباك اند (مش بس محليًا متل قبل)
  localStorage.setItem("user", JSON.stringify(result.user));

  return result;
}

function mapServiceFromApi(s) {
  return {
    id: s.id,
    icon: s.icon,
    name: s.title,
    description: s.description,
    feeType: s.fee_type,
    feeValue: s.fee_amount,
    notes: s.notes || "",
    available: !!s.is_available,
  };
}

function mapServiceToApi(service) {
  return {
    icon: service.icon,
    title: service.name,
    description: service.description,
    fee_type: service.feeType,
    fee_amount: service.feeValue || null,
    notes: service.notes || "",
    is_available: service.available,
  };
}

export async function getServices() {
  const result = await request("/api/services", {
    errorMessage: "تعذر جلب الخدمات",
  });
  const list = result.services || result.data || result;
  return Array.isArray(list) ? list.map(mapServiceFromApi) : [];
}

export async function createService(service) {
  const result = await request("/api/services", {
    method: "POST",
    body: mapServiceToApi(service),
    errorMessage: "حدث خطأ أثناء إضافة الخدمة",
  });
  return mapServiceFromApi(result.service || result);
}

export async function updateService(id, service) {
  const result = await request(`/api/services/${id}`, {
    method: "PATCH",
    body: mapServiceToApi(service),
    errorMessage: "حدث خطأ أثناء إضافة الخدمة",
  });
  return mapServiceFromApi(result.service || result);
}

export async function toggleService(id) {
  const result = await request(`/api/services/${id}/toggle`, {
    method: "PATCH",
    errorMessage: "حدث خطأ أثناء تغيير حالة الخدمة",
  });
  return mapServiceFromApi(result.service || result);
}

export async function deleteService(id) {
  await request(`/api/services/${id}`, {
    method: "DELETE",
    errorMessage: "حدث خطأ أثناء حذف الخدمة",
  });
  return true;
}

export async function forgotPassword(email) {
  await getCsrfCookie();
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
  // النتيجة: { message, reset_token }
}

export async function resetPassword({
  email,
  token,
  password,
  passwordConfirmation,
}) {
  await getCsrfCookie();
  return request("/api/auth/reset-password", {
    method: "POST",
    body: {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    },
    errorMessage: "حدث خطأ أثناء تعيين كلمة المرور",
  });
}

export async function getOrderStats() {
  const result = await request("/api/orders/stats", {
    errorMessage: "تعذر جلب إحصائيات الطلبات",
  });

  // أسماء الحقول الحقيقية القادمة من الباك اند: total, new, in_progress, completed
  return {
    newCount: result.new ?? 0,
    inProgressCount: result.in_progress ?? 0,
    completedCount: result.completed ?? 0,
    total: result.total ?? 0,
  };
}

// قبول طلب — بينقل الحالة من pending إلى ordered_from_shein
export async function acceptOrder(id, items) {
  const result = await request(`/api/orders/${id}/accept`, {
    method: "PATCH",
    body: { items },
    errorMessage: "تعذر قبول الطلب",
  });
  return mapOrderFromApi(result.order || result);
}

// رفض طلب
export async function rejectOrder(id) {
  const result = await request(`/api/orders/${id}/reject`, {
    method: "PATCH",
    errorMessage: "تعذر رفض الطلب",
  });
  return mapOrderFromApi(result.order || result);
}

function mapOrderItemFromApi(item) {
  return {
    id: item.id,
    name: item.product_name || item.name,
    image: item.image_url || item.product_image,
    sheinUrl: item.shein_url || item.product_url,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    notes: item.notes || item.item_note,
  };
}

// اسم الزبونة: بنجرب أكتر من شكل ممكن يرجعه الباك اند (نص مباشر أو كائن customer)
function pickCustomerName(o) {
  return (
    o.customer?.full_name ||
    o.customer?.name ||
    o.customer_name ||
    (typeof o.customer === "string" ? o.customer : "") ||
    o.user?.full_name ||
    o.user?.name ||
    ""
  );
}

// وقت كل حالة بمسار الطلب: بنقراه من سجل الحالات لو الباك اند بيرجّعه
// (status_history: [{ status, created_at }]) أو من أعمدة مثل shipped_at / arrived_at.
const ORDER_STATUS_KEYS = [
  "pending",
  "ordered_from_shein",
  "shipped",
  "arrived",
  "inspected",
  "received",
];

function buildStatusTimes(o) {
  const times = {};
  const direct = o.status_times || o.statusTimes;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    Object.entries(direct).forEach(([key, at]) => {
      if (at) times[key] = at;
    });
  }
  const history =
    o.status_history ||
    o.status_histories ||
    o.statusHistory ||
    o.status_logs ||
    o.timeline ||
    o.history;
  if (Array.isArray(history)) {
    history.forEach((h) => {
      const key = h.status || h.to_status || h.new_status;
      const at = h.created_at || h.changed_at || h.updated_at || h.at;
      // أول مرة وصلت فيها الحالة هي وقتها
      if (key && at && !times[key]) times[key] = at;
    });
  }
  ORDER_STATUS_KEYS.forEach((key) => {
    if (!times[key] && o[`${key}_at`]) times[key] = o[`${key}_at`];
  });
  return times;
}
function pickOrderDate(o, statusTimes) {
  const candidates = [statusTimes.pending, o.created_at, o.order_date, o.placed_at, o.date];
  return candidates.find((v) => v && parseApiDate(v)) || candidates.find(Boolean) || '';
}

function mapOrderFromApi(o) {
  const rawItems = o.items || o.order_items || [];
  const items = rawItems.map(mapOrderItemFromApi);
  // مجموع الكميات (منتج واحد بكمية 2 = عدد 2) — لو الباك اند ما رجّع المنتجات
  // نجرب حقول جاهزة للمجموع
  const totalQuantity = items.length
    ? items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
    : (o.total_quantity ??
      o.items_sum_quantity ??
      o.total_items_quantity ??
      null);

  return {
    id: o.id,
    customer: pickCustomerName(o),
    date: pickOrderDate(o, buildStatusTimes(o)),  
    statusUpdatedAt: o.status_updated_at || o.updated_at || o.created_at,
    statusTimes: buildStatusTimes(o),
    itemsCount: o.items_count ?? rawItems.length,
    totalQuantity,
    amount: o.estimated_amount ?? o.total_amount ?? o.amount ?? 0,
    status: o.status,
    items,
  };
}

// خطوات مسار الطلب عند الزبونة — بنفس ترتيب الحالات الحقيقية من الباك اند
export const CUSTOMER_ORDER_STATUSES = [
  "pending",
  "ordered_from_shein",
  "shipped",
  "arrived",
  "inspected",
  "received",
];
export const CUSTOMER_ORDER_STEP_LABELS = [
  "تم الطلب",
  "تم الطلب من SHEIN",
  "تم الشحن",
  "وصلت",
  "تم الفحص",
  "تم الاستلام",
];

// طلبات الزبونة نفسها (تختلف عن getOrders اللي بترجع طلبات الوسيطة الواردة)
function mapMyOrderFromApi(o) {
  const stepIndex = CUSTOMER_ORDER_STATUSES.indexOf(o.status);
  const isCancelled = o.status === "cancelled" || o.status === "rejected";
  const isCompleted = o.status === "received" || o.status === "completed";

  return {
    id: o.id,
    store: o.store_name || "—",
    storeId: o.store_id ?? o.store?.id ?? null,
    storeImage: resolveStoreImageUrl(
      o.store_image_url ||
        o.store_image ||
        o.store?.image_url ||
        o.store?.image,
    ),
    itemsCount: o.items_count ?? 0,
    totalQuantity:
      o.total_quantity ??
      o.items_sum_quantity ??
      o.total_items_quantity ??
      null,
    price: o.estimated_amount ?? o.total_amount ?? 0,
    date: pickOrderDate(o, buildStatusTimes(o)),  
    statusUpdatedAt: o.status_updated_at || o.updated_at || o.created_at || "",
    statusTimes: buildStatusTimes(o),
    reviewed: !!o.reviewed,
    rawStatus: o.status,
    type: isCancelled ? "cancelled" : isCompleted ? "completed" : "active",
    statusLabel: isCancelled
      ? o.status === "rejected"
        ? "مرفوض"
        : "ملغي"
      : isCompleted
        ? "مكتمل"
        : CUSTOMER_ORDER_STEP_LABELS[stepIndex] || "تم الطلب",
    currentStepIndex: stepIndex >= 0 ? stepIndex : 0,
  };
}

export async function getMyOrders() {
  const result = await request("/api/my-orders", {
    errorMessage: "تعذر جلب طلباتك",
  });
  const list = result.orders || [];
  return {
    stats: result.stats || {
      active: 0,
      completed: 0,
      cancelled_or_rejected: 0,
    },
    orders: list.map(mapMyOrderFromApi),
  };
}

// إنشاء طلب جديد (الزبونة) — POST /api/orders، multipart/form-data عشان صور المنتجات
// items: [{ serviceListingId, quantity, productName, productUrl, productImage, color, size, itemNote }]
export async function createOrder({
  storeId,
  deliveryMethod, // "home_delivery" | "pickup"
  address, // إلزامي من الباك اند لو deliveryMethod = home_delivery
  customerNote,
  estimatedAmount,
  items,
}) {
  const form = new FormData();
  form.append("store_id", storeId);
  form.append("delivery_method", deliveryMethod);
  if (address) form.append("address", address);
  if (customerNote) form.append("customer_note", customerNote);
  if (estimatedAmount !== null && estimatedAmount !== undefined) {
    form.append("estimated_amount", estimatedAmount);
  }
  // ... باقي الدالة (items.forEach...) زي ما هو، ما تغيّر

  items.forEach((item, i) => {
    form.append(`items[${i}][service_listing_id]`, item.serviceListingId);
    form.append(`items[${i}][quantity]`, item.quantity);
    form.append(`items[${i}][product_name]`, item.productName);
    if (item.productUrl)
      form.append(`items[${i}][product_url]`, item.productUrl);
    if (item.productImage)
      form.append(`items[${i}][product_image]`, item.productImage);
    if (item.color) form.append(`items[${i}][color]`, item.color);
    if (item.size) form.append(`items[${i}][size]`, item.size);
    if (item.itemNote) form.append(`items[${i}][item_note]`, item.itemNote);
  });

  const result = await request("/api/orders", {
    method: "POST",
    body: form,
    isFormData: true,
    errorMessage: "تعذر إرسال الطلب",
  });
  return result.order || result;
}

export async function getOrders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.date) params.append("date", filters.date);
  if (filters.search) params.append("search", filters.search);

  const result = await request(`/api/orders?${params.toString()}`, {
    errorMessage: "تعذر جلب الطلبات",
  });

  const list = result.orders || result.data || result;
  return Array.isArray(list) ? list.map(mapOrderFromApi) : [];
}

export async function getOrderDetails(id) {
  const result = await request(`/api/orders/${id}`, {
    errorMessage: "تعذر جلب تفاصيل الطلب",
  });
  return mapOrderFromApi(result.order || result);
}

// تحديث حالة الطلب (مسار الطلب) — endpoint PATCH /api/orders/{id}/status
// القيم المسموحة: pending, ordered_from_shein, shipped, arrived, inspected, received, cancelled
export async function updateOrderStatus(id, status) {
  const result = await request(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    errorMessage: "تعذر تحديث حالة الطلب",
  });
  return mapOrderFromApi(result.order || result);
}

// إلغاء طلب من طرف الزبونة — endpoint مخصص PATCH /api/orders/{id}/cancel (بدون body).
// ملاحظة: PATCH /orders/{id}/status للوسيطة بس (بيرجع 404 للزبونة لأنه بدوّر على متجر).
// الباك اند بيرجع 422 لو الطلب مش pending، و403 لو الطلب مش للزبونة.
export async function cancelOrder(id) {
  const result = await request(`/api/orders/${id}/cancel`, {
    method: "PATCH",
    errorMessage: "تعذر إلغاء الطلب",
  });
  return mapOrderFromApi(result.order || result);
}

// تقييمات الزبائن الحقيقية عن الوسيطة الحالية
function mapReviewFromApi(r) {
  return {
    id: r.id,
    customer: r.customer_name || r.customer || r.user_name || "زبونة",
    date: r.created_at || r.date,
    rating: r.rating,
    comment: r.comment || r.review || "",
    orderId: r.order_id || r.orderId || null,
  };
}

// الرد من الباك اند فيه average_rating و total_reviews و distribution جاهزين —
// ما في داعي نحسبهم يدويًا بالفرونت
function mapReviewsResponse(result) {
  const list = result.reviews || [];
  return {
    averageRating: result.average_rating || 0,
    totalReviews: result.total_reviews || 0,
    distribution: (result.distribution || []).map((d) => ({
      star: d.stars,
      pct: d.percentage,
    })),
    reviews: Array.isArray(list) ? list.map(mapReviewFromApi) : [],
  };
}

export async function getReviews() {
  const result = await request("/api/reviews", {
    errorMessage: "تعذر جلب التقييمات",
  });
  return mapReviewsResponse(result);
}
export async function createOrderReview(orderId, { rating, comment }) {
  const result = await request(`/api/orders/${orderId}/review`, {
    method: "POST",
    body: { rating, comment: comment || null },
    errorMessage: "تعذر إرسال التقييم",
  });
  return result.review ? mapReviewFromApi(result.review) : result;
}
// تقييمات وسيطة معيّنة (للملف العام اللي بتشوفه الزبونة) — GET /api/stores/{id}/reviews
export async function getStoreReviews(storeId) {
  const result = await request(`/api/stores/${storeId}/reviews`, {
    errorMessage: "تعذر جلب التقييمات",
  });
  return mapReviewsResponse(result);
}

// بروفايل وسيطة معيّنة (للملف العام اللي بتشوفه الزبونة) — GET /api/stores/{id}
// الرد: { store: {...}, services: [...] } — الخدمات جاية جوا نفس الرد، ما في مسار منفصل إلها
export async function getStoreProfile(storeId) {
  const result = await request(`/api/stores/${storeId}`, {
    errorMessage: "تعذر جلب بيانات الوسيطة",
  });
  const store = result.store || result;
  const services = Array.isArray(result.services)
    ? result.services
    : Array.isArray(store.services)
      ? store.services
      : [];
  return {
    store: mapStoreFromApi(store),
    services: services.map(mapServiceFromApi),
  };
}

// ===== استكشاف الوسيطات (شاشة الزبونة) =====
// بيانات حقيقية بالكامل من الباك اند — بدون أي بيانات وهمية/ثابتة بالفرونت
function mapStoreFromApi(s) {
  const owner = s.user || s.owner || {};
  return {
    id: s.id,
    // اسم المتجر اللي أنشأته الوسيطة (بيظهر ببطاقة الاستكشاف)، وإذا ما انرجع بنرجع لاسم صاحبة المتجر
    name:
      s.name ||
      s.store_name ||
      owner.full_name ||
      owner.name ||
      s.full_name ||
      s.owner_name ||
      "وسيطة",
    // اسم الوسيطة نفسها (صاحبة المتجر) — بنستخدمه بالبحث بس
    ownerName:
      owner.full_name || owner.name || s.full_name || s.owner_name || "",
    // نبذة عني يلي كتبتها الوسيطة وقت إنشاء المتجر (أو عدّلتها لاحقًا من ملفها الشخصي)
    bio: s.bio || "",
    city: s.city || "",
    // رقم التلفون ممكن يكون على المتجر نفسه أو على حساب صاحبة المتجر
    phone: s.phone || owner.phone || s.user_phone || s.owner_phone || "",
    image: resolveStoreImageUrl(s.image_url || s.image),
    commission: s.commission_rate ?? s.commission ?? null,
    acceptingOrders: !!s.is_accepting_orders,
    completedOrders:
      s.completed_orders_count ?? s.completed_orders ?? s.orders_completed ?? 0,
    // إذا الباك اند ما بيرجّع هالحقل، منسيبه null ومنخفي شارة "موثقة" بالواجهة
    // (ما منعرض شارة وهمية لكل الوسيطات)
    verified: s.is_verified ?? s.verified ?? null,
    createdAt: s.created_at || null,
  };
}

// رابط صورة المتجر ممكن يجي كمسار نسبي من الباك اند، فمنتأكد إنه رابط كامل
function resolveStoreImageUrl(path) {
  if (!path) return null;
  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (!clean.includes("/")) {
    return `${BASE_URL}/storage/${clean}`;
  }
  return `${BASE_URL}/${clean}`;
}

// جلب كل الوسيطات المتاحة عشان الزبونة تتصفحهم — endpoint GET /api/stores
// ملاحظة: لازم نتأكد إنه هاد المسار موجود فعليًا بالباك اند وبيرجع مصفوفة
// متاجر/وسيطات (بنفس شكل بيانات getMyStore تقريبًا). إذا كان اسم المسار
// مختلف عند الباك اند، بس غيّري السطر يلي فيه '/api/stores' تحت.
export async function getStores() {
  const result = await request("/api/stores", {
    errorMessage: "تعذر جلب قائمة الوسيطات",
  });

  const list = result.stores || result.data || result;
  return Array.isArray(list) ? list.map(mapStoreFromApi) : [];
}

// ===== القطع الراكدة (stock-items) =====
// الفئة بالباك اند بالإنجليزي (shoes / clothes)، وبالواجهة بالعربي (أحذية / ملابس)
const CATEGORY_TO_API = { ملابس: "clothes", أحذية: "shoes" };
const CATEGORY_FROM_API = { clothes: "ملابس", shoes: "أحذية" };

function categoryFromApi(value) {
  return CATEGORY_FROM_API[value] || value || "ملابس";
}
export function categoryToApi(value) {
  return CATEGORY_TO_API[value] || value;
}

// حالة القطعة: القيم المخزّنة بقاعدة البيانات (enum) هي بالظبط هاي الأربعة،
// ونفس القيم بترجع بالـ JSON، فمنستخدمها كمفاتيح داخلية مباشرة (exact match).
// ملاحظة: مطابقة النص الجزئي (includes("list")) كانت بتحوّل "unlisted" لـ "listed" بالغلط.
const STOCK_STATUSES = ["unlisted", "listed", "reserved", "sold"];

function normalizeStockStatus(value) {
  if (STOCK_STATUSES.includes(value)) return value;
  console.warn("قيمة status غير متوقعة من الباك اند:", value);
  return "unlisted"; // احتياط بس عشان الواجهة ما تنهار
}

// الباك اند ممكن يرجّع القطعة مباشرة، أو داخل stock_item، أو داخل data (أو data.stock_item)
// فمنفك الغلاف بأي شكل عشان ما تضيع بيانات القطعة (الاسم/السعر/الصورة)
function unwrapStockItem(result) {
  if (!result || typeof result !== "object") return {};
  const inner = result.stock_item || result.item || result.data || result;
  if (inner && typeof inner === "object" && inner.stock_item) {
    return inner.stock_item;
  }
  return inner;
}

function mapStockItemFromApi(o) {
  o = o || {};
  const category = categoryFromApi(o.category);
  const rawImage = o.image_url || o.image || o.image_path || o.photo || null;
  const rawPrice = o.price ?? o.selling_price ?? o.amount ?? 0;
  return {
    id: o.id,
    name: o.name || o.title || "",
    category,
    icon: category === "أحذية" ? "👟" : "👗",
    price: Number(rawPrice) || 0,
    color: o.color || "",
    size: o.size || "",
    image: rawImage ? resolveStockImage(rawImage) : null,
    status: normalizeStockStatus(o.status),
    createdAt: o.created_at || o.date || "",
  };
}

// مسار الصورة ممكن يجي نسبي (stock-items/xxx.jpg) — منحوله لرابط كامل عشان يظهر
function resolveStockImage(path) {
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (clean.startsWith("storage/")) return `${BASE_URL}/${clean}`;
  return `${BASE_URL}/storage/${clean}`;
}

// قائمة القطع الراكدة عند الوسيطة الحالية (فلاتر اختيارية: search, status, category, sort)
export async function getStockItems(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.category)
    params.append("category", categoryToApi(filters.category));
  if (filters.sort) params.append("sort", filters.sort);

  const result = await request(`/api/stock-items?${params.toString()}`, {
    errorMessage: "تعذر جلب القطع الراكدة",
  });
  const list = result.stock_items || result.data || result;
  return Array.isArray(list) ? list.map(mapStockItemFromApi) : [];
}

// إضافة قطعة جديدة
// إضافة قطعة جديدة (مع مقاس/لون/صورة اختياريين — لازم يتأكد الباك اند إنه بيقبلهم)
export async function createStockItem({
  name,
  category,
  price,
  color,
  size,
  image,
}) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("category", categoryToApi(category));
  formData.append("price", price);
  if (color) formData.append("color", color);
  if (size) formData.append("size", size);
  if (image) formData.append("image", image);

  const result = await request("/api/stock-items", {
    method: "POST",
    body: formData,
    isFormData: true,
    errorMessage: "تعذر إضافة القطعة",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

// تعديل العرض (الاسم / الفئة / السعر / المقاس / اللون / الصورة)
export async function updateStockItem(
  id,
  { name, category, price, color, size, image },
) {
  const formData = new FormData();
  // Laravel بيحتاج POST + _method=PATCH لما بيكون فيه ملف (multipart/form-data)
  formData.append("_method", "PATCH");
  if (name !== undefined) formData.append("name", name);
  if (category !== undefined)
    formData.append("category", categoryToApi(category));
  if (price !== undefined) formData.append("price", price);
  if (color !== undefined) formData.append("color", color);
  if (size !== undefined) formData.append("size", size);
  if (image) formData.append("image", image);

  const result = await request(`/api/stock-items/${id}`, {
    method: "POST",
    body: formData,
    isFormData: true,
    errorMessage: "تعذر تعديل القطعة",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

// إلغاء العرض — القطعة بترجع "غير معروضة" بدون ما تنحذف (بيرفض 422 لو القطعة مش listed)
export async function unlistStockItem(id) {
  const result = await request(`/api/stock-items/${id}/unlist`, {
    method: "PATCH",
    errorMessage: "تعذر إلغاء العرض",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

// عرض للبيع
export async function listStockItem(id) {
  const result = await request(`/api/stock-items/${id}/list`, {
    method: "PATCH",
    errorMessage: "تعذر عرض القطعة للبيع",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

// إلغاء الحجز (من الوسيطة) — القطعة بترجع معروضة للبيع
export async function cancelStockReservation(id) {
  const result = await request(`/api/stock-items/${id}/cancel-reservation`, {
    method: "PATCH",
    errorMessage: "تعذر إلغاء الحجز",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

// تأكيد البيع
export async function confirmStockSale(id) {
  const result = await request(`/api/stock-items/${id}/confirm-sale`, {
    method: "PATCH",
    errorMessage: "تعذر تأكيد البيع",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

// حذف قطعة
export async function deleteStockItem(id) {
  await request(`/api/stock-items/${id}`, {
    method: "DELETE",
    errorMessage: "تعذر حذف القطعة",
  });
}

// جهة الزبونة: تصفح القطع المعروضة (بس) عند متجر معيّن
export async function getStoreStockItems(storeId) {
  const result = await request(`/api/stores/${storeId}/stock-items`, {
    errorMessage: "تعذر جلب القطع المعروضة",
  });
  const list = result.stock_items || result.data || result;
  return Array.isArray(list) ? list.map(mapStockItemFromApi) : [];
}

// جهة الزبونة: طلب حجز قطعة
export async function reserveStockItem(id) {
  const result = await request(`/api/stock-items/${id}/reserve`, {
    method: "PATCH",
    errorMessage: "تعذر حجز القطعة، يمكن حجزها قبل قليل",
  });
  return mapStockItemFromApi(unwrapStockItem(result));
}

export { BASE_URL };