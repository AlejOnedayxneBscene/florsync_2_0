import { createContext, useContext, useEffect, useState, useRef } from "react";

const AuthContext = createContext();
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 2 minutos

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null indica que aún estamos verificando
  const [isAuthLoaded, setIsAuthLoaded] = useState(false); // Indica si la autenticación ha sido verificada
  const inactivityTimer = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      alert("La sesión ha expirado por inactividad.");
      logout();
    }, INACTIVITY_LIMIT);
  };

  const startTracking = () => {
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);
  };

  const stopTracking = () => {
    window.removeEventListener("mousemove", resetInactivityTimer);
    window.removeEventListener("keydown", resetInactivityTimer);
    window.removeEventListener("click", resetInactivityTimer);
    window.removeEventListener("scroll", resetInactivityTimer);
    clearTimeout(inactivityTimer.current);
  };

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");

    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsAuthLoaded(true); // Una vez se haya verificado el estado, cambiamos el estado de carga
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking(); // Limpieza al desmontar
  }, [isAuthenticated]);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    resetInactivityTimer();
    startTracking();
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    clearTimeout(inactivityTimer.current);
    stopTracking();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isAuthLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);