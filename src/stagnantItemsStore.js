// هاد الملف صار للثوابت وأدوات العرض بس (الفئات، الأيقونة، تسمية الحالة).
// جلب/حفظ القطع الفعلي صار عن طريق الباك اند (شوفي دوال stock-items بملف api.js).

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