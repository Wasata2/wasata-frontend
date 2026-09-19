export const BASE_URL = 'https://wasata-backend-production-nojkxd.laravel.cloud';

export async function getCsrfCookie() {
  await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
}

export async function registerUser(data) {
  await getCsrfCookie();

  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ أثناء إنشاء الحساب');
  }

  return result;
}

export async function loginUser(data) {
  await getCsrfCookie();

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'خطأ في البريد الإلكتروني أو كلمة المرور');
  }

  // مسح أي بيانات جلسة سابقة قبل تخزين الجديدة
  localStorage.clear();

  localStorage.setItem('token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));

  return result;
}
export async function apiPostWithAuth(endpoint, data) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ ما');
  }

  return result;
}

export async function createStore(data) {
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('bio', data.bio || '');
  formData.append('phone', data.phone);
  formData.append('city', data.city);
  formData.append('accepts_whatsapp_orders', data.accepts_whatsapp_orders ? 1 : 0);
  if (data.image) {
    formData.append('image', data.image);
  }

  const response = await fetch(`${BASE_URL}/api/stores`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      // ملاحظة: ما نحدد Content-Type يدويًا، المتصفح بيحددها تلقائيًا مع FormData
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ أثناء إنشاء المتجر');
  }

  return result;
}

export async function getMyStore() {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/stores/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر جلب بيانات المتجر');
  }

  return result;
}
export async function logoutUser() {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.log('logout error (ignored):', err);
  } finally {
    localStorage.clear();
  }
}
// ملاحظة: تعديل المتجر بيصير دايمًا على متجر المستخدمة الحالية —
// endpoint الصحيح PATCH /api/stores/me (من غير storeId بالمسار، حسب توثيق الباك اند)
export async function updateStore(data) {
  const token = localStorage.getItem('token');

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

  const response = await fetch(`${BASE_URL}/api/stores/me`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ أثناء تحديث بيانات المتجر');
  }

  return result;
}
export async function updateProfile(data) {
  const token = localStorage.getItem('token');

  const body = {};
  if (data.full_name !== undefined) body.full_name = data.full_name;
  if (data.phone !== undefined) body.phone = data.phone;

  const response = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ أثناء تحديث البيانات');
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
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/services`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'تعذر جلب الخدمات');
  }
  const list = result.services || result.data || result;
  return Array.isArray(list) ? list.map(mapServiceFromApi) : [];
}

export async function createService(service) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/services`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(mapServiceToApi(service)),
  });
  const result = await response.json();
 if (!response.ok) {
  const details = result.errors
    ? Object.values(result.errors).flat().join(' / ')
    : '';
  throw new Error(details || result.message || 'حدث خطأ أثناء إضافة الخدمة');
}
  return mapServiceFromApi(result.service || result);
}

export async function updateService(id, service) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/services/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(mapServiceToApi(service)),
  });
  const result = await response.json();
 if (!response.ok) {
  const details = result.errors
    ? Object.values(result.errors).flat().join(' / ')
    : '';
  throw new Error(details || result.message || 'حدث خطأ أثناء إضافة الخدمة');
}
  return mapServiceFromApi(result.service || result);
}

export async function toggleService(id) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/services/${id}/toggle`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ أثناء تغيير حالة الخدمة');
  }
  return mapServiceFromApi(result.service || result);
}
export async function deleteService(id) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/services/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let result = {};
    try { result = await response.json(); } catch (e) {}
    const details = result.errors ? Object.values(result.errors).flat().join(' / ') : '';
    throw new Error(details || result.message || 'حدث خطأ أثناء حذف الخدمة');
  }

  return true;
}
export async function forgotPassword(email) {
  await getCsrfCookie();

  const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ ما');
  }

  return result; // { message, reset_token }
}

export async function resetPassword({ email, token, password, passwordConfirmation }) {
  await getCsrfCookie();

  const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'حدث خطأ أثناء تعيين كلمة المرور');
  }

  return result;
}

export async function getOrderStats() {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/orders/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر جلب إحصائيات الطلبات');
  }

  // أسماء الحقول الحقيقية القادمة من الباك اند: total, new, in_progress, completed
  // (مش new_count/in_progress_count متل ما كنا مفترضين سابقًا)
  return {
    newCount: result.new ?? 0,
    inProgressCount: result.in_progress ?? 0,
    completedCount: result.completed ?? 0,
    total: result.total ?? 0,
  };
}

// قبول طلب — بينقل الحالة من pending إلى ordered_from_shein
export async function acceptOrder(id) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/orders/${id}/accept`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر قبول الطلب');
  }

  return mapOrderFromApi(result.order || result);
}

// رفض طلب
export async function rejectOrder(id) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/orders/${id}/reject`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر رفض الطلب');
  }

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
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.date) params.append('date', filters.date);
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`${BASE_URL}/api/orders?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر جلب الطلبات');
  }

  const list = result.orders || result.data || result;
  return Array.isArray(list) ? list.map(mapOrderFromApi) : [];
}

export async function getOrderDetails(id) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/orders/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر جلب تفاصيل الطلب');
  }

  return mapOrderFromApi(result.order || result);
}

// تحديث حالة الطلب (مسار الطلب) — endpoint PATCH /api/orders/{id}/status
// القيم المسموحة: pending, ordered_from_shein, shipped, arrived, inspected, received, cancelled
export async function updateOrderStatus(id, status) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/orders/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر تحديث حالة الطلب');
  }

  return mapOrderFromApi(result.order || result);
}

// تقييمات الزبائن الحقيقية عن الوسيطة الحالية (بدل بيانات وهمية) —
// نفس منطق mapOrderFromApi فوق: منحاول أكثر من اسم حقل محتمل لأن التسمية
// الدقيقة القادمة من الباك اند لسه ما تأكدنا منها 100%
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
// ما في داعي نحسبهم يدويًا بالفرونت زي ما كنا عم نعمل سابقًا
export async function getReviews() {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'تعذر جلب التقييمات');
  }

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