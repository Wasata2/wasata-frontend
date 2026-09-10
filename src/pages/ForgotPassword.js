import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      // ملاحظة: لسا ما في بريد إلكتروني حقيقي (SMTP) مفعّل، فالباك اند بيرجع
      // reset_token مباشرة بالـ response — منستخدمه فورًا ونوديها لصفحة
      // تعيين كلمة المرور. هاد مؤقت 100% وبيتغيّر لما ينفعّل الإيميل الحقيقي.
      navigate(
        `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(result.reset_token)}`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <header className="account-header">
        <div className="container">
          <div className="logo">
            <img src="/logo.svg" alt="وساطة" className="logo-img" />
            وساطة
          </div>
          <Link to="/login" className="back-link">
            العودة →
          </Link>
        </div>
      </header>

      <section className="signup-section">
        <div className="container forgot-password-container">
          <div className="signup-card forgot-password-card">
            <div className="signup-header">
              <div>
                <div className="page-icon-title">
                  <span className="page-icon-badge">🔒</span>
                  <h1>نسيت كلمة المرور؟</h1>
                </div>
                <p>أدخلي البريد الإلكتروني لتغيير كلمة المرور.</p>
              </div>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="أدخلي البريد الإلكتروني لتغيير كلمة المرور"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary signup-submit"
                disabled={loading}
              >
                {loading ? "جاري الإرسال..." : "متابعة"}
              </button>
            </form>

            <p className="signup-footer">
              تذكرت كلمة المرور؟ <Link to="/login">تسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}