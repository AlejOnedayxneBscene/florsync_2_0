import React, { useState, useEffect } from "react";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../api/apiProductos";
import { obtenerCategorias } from "../api/apiCategorias"; // API para traer categorías
import Modal from "../components/iu/Modal";
import Button from "../components/iu/Button";
import DataTable from "../components/iu/CategoriasList";
import Form from "../components/iu/CategoriasForms";
import Buscador from "../components/iu/Buscador";
import FiltroCategoria from "../components/iu/FiltroCategoria";



const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
 
  const [formData, setFormData] = useState({
    id_producto: "",
    nombre: "",
    precio: "",
    stock_total: "",
    stock_minimo: "",
    categoria: "",
  });

  // Campos para el formulario genérico
  const fields = [
    { name: "nombre", label: "Nombre", type: "text" },
    { name: "precio", label: "Precio", type: "number" },
    { name: "stock_total", label: "Stock Total", type: "number" },
    { name: "stock_minimo", label: "Stock Mínimo", type: "number" },
    { name: "categoria", label: "Categoría", options: categorias }, // ⚠ selector
  ];

 // Columns
const columns = [
  { key: "id_producto", label: "ID" },
  { key: "nombre", label: "Nombre" },
  {
    key: "precio",
    label: "Precio",
    render: (row) =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(row.precio),
  },
  { key: "stock_total", label: "Stock Total" },
  { key: "stock_minimo", label: "Stock Mínimo" },
  {
    key: "categoria",
    label: "Categoría",
    render: (row) => row.categoria?.nombre_categoria ?? "-", // ✅ Mostrar nombre
  },
  {
    key: "activo",
    label: "Activo",
    align: "center",
    render: (row) => (row.activo ? "Sí" : "No"),
  },
];


  // 🔹 Cargar productos
// 🔹 Cargar categorías y devolver los datos
const cargarCategorias = async () => {
  try {
    const data = await obtenerCategorias();
    setCategorias(data);
    return data; // devuelvo las categorías cargadas
  } catch (error) {
    console.error("Error cargando categorías:", error);
    return [];
  }
};

// 🔹 Cargar productos con categorías pasadas por parámetro
const cargarProductos = async (categoriasDisponibles = categorias) => {
  try {
    const data = await obtenerProductos();
    const productosConCategoria = data.map((p) => {
      const cat = categoriasDisponibles.find((c) => c.id_categoria === p.categoria);
      return {
        ...p,
        categoria: cat || { nombre_categoria: "-" },
      };
    });
    setProductos(productosConCategoria.filter((p) => p.activo !== false));
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
};


// 🔹 useEffect inicial
useEffect(() => {
  const init = async () => {
    const cats = await cargarCategorias(); // espero categorías
    await cargarProductos(cats);          // paso las categorías cargadas
  };
  init();
}, []);


const productosFiltrados = productos.filter((p) => {
  const texto = busqueda.toLowerCase();
  const nombre = p.nombre.toLowerCase();
  const categoriaNombre = p.categoria?.nombre_categoria?.toLowerCase() ?? "";

  // Filtrado por búsqueda
  const coincideBusqueda = nombre.includes(texto) || categoriaNombre.includes(texto);

  // Filtrado por categoría
  const coincideCategoria =
    !categoriaSeleccionada || p.categoria?.id_categoria.toString() === categoriaSeleccionada.toString();

  return coincideBusqueda && coincideCategoria;
});



  const abrirCrear = () => {
    setEditando(false);
    setIdEditando(null);
    setFormData({
      id_producto: "",
      nombre: "",
      precio: "",
      stock_total: "",
      stock_minimo: "",
      categoria: "",
    });
    setModalOpen(true);
  };

  const abrirEditar = (producto) => {
    setEditando(true);
    setIdEditando(producto.id_producto);
    setFormData({
      ...producto,
      categoria: producto.categoria?.id_categoria || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e, setError) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (!formData.nombre.trim()) {
      setError("Debes escribir el nombre del producto");
      throw new Error("Validación");
    }
    if (!formData.categoria) {
      setError("Debes seleccionar una categoría");
      throw new Error("Validación");
    }

    // Convertir a minúsculas los campos de texto
    const payload = {
      ...formData,
      nombre: formData.nombre.toLowerCase(),
    };

    if (editando) {
      await actualizarProducto(idEditando, payload);
    } else {
      await crearProducto(payload);
    }

    await cargarProductos(categorias);
    setBusqueda("");
    setModalOpen(false);
  } catch (error) {
    console.error("Error guardando producto:", error);
    setError("Error guardando producto");
    throw error;
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id_producto) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id_producto);
      await cargarProductos();
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  return (
    <div className="w-full bg-gray-200 p-4">
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <Button
            type="button"
            className="h-10 px-4 text-sm w-fit"
            onClick={abrirCrear}
          >
            Añadir nuevo Producto
          </Button>

          <div className="w-full sm:w-[320px]">
            {/* Buscar por nombre */}
     <Buscador busqueda={busqueda} setBusqueda={setBusqueda} placeholder="Buscar por nombre" />

<FiltroCategoria
    categorias={categorias}
    categoriaSeleccionada={categoriaSeleccionada}
    setCategoriaSeleccionada={setCategoriaSeleccionada}
  />
          </div>
        </div>

        <DataTable
          title="Listado de Productos"
          columns={columns}
          data={productosFiltrados}
          onEdit={abrirEditar}
          onDelete={(row) => handleDelete(row.id_producto)}
          emptyText="No hay productos registrados."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? "Editar Producto" : "Registrar Producto"}
      >
        <Form
          fields={fields}
          formData={formData}
          handleChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
          handleSubmit={handleSubmit}
          loading={loading}
          submitText={editando ? "Actualizar" : "Guardar"}
        />
      </Modal>
    </div>
  );
};

export default Inventario;