import api from "./axios";

export const obtenerCategorias = async () => {
  const res = await api.get("/categorias/");
  return res.data;
};

export const crearCategoria = async (data) => {
  const res = await api.post("/categorias/", data);
  return res.data;
};

export const actualizarCategoria = async (id, data) => {
  const res = await api.put(`/categorias/${id}/editar/`, data);
  return res.data;
};

export const eliminarCategoria = async (id) => {
  const res = await api.delete(`/categorias/${id}/eliminar/`);
  return res.data;
};


const cargarProductos = async () => {
  try {
    const data = await obtenerProductos();
    const productosConCategoria = data.map((p) => {
      const cat = categorias.find((c) => c.id_categoria === p.categoria);
      return {
        ...p,
        categoria: cat || null, // ahora tiene nombre_categoria
      };
    });
    setProductos(productosConCategoria.filter((p) => p.activo !== false));
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
};