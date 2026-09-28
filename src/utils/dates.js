// دوال التاريخ والوقت الموحّدة لكل الصفحات — بدل ما كل صفحة يكون عندها نسختها.
//
// الباك اند أحيانًا بيرجع التاريخ بدون معلومة عن المنطقة الزمنية (بدون Z أو offset)
// رغم إنه فعليًا UTC — فلو سلمناه متل ما هو لـ new Date() المتصفح بيفتهمه كأنه
// توقيت محلي وما بيعمل تحويل، فيطلع الوقت غلط. هون منضيف Z يدويًا لو مش موجودة.
export function parseApiDate(value) {
  if (!value || typeof value !== "string") return null;
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(hasTz ? normalized : `${normalized}Z`);
  return isNaN(d.getTime()) ? null : d;
}

// تاريخ فقط: ٢٧ سبتمبر ٢٠٢٦
export function formatDate(value) {
  if (!value) return "—";
  const d = parseApiDate(value);
  if (!d) return value;
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

// تاريخ + ساعة: ٢٧ سبتمبر ٢٠٢٦ — ١١:٠٠ م
export function formatDateTime(value) {
  if (!value) return "";
  const d = parseApiDate(value);
  if (!d) return value;
  const date = d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return `${date} — ${time}`;
}