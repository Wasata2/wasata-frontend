// عدد المنتجات: "1" لو كل منتج بكمية 1، أو "1 (عدد 2)" لو في كميات أكبر من 1
export function formatProductsCount(order) {
  const count = order?.itemsCount ?? 0;
  const qty = order?.totalQuantity;
  if (qty && qty > count) return `${count} (عدد ${qty})`;
  return `${count}`;
}

// وقت كل خطوة بمسار الطلب لحاله (مش وقت آخر تحديث مشترك بين كل الخطوات).
// الأولوية: الوقت الحقيقي من الباك اند (statusTimes) ← أول خطوة = وقت إنشاء الطلب
// ← الخطوة الحالية = وقت آخر تحديث. الخطوات اللي قبلها بدون وقت محفوظ ما منعرض إلها وقت
// (أحسن من عرض وقت غلط).
export function getStepTime(order, stepKey, index, currentIndex) {
  const saved = order?.statusTimes?.[stepKey];
  if (saved) return saved;
  if (index === 0) return order?.date || null;
  if (index === currentIndex) return order?.statusUpdatedAt || null;
  return null;
}

// دمج نتيجة PATCH (طلب "عاري" بدون اسم الزبونة والمنتجات) مع الطلب الحالي بالواجهة،
// عشان ما يضيع اسم الزبونة وعدد المنتجات بعد قبول/رفض/تحديث الحالة.
export function applyStatusUpdate(prev, updated) {
  if (!prev) return updated;
  return {
    ...prev,
    status: updated.status,
    statusUpdatedAt: updated.statusUpdatedAt,
    amount: updated.amount || prev.amount,
    totals: updated.totals || prev.totals,
    statusTimes: {
      ...(prev.statusTimes || {}),
      ...(updated.statusTimes || {}),
      ...(updated.status && updated.statusUpdatedAt
        ? {
            [updated.status]:
              (updated.statusTimes || {})[updated.status] ||
              updated.statusUpdatedAt,
          }
        : {}),
    },
  };
}
