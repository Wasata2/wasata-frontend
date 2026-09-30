// "الشوفان" للتقييمات: بنحفظ بالمتصفح آخر رقم تقييم شافته الوسيطة،
// وأي تقييم رقمه أكبر منه بيعتبر "جديد" (بيظهر بالجرس وبالقائمة الجانبية وبصفحة الإشعارات).
const keyFor = (userId) => `wasata_reviews_seen_${userId ?? "me"}`;

export function getLastSeenReviewId(userId) {
  try {
    return Number(localStorage.getItem(keyFor(userId))) || 0;
  } catch (e) {
    return 0;
  }
}

export function getUnseenReviews(userId, reviews) {
  const lastSeen = getLastSeenReviewId(userId);
  return (reviews || []).filter((r) => Number(r.id) > lastSeen);
}

// بنسجّل إنها شافت كل التقييمات الحالية (بتنعمل لما تفتح صفحة التقييمات)
export function markReviewsSeen(userId, reviews) {
  const ids = (reviews || []).map((r) => Number(r.id)).filter((n) => !Number.isNaN(n));
  try {
    localStorage.setItem(keyFor(userId), String(ids.length ? Math.max(...ids) : 0));
  } catch (e) {}
}