import { useServerNotifications } from "./serverNotifications";

// إشعارات الزبونة: صارت من الباك اند (GET /api/notifications) بدل ما نحسبها من حالة الطلبات.
export function useCustomerNotifications(enabled = true) {
  return useServerNotifications(enabled);
}