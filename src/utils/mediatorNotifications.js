import { useServerNotifications } from "./serverNotifications";

// إشعارات الوسيطة: صارت من الباك اند (GET /api/notifications) بدل ما نحسبها من حالة الطلبات.
export function useMediatorNotifications(enabled = true) {
  return useServerNotifications(enabled);
}