// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 5000, // opcional recomendado
});

//  Enviar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//  Manejo de errores + refresh + servidor apagado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLoginRequest = originalRequest.url.includes("/usuarios/login/");

    //  NO tocar errores del login
    if (isLoginRequest) {
      return Promise.reject(error);
    }

    // servidor apagado
    if (!error.response) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // access expirado
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh");

        const res = await axios.post(
          "http://localhost:8000/api/token/refresh/",
          { refresh }
        );

        localStorage.setItem("access", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
