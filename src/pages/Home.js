import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <span className="badge">⏱ منصة تنظيم طلبات ذكي</span>
            <h1>وسيطتك المناسبة، وطلبك تحت المتابعة</h1>
            <p>
              منصة تجمعك بوسيطك المناسب وتساعدك على اختيار الوسيطة المناسبة
              ومتابعة طلبك بسهولة، نحن نوفر بيئة آمنة وشفافة لجميع معاملاتك.
            </p>
            <div className="hero-ctas">
              <a href="#" className="btn btn-primary">
                ابدئي الآن
              </a>
              <a href="#how" className="btn btn-outline">
                كيف تعمل وساطة؟
              </a>
            </div>
            <div className="features-inline">
              <span className="feature-pill">
                <span className="check">✓</span> اختيار حسب الموقع{" "}
              </span>
              <span className="feature-pill">
                <span className="check">✓</span> متابعة واضحة للطلب
              </span>
              <span className="feature-pill">
                <span className="check">✓</span> وسيطات موثوقات
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="flow-card customer">
              <div className="icon-circle">👤</div>
              <div className="title">العميلة</div>
            </div>
            <div className="arrow-down">↓</div>
            <div className="flow-card center">
              <div className="title">WASATA وساطة</div>
            </div>
            <div className="arrow-down">↓</div>
            <div className="flow-card mediator">
              <div className="icon-circle">🛍</div>
              <div className="title">الوسيطة</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="container">
          <h2 className="section-title">كيف تعمل وساطة؟</h2>
          <div className="steps">
            <div className="step-card">
              <div className="step-icon">🔍</div>
              <h3>١. اختاري الوسيطة</h3>
              <p>
                ابحثي عن وسيطة قريبة منك بناءً على التقييم والموقع والعمولة.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">➤</div>
              <h3>٢. أرسلي طلبك</h3>
              <p>شاركي تفاصيل طلبك مع الوسيطة بأمان عبر منصتنا.</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🚚</div>
              <h3>٣. تابعي طلبك</h3>
              <p>تابعي حالة الطلب خطوة بخطوة حتى وصولك.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="why" id="about">
        <div className="container">
          <h2 className="section-title">لماذا وساطة؟</h2>
          <div className="why-grid">
            <div className="why-pill">
              <span className="ic">★</span> تقييمات وتجارب الزبائن
            </div>
            <div className="why-pill">
              <span className="ic">⏱</span> متابعة حالة الطلب
            </div>
            <div className="why-pill">
              <span className="ic">💳</span> عمولة واضحة
            </div>
            <div className="why-pill">
              <span className="ic">👥</span> وسيطات في مكان واحد
            </div>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="container">
          <h2 className="section-title">تواصل معنا</h2>
          <div className="contact-info">
            <a href="mailto:info@wasata.com" className="contact-item">
              <div className="contact-icon">✉</div>
              <div>
                <div className="contact-label">البريد الإلكتروني</div>
                <div className="contact-value">info@wasata.com</div>
              </div>
            </a>
            <a
              href="https://wa.me/970591234567"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-item"
            >
              <div className="contact-icon">📞</div>
              <div>
                <div className="contact-label">رقم الهاتف</div>
                <div className="contact-value">+970592465010</div>
              </div>
            </a>
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div>
                <div className="contact-label">الموقع</div>
                <div className="contact-value">قطاع غزة</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>جاهزة تبدئي طلبك؟</h2>
          <p>اختاري الوسيطة المناسبة وابدئي طلبك بخطوات بسيطة.</p>
          <div className="hero-ctas">
            <a href="#" className="btn btn-white">
              ابدئي الآن
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
