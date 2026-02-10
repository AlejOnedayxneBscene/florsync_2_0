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
    console.log("Inicio de sesión exitoso:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    throw error;
  }
};
