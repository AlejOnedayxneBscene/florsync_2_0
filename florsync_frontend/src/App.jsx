import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";

import Ventas from "./pages/RealizaVentas";
import VentasMostrar from "./pages/VisualizarVentas";
import Categorias from "./pages/Categorias";
import Inventario from "./pages/Inventario";
import Clientes from "./pages/Clientes";
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoaded } = useAuth();

  console.log("AUTH:", { isAuthenticated, isAuthLoaded });

  if (!isAuthLoaded) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};


export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* CLIENTES */}
          <Route path="/clientes" element={<Clientes />} />
         

          {/* INVENTARIO */}
          <Route path="/inventario" element={<Inventario />} />
         

          {/* VENTAS */}
          <Route path="/ventas/nueva" element={<Ventas />} />
          <Route path="/ventas/historial" element={<VentasMostrar />} />


           <Route path="/categorias" element={<Categorias />} />

        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
