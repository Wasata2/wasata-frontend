import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

// المفضلة: بنخزّن أرقام (ids) الوسيطات اللي الزبونة ضافتها للمفضلة.
// مؤقتًا بـ localStorage (لكل مستخدمة مفتاح خاص فيها) لأنه ما في endpoint للمفضلة بالباك اند لسه.
// لما يجهز، بس بنبدّل readFavorites / writeFavorites بطلبات API وباقي الصفحات ما بتتغيّر.

const FavoritesContext = createContext(null);

function readFavorites(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // تجاهل أخطاء التخزين المحلي، الحالة بالذاكرة بتضل شغالة
  }
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const storageKey = `wasata_favorites_${user?.id ?? "guest"}`;

  const [ids, setIds] = useState(() => readFavorites(storageKey));
  const [loadedKey, setLoadedKey] = useState(storageKey);

  // لو تغيّرت المستخدمة (تسجيل خروج/دخول بحساب ثاني) منحمّل مفضلتها هي
  if (loadedKey !== storageKey) {
    setLoadedKey(storageKey);
    setIds(readFavorites(storageKey));
  }

  const toggleFavorite = useCallback(
    (mediatorId) => {
      setIds((prev) => {
        const next = prev.includes(mediatorId)
          ? prev.filter((id) => id !== mediatorId)
          : [...prev, mediatorId];
        writeFavorites(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const value = useMemo(
    () => ({
      favoriteIds: ids,
      favoritesCount: ids.length,
      isFavorite: (mediatorId) => ids.includes(mediatorId),
      toggleFavorite,
    }),
    [ids, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites لازم يُستخدم جوا FavoritesProvider");
  }
  return context;
}