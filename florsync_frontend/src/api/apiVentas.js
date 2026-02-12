import axios from "axios";

export const registrarVenta = async (ventaData) => {
    try {
        console.log("📤 Enviando datos a la API:", ventaData);  // Ver qué se está enviando

        const response = await axios.post(`${API_URL}/realizar-ventas/`, ventaData);

        console.log("📥 Respuesta de la API:", response.data); // Ver la respuesta de la API

        return response.data;
    } catch (error) {
        console.error("🔥 Error en registrarVenta:", error);

        const mensaje = error.response?.data?.message || error.response?.data || "Error al registrar la venta";

        console.error("Registrar venta:", mensaje);
        throw new Error(mensaje);
    }
};