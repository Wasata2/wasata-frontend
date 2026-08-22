const BASE_URL = 'https://wasata-backend-production-nojkxd.laravel.cloud';

// يجيب الـ CSRF cookie قبل أي طلب POST
export async function getCsrfCookie() {
  await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
}

// دالة عامة لإرسال أي طلب POST
export async function apiPost(endpoint, data) {
  await getCsrfCookie();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    throw new Error(result.message || 'حدث خطأ ما');
  }

  return result;
}