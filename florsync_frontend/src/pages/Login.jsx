import React, { useState } from "react";
import { validarUsuario } from "../api/apiUsuarios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import LoginContainer from "../components/iu/LoginContainer";
import LoginForms from "../components/iu/LoginForms";
import Carousel from "../components/iu/Caurousel";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
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

const handleSubmit = async (e, setError, setFieldError) => {
  e.preventDefault(); 

  setLoading(true);

  const { id_usuario, password } = formData;

  if (!id_usuario || !password) {
    setError("Por favor digite todos los campos");
    setFieldError((prev) => ({
      ...prev,
      ...(!id_usuario && { id_usuario: true }),
      ...(!password && { password: true }),
    }));
    setLoading(false);
    return;
  }

  try {
    const data = await validarUsuario(id_usuario, password);

    if (data?.access) {
      login(data.access, data.refresh, {
        id: data.id,
        username: data.username,
        grupo: data.grupo,
        debe_cambiar_password: data.debe_cambiar_password,
      });

      if (data.debe_cambiar_password) {
        navigate("/cambiar-password");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    setError("Usuario o contraseña incorrectos");
  } finally {
    setLoading(false);
  }
};

  return (
    <LoginContainer>
      <div className="flex flex-col md:flex-row w-full h-full gap-2 md:gap-4">
        {/* Left column: slider */}
        <div className="hidden md:block w-full md:w-[55%] h-auto md:h-full max-h-full overflow-hidden rounded-lg">
          <Carousel />
        </div>

        {/* Right column: form */}
        <div className="w-full md:w-[45%] flex justify-center items-center overflow-auto px-2 md:px-0">
          <LoginForms
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setFormData={setFormData}
            loading={loading}
          />
        </div>
      </div>
    </LoginContainer>
  );
};

export default Login;