import api from "./axios";


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


export const obtenerDashboard = async (view = "week", offset = 0) => {
  try {
    const response = await api.get("/ventas/dashboard/", {
      params: { view, offset },  // ⬅ solo estos dos parámetros
    });
    return response.data;
  } catch (error) {
    throw new Error(JSON.stringify(error.response?.data || "Error"));
  }
};

export const obtenerDashboardAdmin = async (view, offset) => {
  try {
    const res = await api.get(
      `/ventas/dashboard-admin/?view=${view}&offset=${offset}`
    );
    return res.data;
  } catch (error) {
    console.error("🔥 Error al obtener dashboard admin:", error);
    throw new Error("Error al obtener dashboard admin");
  }
};