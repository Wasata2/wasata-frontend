const BASE_URL = 'https://wasata-backend-production-nojkxd.laravel.cloud';

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
export async function updateStore(storeId, data) {
  const token = localStorage.getItem('token');

  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.bio !== undefined) formData.append('bio', data.bio);
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.city !== undefined) formData.append('city', data.city);
  if (data.accepts_whatsapp_orders !== undefined) {
    formData.append('accepts_whatsapp_orders', data.accepts_whatsapp_orders ? 1 : 0);
  }
  if (data.image) {
    formData.append('image', data.image); 
  }

  const response = await fetch(`${BASE_URL}/api/stores/${storeId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      // ما نحدد Content-Type يدويًا — نفس مبدأ createStore
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

