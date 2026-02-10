import { useAuth } from "./components/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoaded } = useAuth();

  console.log("AUTH:", { isAuthenticated, isAuthLoaded });

  // ⏳ esperar a que cargue el estado real de auth
  if (!isAuthLoaded) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
