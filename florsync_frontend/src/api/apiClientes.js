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
  const res = await api.put(`/clientes/${cedula}/editar/`, data); 
  return res.data;
};

export const eliminarCliente = async (cedula) => {
  const res = await api.delete(`/clientes/${cedula}/eliminar/`); 
  return res.data;
};


export const buscarClientePorCedula = async (cedula) => {
  try {
    const res = await api.get(`/clientes/${cedula}/buscar/`);
    return res.data;
  } catch (error) {
    return null; // si no existe devuelve null
  }
};

