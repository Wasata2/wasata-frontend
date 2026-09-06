import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // TODO: ربط فعلي بالباك اند لما يصير عندنا endpoint لإرسال رابط/رمز تغيير كلمة المرور
      // (مثلاً POST /api/auth/forgot-password مع البريد الإلكتروني)
      console.log("طلب تغيير كلمة المرور لـ:", email);
      setSubmitted(true);
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
                <p>أدخل البريد الإلكتروني لتغيير كلمة المرور.</p>
              </div>
            </div>

            {submitted ? (
              <p className="form-success">
                تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني، تفقّدي صندوق الوارد.
              </p>
            ) : (
              <form className="signup-form" onSubmit={handleSubmit}>
                <label htmlFor="email">البريد الإلكتروني</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="أدخل البريد الإلكتروني   "
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
            )}

            <p className="signup-footer">
              تذكرت كلمة المرور؟ <Link to="/login">تسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}