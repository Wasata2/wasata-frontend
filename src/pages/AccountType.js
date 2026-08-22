import { Link } from "react-router-dom";

export default function AccountType() {
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

      <section className="account-select">
        <div className="container">
          <h1>كيف تريدين استخدام وساطة؟</h1>
          <p>اختاري نوع الحساب المناسب لكِ للبدء في تجربة وساطة.</p>

          <div className="account-cards">
            <div className="account-card">
              <div className="account-icon">🏪</div>
              <h3>أنا وسيطة SHEIN</h3>
              <p>
                نظمي خدماتك، طلبات زبائنك ومواعيد استقبال الطلبات من مكان واحد،
                وسعي نطاق عملك باحترافية.
              </p>
              <Link
                to="/signup-mediator"
                className="btn btn-outline account-btn"
              >
                المتابعة كوسيطة ←
              </Link>
            </div>

            <div className="account-card">
              <div className="account-icon ">👤</div>
              <h3>أنا زبونة</h3>
              <p>
                ابحثي عن وسيطة مناسبة، أرسلي طلبك وتابعي حالته بسهولة وأمان من
                خلال منصة واحدة متكاملة.
              </p>
              <Link
                to="/signup-customer"
                className="btn btn-primary account-btn"
              >
                المتابعة كزبونة ←
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
