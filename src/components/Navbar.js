import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header>
      <div className="container">
        <div className="logo">
          <img src="/logo.PNG" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav>
          <ul>
            <li>
              <a href="#" className="active">
                الرئيسية
              </a>
            </li>
            <li>
              <a href="#how">كيف تعمل وساطة؟</a>
            </li>
            <li>
              <a href="#about">لماذا وساطة؟</a>
            </li>
            <li>
              <a href="#contact">تواصل معنا</a>
            </li>
          </ul>
        </nav>
        <div className="header-actions">
          <Link to="/account-type" className="btn btn-primary">
            إنشاء حساب
          </Link>
          <a href="#" className="btn btn-outline">
            تسجيل الدخول
          </a>
        </div>
      </div>
    </header>
  );
}
