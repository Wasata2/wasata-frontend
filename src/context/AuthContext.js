import { createContext, useContext, useState } from "react";
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser } from "../api";

// الصندوق نفسه — لسه فاضي، رح نحطله قيمة أسفل بالـ Provider
const AuthContext = createContext(null);

// دالة مساعدة: تقرأ بيانات المستخدمة من localStorage بأمان
// (لو القيمة تالفة أو مش موجودة، ترجع null بدل ما توقع التطبيق)
function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// هاي المكون اللي رح "يلف" حوالين التطبيق كله بملف App.js
// أي مكون جوا AuthProvider بيقدر يوصل لبيانات المستخدمة
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  async function login(credentials) {
    const result = await apiLoginUser(credentials);
    setUser(result.user);
    setToken(result.token);
    return result;
  }

  async function logout() {
    await apiLogoutUser();
    setUser(null);
    setToken(null);
  }

  // بتسمح لأي مكون (متل صفحة الملف الشخصي) إنه يحدّث بيانات المستخدمة
  // بالـ context مباشرة بعد ما يحدّثها بالباك اند، بدون الحاجة لـ refresh
  // للصفحة عشان التغيير ينعكس بمكونات تانية زي النافبار/السايدبار
  function updateUser(updatedUser) {
    setUser(updatedUser);
    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch {
      // تجاهل أي خطأ بالتخزين المحلي، الـ state بالذاكرة تحدّث برضو
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    role: user?.role?.role_name || null,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth لازم يُستخدم جوا AuthProvider");
  }
  return context;
}