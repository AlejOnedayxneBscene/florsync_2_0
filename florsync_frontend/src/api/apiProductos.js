import api from "./axios";

export const obtenerProductos = async () => {
  const res = await api.get("/productos/"); // ✅ coincide con Django
  return res.data;
};

export const crearProducto = async (data) => {
  const res = await api.post("/productos/", data); // ✅ coincide con Django
  return res.data;
};

export const actualizarProducto = async (id, data) => {
  const res = await api.put(`/productos/${id}/editar/`, data); // ✅ coincide con Django
  return res.data;
};

export const eliminarProducto = async (id) => {
  const res = await api.delete(`/productos/${id}/eliminar/`); // ✅ coincide con Django
  return res.data;
};


