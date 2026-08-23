// src/api/axios.js

import axios from "axios";

const api = axios.create({
    baseURL: "https://florsync-2-0-1.onrender.com",
    timeout: 10000,
});

// Enviar token en cada request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Manejo de errores + refresh
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // Si no existe request, evitar errores
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // No intentar refresh en login
        const isLoginRequest =
            originalRequest.url?.includes("/usuarios/login/") ||
            originalRequest.url?.includes("/token/");

        if (isLoginRequest) {
            return Promise.reject(error);
        }

        // Servidor apagado / sin conexión
        if (!error.response) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            window.location.href = "/login";

            return Promise.reject(error);
        }

        // Access token expirado
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refresh = localStorage.getItem("refresh");

                if (!refresh) {
                    throw new Error("No existe refresh token");
                }

                const res = await axios.post(
                    "https://florsync-2-0-1.onrender.com/api/token/refresh/",
                    {
                        refresh: refresh,
                    }
                );

                localStorage.setItem("access", res.data.access);

                originalRequest.headers.Authorization =
                    `Bearer ${res.data.access}`;

                return api(originalRequest);

            } catch (err) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                window.location.href = "/login";

                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default api;