import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Modulo from "./pages/Modulo"; 
import Registrar from "./pages/Registrar"; 
import Visualizar from "./pages/Visualizar"; 
import VisualizarCliente from "./pages/visualizarCliente";
import Modificar from "./pages/Modificar";
import Ventas from "./pages/RealizaVentas"; 
import RealizarVenta from "./pages/FinalizarVenta";
import Eliminar from "./pages/Eliminar";
import VentasMostrar from "./pages/VisualizarVentas";
import Informe from "./pages/Informe";


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

         
          <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/modulo/:nombre" element={<ProtectedRoute><Modulo /></ProtectedRoute>} />
          <Route path="/registrar/:tipo" element={<ProtectedRoute><Registrar /></ProtectedRoute>} />
          <Route path="/visualizar/:tipo" element={<ProtectedRoute><Visualizar /></ProtectedRoute>} />
          <Route path="/Visualizar-cliente/:tipo" element={<ProtectedRoute><VisualizarCliente /></ProtectedRoute>} />
          <Route path="/modificar/:tipo" element={<ProtectedRoute><Modificar /></ProtectedRoute>} />
          <Route path="/registrar-venta" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
          <Route path="/realizarVenta" element={<ProtectedRoute><RealizarVenta /></ProtectedRoute>} />
          <Route path="/realizarVenta" element={<ProtectedRoute><RealizarVenta /></ProtectedRoute>} />
          <Route path="/eliminar/:tipo" element={<ProtectedRoute><Eliminar /></ProtectedRoute>} />
          <Route path="/visualizar-historial/:tipo" element={<ProtectedRoute><VentasMostrar /></ProtectedRoute>} />
          <Route path="/informe/:tipo" element={<ProtectedRoute><Informe /></ProtectedRoute>} />

  
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;



