import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('home');

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
          <img src="/logo.PNG" alt="وساطة" className="logo-img" />
          وساطة
        </div>
        <nav>
          <ul>
            <li><a href="#home" className={activeSection === 'home' ? 'active' : ''}>الرئيسية</a></li>
            <li><a href="#how" className={activeSection === 'how' ? 'active' : ''}>كيف تعمل وساطة؟</a></li>
            <li><a href="#about" className={activeSection === 'about' ? 'active' : ''}>لماذا وساطة؟</a></li>
            <li><a href="#contact" className={activeSection === 'contact' ? 'active' : ''}>تواصل معنا</a></li>
          </ul>
        </nav>
        <div className="header-actions">
          <Link to="/account-type" className="btn btn-primary">إنشاء حساب</Link>
          <a href="#" className="btn btn-outline">تسجيل الدخول</a>
        </div>
      </div>
    </header>
  );
}