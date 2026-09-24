import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1>الصفحة غير موجودة</h1>
        <p>الرابط يلي فتحتيه مش موجود، يمكن يكون اتغيّر أو انحذف.</p>
        <Link to="/" className="btn btn-primary">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}