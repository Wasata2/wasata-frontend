// طلبات القطع الراكدة عند الزبونة.
// لما الزبونة بتطلب قطعة، الباك اند بيحجزها (reserve) بس ما بيرجّع لها طلب ضمن GET /api/my-orders،
// فبنحفظ نسخة من بيانات القطعة والوسيطة بالمتصفح (لكل حساب) ونعرضها مع الطلبات النشطة.
// ملاحظة: القطع الراكدة ما إلها سجل Order حقيقي بالباك اند، فما في orderId نعتمد عليه.
// حالة الطلب (تم الاستلام / ملغي) بتيجي من GET /api/my-stock-orders.
import { getStoreStockItems, getMyStockReservations } from "../api";

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

// رسوم التوصيل (بس لو الاستلام توصيل للمنزل) + الإجمالي النهائي = سعر القطعة + الرسوم
export function getStockOrderFee(o) {
  if (!o || o.deliveryMethod !== "home_delivery") return 0;
  return Number(o.deliveryFee) || 0;
}

export function getStockOrderTotal(o) {
  if (!o) return 0;
  return (Number(o.price) || 0) + getStockOrderFee(o);
}

// بنحفظ طلب القطعة (لو نفس القطعة انطلبت قبل وانلغت، بنستبدل القديم)
export function saveStockOrder(userId, { item, mediator, delivery = {} }) {
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
    // طريقة الاستلام: "home_delivery" (توصيل للمنزل) أو "pickup" (استلام من نقطة)
    deliveryMethod: delivery.method || "pickup",
    address: delivery.address || "",
    contactPhone: delivery.contactPhone || "",
    deliveryRegion: delivery.region || "",
    deliveryFee: delivery.fee ?? null,
    pickupLocation: delivery.pickupLocation || "",
    customerNote: delivery.note || "",
    createdAt: new Date().toISOString(),
    status: "ordered",
  };
  const rest = readStockOrders(userId).filter((o) => String(o.itemId) !== String(item.id));
  writeStockOrders(userId, [order, ...rest]);
  return order;
}

// حالة الحجز بالباك اند ← حالة طلب القطعة عندنا
function statusFromReservation(status) {
  if (status === "sold") return "received"; // الوسيطة أكدت البيع ← تم الاستلام
  if (status === "cancelled") return "cancelled"; // الوسيطة ألغت الحجز ← ملغي
  return "ordered"; // reserved
}

// مزامنة حالة طلبات القطع من GET /api/my-stock-orders (حجوزات الزبونة: reserved | sold | cancelled).
// لو الزبونة حجزت نفس القطعة أكتر من مرة، بناخد آخر حجز. ولو الـ endpoint فشل، بنرجع للطريقة القديمة:
// لو القطعة رجعت "معروضة للبيع" يعني الحجز انلغى.
export async function syncStockOrders(userId) {
  const list = readStockOrders(userId);
  const pending = list.filter((o) => o.status === "ordered");
  if (pending.length === 0) return list;

  const updates = new Map(); // itemId ← الحالة الجديدة

  let reservations = null;
  try {
    reservations = await getMyStockReservations();
  } catch (e) {
    reservations = null;
  }

  if (reservations) {
    const latest = new Map();
    reservations.forEach((r) => {
      const key = String(r.itemId);
      const cur = latest.get(key);
      if (!cur || String(r.reservedAt) > String(cur.reservedAt)) latest.set(key, r);
    });
    pending.forEach((o) => {
      const r = latest.get(String(o.itemId));
      if (!r) return;
      const next = statusFromReservation(r.status);
      if (next !== "ordered") updates.set(String(o.itemId), next);
    });
  } else {
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
    pending.forEach((o) => {
      if (relisted.has(String(o.itemId))) updates.set(String(o.itemId), "cancelled");
    });
  }

  if (updates.size === 0) return list;
  const next = list.map((o) =>
    o.status === "ordered" && updates.has(String(o.itemId))
      ? { ...o, status: updates.get(String(o.itemId)) }
      : o
  );
  writeStockOrders(userId, next);
  return next;
}

// نفس شكل الطلب بقائمة "طلباتي" — السعر هون شامل التوصيل
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
    price: getStockOrderTotal(o),
    date: o.createdAt,
    rawStatus: o.status,
    type,
    statusLabel: STOCK_ORDER_LABELS[o.status] || STOCK_ORDER_LABELS.ordered,
  };
}