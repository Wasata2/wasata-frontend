// طلبات القطع الراكدة عند الزبونة.
// لما الزبونة بتطلب قطعة، الباك اند بيحجزها (reserve) بس ما بيرجّع لها طلب ضمن GET /api/my-orders،
// فبنحفظ نسخة من بيانات القطعة والوسيطة بالمتصفح (لكل حساب) ونعرضها مع الطلبات النشطة.
// لما الباك اند يجهّز مسار طلبات القطع، بنستبدل readStockOrders بالنداء الحقيقي وباقي الشاشات بتضل زي ما هي.
import { getStoreStockItems } from "../api";

const keyFor = (userId) => `wasata_stock_orders_${userId ?? "me"}`;

// الحالات: ordered (تم الطلب) ← received (تم الاستلام)، أو cancelled (ألغتها الوسيطة)
export const STOCK_ORDER_LABELS = {
  ordered: "تم الطلب",
  received: "تم الاستلام",
  cancelled: "ملغي",
};

export function getCurrentUserId() {
  try {
    return JSON.parse(localStorage.getItem("user"))?.id ?? null;
  } catch (e) {
    return null;
  }
}

export function readStockOrders(userId) {
  try {
    const list = JSON.parse(localStorage.getItem(keyFor(userId)));
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeStockOrders(userId, list) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch (e) {}
}

export function getStockOrder(userId, itemId) {
  return readStockOrders(userId).find((o) => String(o.itemId) === String(itemId)) || null;
}

// بنحفظ طلب القطعة (لو نفس القطعة انطلبت قبل وانلغت، بنستبدل القديم)
export function saveStockOrder(userId, { item, mediator }) {
  const order = {
    itemId: item.id,
    name: item.name,
    image: item.image || null,
    category: item.category || "",
    price: item.price,
    color: item.color || "",
    size: item.size || "",
    storeId: mediator.id,
    storeName: mediator.name,
    storeImage: mediator.image || null,
    storePhone: mediator.phone || "",
    city: mediator.city || "",
    createdAt: new Date().toISOString(),
    status: "ordered",
  };
  const rest = readStockOrders(userId).filter((o) => String(o.itemId) !== String(item.id));
  writeStockOrders(userId, [order, ...rest]);
  return order;
}

// القطع المحجوزة أو المباعة ما بتظهر بقائمة القطع المعروضة، فلو القطعة رجعت "معروضة للبيع"
// يعني الوسيطة ألغت الحجز — منعلّم الطلب ملغي
export async function syncStockOrders(userId) {
  const list = readStockOrders(userId);
  const pending = list.filter((o) => o.status === "ordered");
  if (pending.length === 0) return list;

  const storeIds = [...new Set(pending.map((o) => o.storeId))];
  const relisted = new Set();
  await Promise.all(
    storeIds.map((storeId) =>
      getStoreStockItems(storeId)
        .then((items) => {
          items.forEach((it) => {
            if (it.status === "listed") relisted.add(String(it.id));
          });
        })
        .catch(() => {})
    )
  );

  if (relisted.size === 0) return list;
  const next = list.map((o) =>
    o.status === "ordered" && relisted.has(String(o.itemId)) ? { ...o, status: "cancelled" } : o
  );
  writeStockOrders(userId, next);
  return next;
}

// نفس شكل الطلب بقائمة "طلباتي"
export function toListOrder(o) {
  const type = o.status === "received" ? "completed" : o.status === "cancelled" ? "cancelled" : "active";
  return {
    id: `stock-${o.itemId}`,
    isStock: true,
    itemId: o.itemId,
    itemName: o.name,
    store: o.storeName || "—",
    storeId: o.storeId,
    itemsCount: 1,
    price: o.price,
    date: o.createdAt,
    rawStatus: o.status,
    type,
    statusLabel: STOCK_ORDER_LABELS[o.status] || STOCK_ORDER_LABELS.ordered,
  };
}