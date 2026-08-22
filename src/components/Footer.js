export default function Footer() {
  return (
    <footer>
      <div className="container">
         <div className="logo">
          <img src="/logo.PNG" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav>
          <ul>
            <li><a href="javascript:void(0)">عن وساطة</a></li>
            <li><a href="javascript:void(0)">تواصل معنا</a></li>
            <li><a href="javascript:void(0)">الخصوصية</a></li>
            <li><a href="javascript:void(0)">الشروط والأحكام</a></li>
          </ul>
        </nav>
        <div className="copyright">© 2026 وساطة لسهولة وصول طلبك، جميع الحقوق محفوظة</div>
      </div>
    </footer>
  );
}