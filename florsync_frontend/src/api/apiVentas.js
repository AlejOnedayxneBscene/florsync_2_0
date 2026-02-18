import api from "./axios";

/* ============================
   REGISTRAR VENTA
============================ */
export const registrarVenta = async (ventaData) => {
  try {
    console.log("📤 Enviando datos a la API:", ventaData);

    const response = await api.post(
      "/ventas/realizar-ventas/",
      ventaData
    );

    console.log("📥 Respuesta de la API:", response.data);

    return response.data;

  } catch (error) {
    console.error("🔥 Error en registrarVenta:", error);

    throw new Error(
      JSON.stringify(
        error.response?.data || "Error al registrar la venta"
      )
    );
  }
};

/* ============================
   OBTENER VENTAS
============================ */
export const obtenerVentas = async (fecha) => {
  try {
    const params = fecha ? { fecha } : {};

    const response = await api.get(
      "/ventas/obtener_ventas/",
      { params }
    );

    return response.data;

  } catch (error) {
    console.error("🔥 Error al obtener ventas:", error);

    throw new Error(
      JSON.stringify(
        error.response?.data || "Error al obtener las ventas"
      )
    );
  }
};
