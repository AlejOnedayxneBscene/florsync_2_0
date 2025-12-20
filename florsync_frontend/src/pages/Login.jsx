import React, { useEffect, useState } from "react";
import { obtenerUsuarios, validarUsuario } from "../api/test.api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../css/styles.css";
import Button from "../components/iu/Button";
import Input from "../components/iu/Input";
import LoginContainer from "../components/iu/LoginContainer";
import LoginForms from "../components/iu/LoginForms";
import NameApp from "../components/iu/NameApp";
const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    id_usuario: "",
    password: "",
  });

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const res = await obtenerUsuarios();
        console.log("Usuarios obtenidos:", res.data);
        setUsuarios(res.data);
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      }
    }
    cargarUsuarios();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { id_usuario, password } = formData;

      if (!id_usuario || !password) {
        alert("Completa todos los campos");
        setLoading(false);
        return;
      }

      const res = await validarUsuario(id_usuario, password);

      if (res.autenticado) {
        login();
        navigate("/menu");
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      alert("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
  {/* Columna izquierda: imágenes */}
  <div className="w-full md:w-1/2 flex flex-col gap-4 h-full">
    <img src="/images/girasoles.png" alt="Girasoles" className="rounded-lg w-full h-full object-cover" />
  </div>

  {/* Columna derecha: formulario modular */}
 
  <LoginForms
    formData={formData}
    handleChange={handleChange}
    handleSubmit={handleSubmit}
    loading={loading}
  />
</LoginContainer>

  );
};

export default Login;
