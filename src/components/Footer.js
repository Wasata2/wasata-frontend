
export default function Footer() {
  return (
    <footer>
      <div className="container">
         <div className="logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav>
          <ul>
            {/* روابط بديلة مؤقتًا (Placeholder) لحد ما تنعمل صفحات حقيقية إلها */}
            {/* eslint-disable jsx-a11y/anchor-is-valid, no-script-url */}
            <li><a href="javascript:void(0)">عن وساطة</a></li>
            <li><a href="javascript:void(0)">تواصل معنا</a></li>
            <li><a href="javascript:void(0)">الخصوصية</a></li>            {/* eslint-enable jsx-a11y/anchor-is-valid, no-script-url */}
          </ul>
        </nav>
        <div className="copyright">© 2026 وساطة لسهولة وصول طلبك، جميع الحقوق محفوظة</div>
      </div>
    </footer>
  );
}