import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { RoleRoute } from "./components/RoleRoute";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import Historial from "./pages/Historial";
import Ventas from "./pages/RealizaVentas";
import VentasMostrar from "./pages/VisualizarVentas";
import Categorias from "./pages/Categorias";
import Inventario from "./pages/Inventario";
import Clientes from "./pages/Clientes";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";   
import ResetPassword from "./pages/ResetPassword";     
import DashboardAdmin from "./pages/DashboardAdmin";
       import CambiarPassword from "./pages/CambiarPassword";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoaded } = useAuth();
  if (!isAuthLoaded) return <div>Cargando...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />   
        <Route path="/reset-password" element={<ResetPassword />} />        
        <Route path="/cambiar-password" element={<CambiarPassword />} /> 
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/clientes" element={<Clientes />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="/historial" element={<RoleRoute roles={["Administrador"]}><Historial /></RoleRoute>} />
        <Route 
          path="/dashboard/general" 
          element={
            <RoleRoute roles={["Administrador"]}>
              <DashboardAdmin />
            </RoleRoute>
          } 
        />  
        <Route path="/inventario" element={<Inventario />} />
          <Route path="/ventas/nueva" element={<Ventas />} />
          <Route path="/ventas/historial" element={<VentasMostrar />} />
          <Route path="/categorias" element={<Categorias />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}