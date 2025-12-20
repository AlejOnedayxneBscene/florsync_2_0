import axios from 'axios';

const API_URL = "http://localhost:8000/api"; 

export const obtenerUsuarios = async () => {
    return await axios.get(`${API_URL}/usuarios/`);
};


export const validarUsuario = async (id_usuario, password) => {
    
        const response = await axios.post(
            'http://localhost:8000/api/login/',  
            { id_usuario, password },  
            { headers: { 'Content-Type': 'application/json' } }  
        );

        console.log(' Inicio de sesión exitoso:', response.data);
        return response.data;
    
};

export const registrarClientes = async (clienteData) => {
    try {
        const response = await axios.post(
            'http://localhost:8000/api/registrar-cliente/', 
            clienteData,
            { headers: { 'Content-Type': 'application/json' } }
        );
        

        console.log("Cliente registrado exitosamente:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al registrar cliente:", error.response?.data || error.message);
        throw error;
    }
};

export const obtenerClientePorTipo = async (tipo) => {
    try {
        const response = await axios.get("http://localhost:8000/api/visualizar-cliente/", {
            params: { cedula: tipo } 
        });
        console.log(" Cliente encontrado:", response.data);
        return response.data;
    } catch (error) {
        console.error(" Error al obtener cliente:", error.response?.data || error.message);
        throw error;
    }
};


export const registrarProducto = async (productoData) => {
    try {
        const response = await axios.post(
            `${API_URL}/registrar-producto/`, 
            productoData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log("Producto registrado exitosamente:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al registrar producto:", error.response?.data || error.message);
        throw error;
    }
};

export const obtenerProductos = async (nombre = "", id_producto = "", tipos = []) => {
    try {
        let url = `${API_URL}/obtener-productos/?`;
        if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;
        if (id_producto) url += `id_producto=${encodeURIComponent(id_producto)}&`;
        tipos.forEach(tipo => {
            url += `tipo=${encodeURIComponent(tipo)}&`;
        });

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
};

export const modificarProducto = async (id, datos) => {
    try {
        const response = await axios.put(
            `http://localhost:8000/api/modificar-productos/${id}/`,
            datos,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error al modificar el producto:", error.response?.data || error.message);
        return { success: false, error: error.response?.data || "Error desconocido" };
    }
};

export const obtenerProductoPorID = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/obtener-productosID/${id}`);
        return response.data;
    } catch (error) {
        throw new Error("Producto no encontrado o error en la API");
    }
};
export const obtenerClientesPorID = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/obtener-clientesID/${id}`);
        return response.data;
    } catch (error) {
        throw new Error("Producto no encontrado o error en la API");
    }
};

export const modificarCliente = async (id, datos) => {
    try {
        const response = await axios.put(
            `http://localhost:8000/api/modificar-clientes/${id}/`,
            datos,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error al modificar el producto:", error.response?.data || error.message);
        return { success: false, error: error.response?.data || "Error desconocido" };
    }
};

export const eliminarProducto = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/productos-eliminar/${id}/`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error al eliminar el producto");
    }
};

export const eliminarCliente = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/clientes-eliminar/${id}/`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error al eliminar el cliente");
    }
};

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

export const obtenerVentas = async (fecha) => {
    try {
        const params = fecha ? { fecha } : {};
        const response = await axios.get(`${API_URL}/ventas-visualizar/`, { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error al obtener las ventas");
    }
};


export const obtenerInforme = async (tipo, fecha) => {
  const params = {};
  if (fecha) params.fecha = fecha;
  const response = await axios.get(`http://localhost:8000/api/informe/${tipo}/`, { params });
  return response;
};
