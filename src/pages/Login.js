import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("يرجى تعبئة جميع الحقول.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await loginUser({
        email: form.email,
        password: form.password,
      });
      console.log("نجح تسجيل الدخول:", result);

      // التوجيه حسب نوع الحساب (role.name)

      const roleName = result.user.role.role_name;
      if (roleName === "broker") {
        navigate("/mediator-dashboard");
      } else if (roleName === "customer") {
        navigate("/customer-dashboard");
      } else {
        navigate("/"); // احتياطي لأي دور غير متوقع
      }
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
            <img src="/logo.PNG" alt="وساطة" className="logo-img" />
            وساطة
          </div>
          <Link to="/" className="back-link">
            العودة →
          </Link>
        </div>
      </header>

      <section className="signup-section">
        <div className="container">
          <div className="signup-card">
            <div className="signup-header">
              <div>
                <h1>مرحبًا بعودتك</h1>
                <p>سجّلي الدخول إلى حسابك في وساطة لمتابعة طلباتك وخدماتك.</p>
              </div>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="أدخلي البريد الإلكتروني"
                value={form.email}
                onChange={handleChange}
              />

              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="أدخلي كلمة المرور"
                value={form.password}
                onChange={handleChange}
              />

              <div className="login-options">
                <div className="signup-checkbox">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                  />
                  <label htmlFor="remember">تذكرني</label>
                </div>
                <a href="#" className="forgot-link">
                  نسيت كلمة المرور؟
                </a>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary signup-submit"
                disabled={loading}
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول ←"}
              </button>
            </form>

            <p className="signup-footer">
              ليس لديك حساب؟ <Link to="/account-type">إنشاء حساب جديد</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
