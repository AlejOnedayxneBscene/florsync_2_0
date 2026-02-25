import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const RoleRoute = ({ roles, children }) => {
  const { user, isAuthLoaded } = useAuth();

  if (!isAuthLoaded) return <div>Cargando...</div>;

  const userGrupo = user?.grupo; 

  console.log("ROL DEL USUARIO:", userGrupo);

  if (!user || !roles.includes(userGrupo)) {
    return <Navigate to="/inventario" replace />;
  }

  return children;
};