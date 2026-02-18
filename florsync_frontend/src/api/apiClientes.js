import api from "./axios";

export const obtenerClientes = async () => {
  const res = await api.get("/clientes/");
  return res.data;
};

export const crearCliente = async (data) => {
  const res = await api.post("/clientes/", data);
  return res.data;
};

export const actualizarCliente = async (cedula, data) => {
  const res = await api.put(`/clientes/${cedula}/`, data);
  return res.data;
};

export const eliminarCliente = async (cedula) => {
  const res = await api.delete(`/clientes/${cedula}/`);
  return res.data;
};

export const buscarClientePorCedula = async (cedula) => {
  try {
    const res = await api.get(`/clientes/${cedula}/`);
    return res.data;
  } catch {
    return null;
  }
};
