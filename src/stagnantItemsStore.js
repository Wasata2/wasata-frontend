// مخزن القطع الراكدة — مشترك بين صفحة الوسيطة (بتديرها) وملفها العام (الزبونة بتشوف المعروض منها).
// مؤقتًا بنخزّنها بـ localStorage لأنه ما في باك اند للقطع لسه؛ لما يجهز بنبدّل
// الدوال (load / save / loadListedItems) بطلبات API وباقي الكود ما بيتغيّر.

const STORAGE_KEY = "wasata_stagnant_items";

// الفئات المسموحة: ملابس وأحذية فقط
export const STAGNANT_CATEGORIES = ["ملابس", "أحذية"];

// حالات القطعة
export const STAGNANT_STATUS = {
  notListed: { label: "غير معروضة", className: "st-not-listed" },
  listed: { label: "معروضة للبيع", className: "st-listed" },
  reserved: { label: "محجوزة", className: "st-reserved" },
  sold: { label: "تم البيع", className: "st-sold" },
};

export function iconForCategory(category) {
  return category === "أحذية" ? "👟" : "👗";
}

// بيانات وهمية أولية — بتظهر أول مرة بس، قبل ما الوسيطة تعدّل أي شي
const INITIAL_ITEMS = [
  { id: 1, name: "فستان نسائي", category: "ملابس", icon: "👗", price: 85, status: "notListed", createdAt: "2026-09-20" },
  { id: 2, name: "حذاء رياضي نسائي", category: "أحذية", icon: "👟", price: 120, status: "listed", createdAt: "2026-09-18" },
  { id: 3, name: "جاكيت جينز", category: "ملابس", icon: "🧥", price: 60, status: "reserved", createdAt: "2026-09-12" },
  { id: 4, name: "صندل صيفي", category: "أحذية", icon: "👡", price: 45, status: "sold", createdAt: "2026-09-05" },
];

// كل وسيطة إلها مخزن خاص فيها (بالـ id تبع متجرها)، عشان كل وسيطة تشوف وتعرض قطعها هي بس
const keyFor = (storeId) => `${STORAGE_KEY}_${storeId}`;

function readStored(storeId) {
  try {
    const raw = localStorage.getItem(keyFor(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // لو القيمة تالفة منرجع null بدل ما يوقع التطبيق
  }
  return null;
}

// لصفحة الوسيطة نفسها: القطع المحفوظة، أو البيانات الأولية أول مرة
export function loadStagnantItems(storeId) {
  return readStored(storeId) || INITIAL_ITEMS;
}

export function saveStagnantItems(storeId, items) {
  try {
    localStorage.setItem(keyFor(storeId), JSON.stringify(items));
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

// للزبونة (وللمعاينة): القطع المعروضة للبيع عند وسيطة معيّنة بس
export function loadListedItems(storeId) {
  return (readStored(storeId) || []).filter((item) => item.status === "listed");
}