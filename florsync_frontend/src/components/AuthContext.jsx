import { createContext, useContext, useEffect, useState, useRef } from "react";
import api from "../api/axios"; // tu instancia Axios con interceptores

const AuthContext = createContext();
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 min

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const inactivityTimer = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    inactivityTimer.current = setTimeout(() => {
      alert("La sesión ha expirado por inactividad");
      logout();
    }, INACTIVITY_LIMIT);
  };

  const startTracking = () => {
    ["mousemove", "keydown", "click", "scroll"].forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );
  };

  const stopTracking = () => {
    ["mousemove", "keydown", "click", "scroll"].forEach((event) =>
      window.removeEventListener(event, resetInactivityTimer)
    );
    clearTimeout(inactivityTimer.current);
  };

  // 🔐 Verificar sesión al cargar la app
 useEffect(() => {
  const checkAuth = async () => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (!access || !refresh) {
      setIsAuthenticated(false);
      setIsAuthLoaded(true);
      return;
    }

    try {
      // si access expiró, interceptor lo refresca solo
      await api.get("/usuarios/me/");
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    } finally {
      setIsAuthLoaded(true);
    }
  };

  checkAuth();
}, []);



useEffect(() => {
  if (!isAuthenticated) return;

  const interval = setInterval(async () => {
    try {
      await api.get("/usuarios/me/");
    } catch (err) {
      // servidor caído o token inválido
      logout();
    }
  }, 10000); // 10 segundos (puedes poner 30000 = 30s)

  return () => clearInterval(interval);
}, [isAuthenticated]);

const login = (access, refresh) => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);

  setIsAuthenticated(true);
  resetInactivityTimer();
  startTracking();
};

const logout = () => {
  setIsAuthenticated(false);
  stopTracking();
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
};

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, isAuthLoaded }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
