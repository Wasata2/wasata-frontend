import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      setError("رابط تعيين كلمة المرور غير صالح. يرجى طلب رابط جديد.");
      return;
    }
    if (!form.password || !form.confirmPassword) {
      setError("يرجى تعبئة جميع الحقول.");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword({
        email,
        token,
        password: form.password,
        passwordConfirmation: form.confirmPassword,
      });
      // نفس سلوك الباك اند: كل جلسات الدخول القديمة تنلغى تلقائيًا بعد النجاح
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      {/* نفس هيدر صفحات الحساب — بدون رابط "العودة" هالمرة */}
      <header className="account-header">
        <div className="container">
          <div className="logo">
            <img src="/logo.svg" alt="وساطة" className="logo-img" />
            وساطة
          </div>
        </div>
      </header>

      <section className="signup-section">
        <div className="container">
          <div className="signup-card">
            <div className="signup-header">
              <div>
                <h1>تعيين كلمة مرور جديدة</h1>
                <p>أنشئي كلمة مرور جديدة وآمنة لحسابك.</p>
              </div>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <label htmlFor="password">كلمة المرور الجديدة</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخلي كلمة المرور الجديدة"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="إظهار/إخفاء كلمة المرور"
                >
                  👁
                </button>
              </div>

              <label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</label>
              <div className="password-input-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="أعيدي إدخال كلمة المرور"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label="إظهار/إخفاء كلمة المرور"
                >
                  👁
                </button>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary signup-submit"
                disabled={loading}
              >
                {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
              </button>
            </form>
            {/* ملاحظة: تم حذف رابط "العودة إلى تسجيل الدخول" بالأسفل بناءً على طلبك */}
          </div>
        </div>
      </section>
    </div>
  );
}