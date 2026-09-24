import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { MediatorCard } from "./ExploreMediators";
import { useFavorites } from "../context/FavoritesContext";
import { getStores } from "../api";

// صفحة المفضلة: بتعرض الوسيطات اللي الزبونة ضغطت على قلبها بصفحة الاستكشاف
export default function FavoriteMediators() {
  const navigate = useNavigate();
  const { favoriteIds } = useFavorites();

  const [mediators, setMediators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMediators = () => {
    setLoading(true);
    setError("");
    getStores()
      .then((list) => setMediators(list))
      .catch((err) => setError(err.message || "تعذر جلب قائمة الوسيطات"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMediators();
  }, []);

  // بنعرض بيانات الوسيطات المحدّثة من الباك اند، مرتبة من الأحدث إضافةً للمفضلة
  const favorites = useMemo(() => {
    return [...favoriteIds]
      .reverse()
      .map((id) => mediators.find((m) => m.id === id))
      .filter(Boolean);
  }, [favoriteIds, mediators]);

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-welcome">
        <h1>المفضلة</h1>
        <p>الوسيطات اللي أضفتيها للمفضلة بمكان واحد.</p>
      </div>

      {loading && <p className="explore-loading">جاري تحميل المفضلة...</p>}

      {!loading && error && (
        <div className="explore-empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>تعذر تحميل المفضلة</h3>
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={loadMediators}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div className="explore-empty-state">
          <div className="empty-icon">♡</div>
          <h3>ما في وسيطات بالمفضلة لسه</h3>
          <p>اضغطي على القلب بطاقة أي وسيطة عشان تضيفيها هون.</p>
          <Link to="/explore-mediators" className="btn btn-primary">
            استكشاف الوسيطات
          </Link>
        </div>
      )}

      {!loading && !error && favorites.length > 0 && (
        <section className="explore-section">
          <div className="explore-section-header">
            <h2>وسيطاتي المفضلة</h2>
            <span className="explore-section-count">{favorites.length} وسيطة</span>
          </div>
          <div className="explore-grid">
            {favorites.map((m) => (
              <MediatorCard
                key={m.id}
                mediator={m}
                onSelect={() => navigate("/new-order")}
                onViewProfile={() => navigate(`/mediators/${m.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}