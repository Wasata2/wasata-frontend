import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = ['home', 'how', 'about', 'contact'];

    const handleScroll = () => {
      let current = 'home';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header>
      <div className="container">
        <div className="logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <button
          className="nav-hamburger-btn"
          aria-label="فتح القائمة"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>

        <nav className={menuOpen ? 'open' : ''}>
          <div className="nav-mobile-header">
            <div className="nav-mobile-logo">
              <img src="/logo.svg" alt="وساطة" className="logo-img" />
              وساطة
            </div>
            <button
              className="nav-close-btn"
              aria-label="إغلاق القائمة"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <ul>
            <li><a href="#home" onClick={() => setMenuOpen(false)} className={activeSection === 'home' ? 'active' : ''}>الرئيسية</a></li>
            <li><a href="#how" onClick={() => setMenuOpen(false)} className={activeSection === 'how' ? 'active' : ''}>كيف تعمل وساطة؟</a></li>
            <li><a href="#about" onClick={() => setMenuOpen(false)} className={activeSection === 'about' ? 'active' : ''}>لماذا وساطة؟</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)} className={activeSection === 'contact' ? 'active' : ''}>تواصل معنا</a></li>
          </ul>
          <div className="nav-mobile-actions">
            <Link to="/account-type" className="btn btn-primary" onClick={() => setMenuOpen(false)}>إنشاء حساب</Link>
            <Link to="/login" className="btn btn-outline" onClick={() => setMenuOpen(false)}>تسجيل الدخول</Link>
          </div>
        </nav>
        <div className="header-actions">
          <Link to="/account-type" className="btn btn-primary">إنشاء حساب</Link>
          <Link to="/login" className="btn btn-outline">تسجيل الدخول</Link>
        </div>

        {menuOpen && (
          <div className="nav-overlay" onClick={() => setMenuOpen(false)} />
        )}
      </div>
    </header>
  );
}