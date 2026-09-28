// عدد المنتجات: "1" لو كل منتج بكمية 1، أو "1 (عدد 2)" لو في كميات أكبر من 1
export function formatProductsCount(order) {
  const count = order?.itemsCount ?? 0;
  const qty = order?.totalQuantity;
  if (qty && qty > count) return `${count} (عدد ${qty})`;
  return `${count}`;
}