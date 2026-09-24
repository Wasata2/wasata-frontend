const BASE_URL = process.env.REACT_APP_API_URL;

export async function getCsrfCookie() {
  await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
}

// نقطة مرور وحيدة لكل طلبات الشبكة بالتطبيق. أي دالة تانية بهاد الملف
// (getOrders, createService...) بتنده على هاي بدل ما تكرر نفس الكود.
async function request(endpoint, { method = 'GET', body, isFormData = false, errorMessage } = {}) {
  const token = localStorage.getItem('token');

  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    credentials: 'include',
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // ===== معالجة انتهاء الجلسة (401) — بمكان واحد بس، بتغطي كل الطلبات =====
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
  if (response.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // بعض الطلبات (متل DELETE) ممكن ترجع بدون body، فمنحاول نقرا الـ JSON
  // بأمان بدون ما نوقّع لو كان فاضي
  let result = {};
  try {
    result = await response.json();
  } catch (e) {}

  if (!response.ok) {
    const details = result.errors ? Object.values(result.errors).flat().join(' / ') : '';
    throw new Error(details || result.message || errorMessage || 'حدث خطأ ما');
  }

  return result;
}

export async function registerUser(data) {
  await getCsrfCookie();
  return request('/api/auth/register', {
    method: 'POST',
    body: data,
    errorMessage: 'حدث خطأ أثناء إنشاء الحساب',
  });
}

export async function loginUser(data) {
  await getCsrfCookie();

  const result = await request('/api/auth/login', {
    method: 'POST',
    body: data,
    errorMessage: 'خطأ في البريد الإلكتروني أو كلمة المرور',
  });

  // مسح أي بيانات جلسة سابقة قبل تخزين الجديدة
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  localStorage.setItem('token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));

  return result;
}

export async function apiPostWithAuth(endpoint, data) {
  return request(endpoint, { method: 'POST', body: data });
}

export async function createStore(data) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('bio', data.bio || '');
  formData.append('phone', data.phone);
  formData.append('city', data.city);
  formData.append('accepts_whatsapp_orders', data.accepts_whatsapp_orders ? 1 : 0);
  if (data.image) {
    formData.append('image', data.image);
  }

  return request('/api/stores', {
    method: 'POST',
    body: formData,
    isFormData: true,
    errorMessage: 'حدث خطأ أثناء إنشاء المتجر',
  });
}

export async function getMyStore() {
  return request('/api/stores/me', {
    errorMessage: 'تعذر جلب بيانات المتجر',
  });
}

export async function logoutUser() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.log('logout error (ignored):', err);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// ملاحظة: تعديل المتجر بيصير دايمًا على متجر المستخدمة الحالية —
// endpoint الصحيح PATCH /api/stores/me (من غير storeId بالمسار، حسب توثيق الباك اند)
export async function updateStore(data) {
  const formData = new FormData();
  // Laravel بيحتاج POST + _method=PATCH لما بيكون فيه ملف (multipart/form-data)
  formData.append('_method', 'PATCH');
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.bio !== undefined) formData.append('bio', data.bio);
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.city !== undefined) formData.append('city', data.city);
  if (data.accepts_whatsapp_orders !== undefined) {
    formData.append('accepts_whatsapp_orders', data.accepts_whatsapp_orders ? 1 : 0);
  }
  // سويتش "استقبال الطلبات" — حقل منفصل تمامًا عن استقبال طلبات واتساب
  if (data.is_accepting_orders !== undefined) {
    formData.append('is_accepting_orders', data.is_accepting_orders ? 1 : 0);
  }
  // نسبة العمولة — صارت مدعومة فعليًا بالباك اند (commission_rate)
  if (data.commission_rate !== undefined) {
    formData.append('commission_rate', data.commission_rate);
  }
  if (data.image) {
    formData.append('image', data.image);
  }

  return request('/api/stores/me', {
    method: 'POST',
    body: formData,
    isFormData: true,
    errorMessage: 'حدث خطأ أثناء تحديث بيانات المتجر',
  });
}

export async function updateProfile(data) {
  const hasImage = !!data.image;

  let result;
  if (hasImage) {
    // فيه ملف => لازم multipart/form-data. الباك اند (Laravel) ما بيقرأ PUT حقيقي
    // مع FormData، فلازم نبعتها POST مع حقل _method=PUT (method override)
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (data.full_name !== undefined) formData.append('full_name', data.full_name);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    formData.append('image', data.image);

    result = await request('/api/auth/profile', {
      method: 'POST',
      body: formData,
      isFormData: true,
      errorMessage: 'حدث خطأ أثناء تحديث الصورة',
    });
  } else {
    // تعديل نصي بس (بدون صورة) => JSON عادي بـ PUT حقيقي، زي ما كان
    const body = {};
    if (data.full_name !== undefined) body.full_name = data.full_name;
    if (data.phone !== undefined) body.phone = data.phone;

    result = await request('/api/auth/profile', {
      method: 'PUT',
      body,
      errorMessage: 'حدث خطأ أثناء تحديث البيانات',
    });
  }

  // نحدّث localStorage بالبيانات الحقيقية الراجعة من الباك اند (مش بس محليًا متل قبل)
  localStorage.setItem('user', JSON.stringify(result.user));

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
    notes: s.notes || '',
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
    notes: service.notes || '',
    is_available: service.available,
  };
}

export async function getServices() {
  const result = await request('/api/services', {
    errorMessage: 'تعذر جلب الخدمات',
  });
  const list = result.services || result.data || result;
  return Array.isArray(list) ? list.map(mapServiceFromApi) : [];
}

