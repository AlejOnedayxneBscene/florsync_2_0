// src/api/apiUsuarios.js
import api from "./axios"; // asegúrate que axios.js exista en el mismo folder

export const obtenerUsuarios = async () => {
  try {
    const response = await api.get("/usuarios/usuarios/");
    return response;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
};

export const validarUsuario = async (username, password) => {
  try {
    const response = await api.post("/usuarios/login/", { username, password });
    return response.data;
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    throw error;
  }
};

export const solicitarResetPassword = async (email) => {
  try {
    const response = await api.post("/usuarios/password-reset/", { email });
    return response.data;
  } catch (error) {
    console.error("Error al solicitar reset:", error.response?.data || error.message);
    throw error;
  }
};

// 
export const confirmarResetPassword = async (email, codigo, password) => {
  try {
    const response = await api.post("/usuarios/password-reset/change/", {
      email,
      codigo,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error al cambiar contraseña:", error.response?.data || error.message);
    throw error;
  }
};

export const cambiarPasswordProvisional = async (passwordActual, passwordNuevo) => {
  try {
    const response = await api.post("/usuarios/usuarios/cambiar_password/", {
      password_actual: passwordActual,
      password_nuevo: passwordNuevo,
    });
    return response.data;
  } catch (error) {
    const mensaje = error.response?.data?.error || "Error al cambiar contraseña";
    throw new Error(mensaje);
  }
};