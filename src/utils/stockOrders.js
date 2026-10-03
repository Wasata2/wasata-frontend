// طلبات القطع الراكدة عند الزبونة.
// لما الزبونة بتطلب قطعة، الباك اند بيحجزها (reserve) بس ما بيرجّع لها طلب ضمن GET /api/my-orders،
// فبنحفظ نسخة من بيانات القطعة والوسيطة بالمتصفح (لكل حساب) ونعرضها مع الطلبات النشطة.
// لما الباك اند يجهّز مسار طلبات القطع (reserve بيرجّع order_id)، بنخزّن orderId مع الطلب
// وبنقرا حالته الحقيقية من الباك اند (تم الاستلام / ملغي) بدل التخمين.
import { getStoreStockItems, getMyOrderDetail } from "../api";

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
export function saveStockOrder(userId, { item, mediator, delivery = {}, orderId = null }) {
  const order = {
    itemId: item.id,
    orderId: orderId ?? null, // رقم الطلب الحقيقي بالباك اند (لو reserve رجّعه)
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

// حالة الطلب الحقيقية من الباك اند ← حالة طلب القطعة عندنا
function statusFromRealOrder(status) {
  if (status === "received" || status === "completed") return "received";
  if (status === "cancelled" || status === "rejected") return "cancelled";
  return "ordered";
}

// مزامنة حالة طلبات القطع:
// 1) الطلبات اللي الها orderId حقيقي: بنقرا حالتها من GET /api/orders/{id}
//    (الوسيطة أكدت البيع ← received، ألغت الحجز ← cancelled)
// 2) الطلبات القديمة بدون orderId: لو القطعة رجعت "معروضة للبيع" يعني الوسيطة ألغت الحجز.
//    (تأكيد البيع بدون طلب حقيقي ما بنقدر نكتشفه من جهة الزبونة)
export async function syncStockOrders(userId) {
  const list = readStockOrders(userId);
  const pending = list.filter((o) => o.status === "ordered");
  if (pending.length === 0) return list;

  const updates = new Map(); // itemId ← الحالة الجديدة

  const withOrderId = pending.filter((o) => o.orderId);
  await Promise.all(
    withOrderId.map((o) =>
      getMyOrderDetail(o.orderId)
        .then((detail) => {
          const next = statusFromRealOrder(detail.status);
          if (next !== "ordered") updates.set(String(o.itemId), next);
        })
        .catch(() => {})
    )
  );

  const legacy = pending.filter((o) => !o.orderId);
  if (legacy.length > 0) {
    const storeIds = [...new Set(legacy.map((o) => o.storeId))];
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
    legacy.forEach((o) => {
      if (relisted.has(String(o.itemId))) updates.set(String(o.itemId), "cancelled");
    });
  }

  if (updates.size === 0) return list;
  const next = list.map((o) =>
    updates.has(String(o.itemId)) && o.status === "ordered"
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