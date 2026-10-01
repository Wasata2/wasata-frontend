// مناطق التوصيل: الوسيطة بتحدد سعر توصيل لكل منطقة، والزبونة بتختار منطقتها وبينضاف السعر للإجمالي.
export const DELIVERY_REGIONS = ["غزة", "شمال غزة", "الوسطى", "خانيونس", "رفح"];

// بنقبل أكثر من شكل من الباك اند: مصفوفة [{region, fee}]، أو كائن {غزة: 10}، أو نص JSON
export function normalizeZones(raw) {
  let data = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  if (!data) return [];

  const list = Array.isArray(data)
    ? data.map((z) => ({
        region: z.region ?? z.name ?? z.area,
        fee: z.fee ?? z.price ?? z.amount,
      }))
    : Object.entries(data).map(([region, fee]) => ({ region, fee }));

  return list
    .map((z) => ({ region: String(z.region || "").trim(), fee: Number(z.fee) }))
    .filter((z) => z.region && Number.isFinite(z.fee) && z.fee >= 0);
}

// سعر التوصيل لمنطقة معيّنة (null لو المنطقة مش مختارة أو الوسيطة ما بتوصّل إلها)
export function zoneFeeFor(zones, region) {
  if (!region) return null;
  const zone = (zones || []).find((z) => z.region === region);
  return zone ? zone.fee : null;
}

export function feeLabel(fee) {
  if (fee === null || fee === undefined) return null;
  return fee > 0 ? `${fee} ₪` : "مجاني";
}