export async function createService(service) {
  const result = await request('/api/services', {
    method: 'POST',
    body: mapServiceToApi(service),
    errorMessage: 'حدث خطأ أثناء إضافة الخدمة',
  });
  return mapServiceFromApi(result.service || result);
}

export async function updateService(id, service) {
  const result = await request(`/api/services/${id}`, {
    method: 'PATCH',
    body: mapServiceToApi(service),
    errorMessage: 'حدث خطأ أثناء إضافة الخدمة',
  });
  return mapServiceFromApi(result.service || result);
}

export async function toggleService(id) {
  const result = await request(`/api/services/${id}/toggle`, {
    method: 'PATCH',
    errorMessage: 'حدث خطأ أثناء تغيير حالة الخدمة',
  });
  return mapServiceFromApi(result.service || result);
}

export async function deleteService(id) {
  await request(`/api/services/${id}`, {
    method: 'DELETE',
    errorMessage: 'حدث خطأ أثناء حذف الخدمة',
  });
  return true;
}

export async function forgotPassword(email) {
  await getCsrfCookie();
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
  // النتيجة: { message, reset_token }
}

export async function resetPassword({ email, token, password, passwordConfirmation }) {
  await getCsrfCookie();
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    },
    errorMessage: 'حدث خطأ أثناء تعيين كلمة المرور',
  });
}

export async function getOrderStats() {
  const result = await request('/api/orders/stats', {
    errorMessage: 'تعذر جلب إحصائيات الطلبات',
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
export async function acceptOrder(id) {
  const result = await request(`/api/orders/${id}/accept`, {
    method: 'PATCH',
    errorMessage: 'تعذر قبول الطلب',
  });
  return mapOrderFromApi(result.order || result);
}

// رفض طلب
export async function rejectOrder(id) {
  const result = await request(`/api/orders/${id}/reject`, {
    method: 'PATCH',
    errorMessage: 'تعذر رفض الطلب',
  });
  return mapOrderFromApi(result.order || result);
}

function mapOrderItemFromApi(item) {
  return {
    id: item.id,
    name: item.product_name,
    image: item.image_url,
    sheinUrl: item.shein_url,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    notes: item.notes,
  };
}

function mapOrderFromApi(o) {
  return {
    id: o.id,
    customer: o.customer_name,
    date: o.created_at,
    // آخر وقت تحديث لحالة الطلب — هاد الحقل الوحيد المتوفر من الباك اند لتوثيق
    // وقت أي خطوة (ما في status history منفصل لكل خطوة لهلق)
    statusUpdatedAt: o.status_updated_at || o.updated_at || o.created_at,
    itemsCount: o.items_count ?? (o.items ? o.items.length : 0),
    amount: o.total_amount,
    status: o.status,
    items: (o.items || []).map(mapOrderItemFromApi),
  };
}

export async function getOrders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.date) params.append('date', filters.date);
  if (filters.search) params.append('search', filters.search);

  const result = await request(`/api/orders?${params.toString()}`, {
    errorMessage: 'تعذر جلب الطلبات',
  });

  const list = result.orders || result.data || result;
  return Array.isArray(list) ? list.map(mapOrderFromApi) : [];
}

export async function getOrderDetails(id) {
  const result = await request(`/api/orders/${id}`, {
    errorMessage: 'تعذر جلب تفاصيل الطلب',
  });
  return mapOrderFromApi(result.order || result);
}

// تحديث حالة الطلب (مسار الطلب) — endpoint PATCH /api/orders/{id}/status
// القيم المسموحة: pending, ordered_from_shein, shipped, arrived, inspected, received, cancelled
export async function updateOrderStatus(id, status) {
  const result = await request(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
    errorMessage: 'تعذر تحديث حالة الطلب',
  });
  return mapOrderFromApi(result.order || result);
}

// تقييمات الزبائن الحقيقية عن الوسيطة الحالية
function mapReviewFromApi(r) {
  return {
    id: r.id,
    customer: r.customer_name || r.customer || r.user_name || 'زبونة',
    date: r.created_at || r.date,
    rating: r.rating,
    comment: r.comment || r.review || '',
    orderId: r.order_id || r.orderId || null,
  };
}

// الرد من الباك اند فيه average_rating و total_reviews و distribution جاهزين —
// ما في داعي نحسبهم يدويًا بالفرونت
export async function getReviews() {
  const result = await request('/api/reviews', {
    errorMessage: 'تعذر جلب التقييمات',
  });

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

// ===== استكشاف الوسيطات (شاشة الزبونة) =====
// بيانات حقيقية بالكامل من الباك اند — بدون أي بيانات وهمية/ثابتة بالفرونت
function mapStoreFromApi(s) {
  const owner = s.user || s.owner || {};
  return {
    id: s.id,
    // اسم الوسيطة نفسها (صاحبة المتجر) — مش اسم المتجر
    name: owner.full_name || owner.name || s.full_name || s.owner_name || "وسيطة",
    // نبذة عني يلي كتبتها الوسيطة وقت إنشاء المتجر (أو عدّلتها لاحقًا من ملفها الشخصي)
    bio: s.bio || "",
    city: s.city || "",
    image: resolveStoreImageUrl(s.image_url || s.image),
    commission: s.commission_rate ?? null,
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
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
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
  const result = await request('/api/stores', {
    errorMessage: 'تعذر جلب قائمة الوسيطات',
  });

  const list = result.stores || result.data || result;
  return Array.isArray(list) ? list.map(mapStoreFromApi) : [];
}

export { BASE_URL };