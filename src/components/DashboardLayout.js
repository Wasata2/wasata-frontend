import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import LogoutButton from "./LogoutButton";

const BROKER_LINKS = [
  { to: "/", icon: "🏠", label: "الرئيسية" },
  { to: "/mediator-dashboard", icon: "▦", label: "لوحة التحكم" },
  { to: "/mediator-orders", icon: "📋", label: "الطلبات", showBadge: true },
  { to: "/mediator-services", icon: "🛍", label: "الخدمات" },
  { to: "/stagnant-items", icon: "📦", label: "القطع الراكدة" },
  { to: "/mediator-reviews", icon: "⭐", label: "التقييمات" },
  { to: "/mediator-profile", icon: "👤", label: "الملف الشخصي" },
];

const CUSTOMER_LINKS = [
  { to: "/", icon: "🏠", label: "الرئيسية" },
  { to: "/customer-dashboard", icon: "▦", label: "لوحة التحكم" },
  { to: "/my-orders", icon: "📋", label: "طلباتي" },
  { to: "/explore-mediators", icon: "🔍", label: "استكشاف الوسيطات" },
  { to: "/profile", icon: "👤", label: "الملف الشخصي" },
];

export default function DashboardLayout({
  role,
  ordersBadge,
  topbarExtra,
  avatarImage,
  notifBadge,
  notifLink,
  children,
}) {
  const { user } = useAuth();
  const { favoritesCount } = useFavorites();
  const location = useLocation();

  const links = role === "broker" ? BROKER_LINKS : CUSTOMER_LINKS;
  const roleLabel = role === "broker" ? "وسيطة" : "زبونة";

  const userName = user?.full_name || user?.name || roleLabel;
  const userInitial = userName.charAt(0);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="وساطة" className="logo-img" />
          وساطة
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${
                location.pathname === link.to ? "active" : ""
              }`}
            >
              <span className="sidebar-icon">{link.icon}</span> {link.label}
              {link.showBadge && ordersBadge > 0 && (
                <span className="sidebar-badge">{ordersBadge}</span>
              )}
            </Link>
          ))}
        </nav>

        <LogoutButton />
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="topbar-actions">
            {notifLink ? (
              <Link to={notifLink} className="notif-btn-wrap">
                <button className="notif-btn" aria-label="الإشعارات">
                  🔔
                </button>
                {notifBadge > 0 && <span className="notif-badge">{notifBadge}</span>}
              </Link>
            ) : (
              <button className="notif-btn" aria-label="الإشعارات">
                🔔
              </button>
            )}
            {role === "customer" && (
              <Link to="/favorites" className="notif-btn-wrap">
                <button
                  type="button"
                  className={`notif-btn fav-btn ${
                    location.pathname === "/favorites" ? "active" : ""
                  }`}
                  aria-label="المفضلة"
                >
                  ♡
                </button>
                {favoritesCount > 0 && <span className="notif-badge">{favoritesCount}</span>}
              </Link>
            )}
            {topbarExtra}
          </div>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-store">{roleLabel}</div>
            </div>
            <div
              className="user-avatar"
              style={
                avatarImage
                  ? {
                      backgroundImage: `url(${avatarImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!avatarImage && userInitial}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}