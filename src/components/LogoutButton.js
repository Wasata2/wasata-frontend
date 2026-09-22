import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
        <button className="sidebar-logout-btn" onClick={handleLogout} title="تسجيل الخروج">
      تسجيل الخروج 
    </button>
  );
}