import React, { useEffect, useState } from "react";
import { obtenerUsuarios, validarUsuario } from "../api/apiUsuarios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../css/styles.css";
import LoginContainer from "../components/iu/LoginContainer";
import LoginForms from "../components/iu/LoginForms";
import Carousel from "../components/iu/Caurousel";
const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    id_usuario: "",
    password: "",
  });


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (event, setError, setFieldError) => {
  event.preventDefault();
  setLoading(true);

  try {
    const { id_usuario, password } = formData;

    if (!id_usuario || !password) {
      setError("Por favor digite todos los campos");
      if (!id_usuario) setFieldError(prev => ({ ...prev, id_usuario: true }));
      if (!password) setFieldError(prev => ({ ...prev, password: true }));
      setLoading(false);
      return;
    }

  const data = await validarUsuario(id_usuario, password);

if (data?.access) {
  login(data.access, data.refresh);
  navigate("/inventario");
} else {
  setError("Usuario o contraseña incorrectos");
}

  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    setError("Usuario o contraseña incorrectos");
  } finally {
    setLoading(false);
  }
};


  return (
<LoginContainer>
  <div className="flex flex-col md:flex-row w-full h-full gap-4">

    {/* Columna izquierda: slider */}
    <div className="w-full md:w-[55%] h-full max-h-full overflow-hidden rounded-lg">
      <Carousel />
    </div>

    {/* Columna derecha: formulario */}
    <div className="w-full md:w-[45%] flex justify-center items-center overflow-auto">
      <LoginForms
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </div>

  </div>
</LoginContainer>

);

};

export default Login;
