import { useState } from "react";
import { deleteAccount } from "../api";

// قسم "حذف الحساب" (للزبونة وللوسيطة): زر بيفتح نافذة تأكيد فيها كلمة المرور.
// isMediator بس بيغيّر نص التحذير (المتجر بيختفي من الاستكشاف).
export default function DeleteAccountSection({ isMediator = false }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const openModal = () => {
    setPassword("");
    setError("");
    setOpen(true);
  };

  const closeModal = () => {
    if (deleting) return;
    setOpen(false);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("اكتبي كلمة المرور لتأكيد الحذف.");
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await deleteAccount(password);
      // reload كامل بيصفّر حالة الجلسة بالتطبيق (التوكن اتمسح من deleteAccount)
      window.location.assign("/login");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="profile-card" style={{ marginTop: "24px" }}>
        <h2 className="order-details-section-title">حذف الحساب</h2>
        <p className="service-description">
          {isMediator
            ? "لو حذفتي حسابك، متجرك بيختفي من الاستكشاف وما رح تقدري تدخلي. بيانات الطلبات والتقييمات القديمة بتضل محفوظة."
            : "لو حذفتي حسابك ما رح تقدري تدخلي. طلباتك القديمة بتضل محفوظة عند الوسيطات، وتقييماتك بتظهر بدون اسمك."}
        </p>
        <p className="service-description">
          الحساب بيتخفى 30 يوم، وبعدها بيتحذف نهائيًا. خلال هالفترة تقدري تتواصلي مع الدعم لاسترجاعه.
          ما بيمكن الحذف لو عندك طلبات نشطة.
        </p>
        <button type="button" className="btn btn-outline" onClick={openModal}>
          حذف حسابي
        </button>
      </div>

      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>تأكيد حذف الحساب</span>
              <button className="modal-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form className="modal-body" onSubmit={handleDelete}>
              <p className="service-description">
                هاد الإجراء بيخفي حسابك. للتأكيد اكتبي كلمة المرور الحالية.
              </p>
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={deleting}
              />
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions confirm-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={deleting}
                >
                  رجوع
                </button>
                <button type="submit" className="btn-danger" disabled={deleting}>
                  {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}