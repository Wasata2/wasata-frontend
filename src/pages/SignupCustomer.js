import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

export default function SignupCustomer() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    agree: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      setError('يرجى تعبئة جميع الحقول.');
      return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (!form.agree) {
      setError('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await registerUser({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'customer'
      });
      console.log('نجح التسجيل:', result);

      // تسجيل دخول تلقائي بعد نجاح إنشاء الحساب — نفس اللي بتعمله صفحة تسجيل الدخول
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }

      navigate('/customer-dashboard');
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
          <Link to="/account-type" className="back-link">العودة →</Link>
        </div>
      </header>

      <section className="signup-section">
        <div className="container">
          <div className="signup-card">

            <div className="signup-header">
              <div>
                <h1>إنشاء حساب جديد</h1>
                <p>أنشئي حسابك وابدئي تجربتك مع وساطة</p>
              </div>
              <div className="account-type-box">
                <div className="account-type-icon">👤</div>
                <span className="account-type-label">زبونة</span>
              </div>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="password-field">
                  <label htmlFor="fullName">الاسم الكامل</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="أدخلي اسمك الكامل"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className="password-field">
                  <label htmlFor="email">البريد الإلكتروني</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="password-field">
                  <label htmlFor="phone">رقم الهاتف</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+966 5X XXX XXXX"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="password-field">
                  <label htmlFor="password">كلمة المرور</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="أدخلي كلمة المرور"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="signup-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                />
                <label htmlFor="terms">أوافق على <a href="#">الشروط والأحكام</a> و <a href="#">سياسة الخصوصية</a>.</label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn btn-primary signup-submit" disabled={loading}>
                {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب →'}
              </button>
            </form>

           <p className="signup-footer">لديكِ حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
          </div>
        </div>
      </section>
    </div>
  );
}