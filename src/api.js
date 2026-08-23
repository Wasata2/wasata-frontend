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

  // حفظ التوكن وبيانات المستخدم محليًا
  localStorage.setItem('token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));

  return result;
}