import React, { useState, useEffect } from "react";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../api/apiProductos";
import { obtenerCategorias } from "../api/apiCategorias";
import Modal from "../components/iu/Modal";
import Button from "../components/iu/Button";
import DataTable from "../components/iu/CategoriasList";
import Form from "../components/iu/CategoriasForms";
import Buscador from "../components/iu/Buscador";
import FiltroCategoria from "../components/iu/FiltroCategoria";
import RegistroAnimacion from "../components/iu/registroAnimacion";
import { AnimatePresence } from "framer-motion";

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [status, setStatus] = useState(null);
  const [statusEliminar, setStatusEliminar] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const usuario = JSON.parse(localStorage.getItem("user") || "null");
const grupo = usuario?.grupo;
 console.log("GRUPO:", grupo);
console.log("ES ADMIN:", grupo === "Administrador");

  const [formData, setFormData] = useState({
    id_producto: "",
    nombre: "",
    precio: "",
    stock_total: "",
    stock_minimo: "",
    categoria: "",
  });

  // Campos para el formulario
  const fields = [
    { name: "nombre", label: "Nombre", type: "text" },
    { name: "precio", label: "Precio", type: "number" },
    { name: "stock_total", label: "Stock Total", type: "number" },
    { name: "stock_minimo", label: "Stock Mínimo", type: "number" },
    { name: "categoria", label: "Categoría", options: categorias },
  ];

  // Columnas de la tabla
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
      render: (row) => row.categoria?.nombre_categoria ?? "-",
    },
    {
      key: "activo",
      label: "Activo",
      align: "center",
      render: (row) => (row.activo ? "Sí" : "No"),
    },
  ];

  // 🔹 Cargar categorías
  const cargarCategorias = async () => {
    try {
      const data = await obtenerCategorias();
      setCategorias(data);
      return data;
    } catch (error) {
      console.error("Error cargando categorías:", error);
      return [];
    }
  };

  // 🔹 Cargar productos con categoría asociada
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
    // ⚠ Solo mostrar productos activos y con stock > 0
    setProductos(
      productosConCategoria.filter(
        (p) => p.activo !== false && Number(p.stock_total) > 0
      )
    );
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
};

  // 🔹 useEffect inicial
  useEffect(() => {
    const init = async () => {
      const cats = await cargarCategorias();
      await cargarProductos(cats);
    };
    init();
  }, []);

  // 🔹 Filtrado por búsqueda, categoría y stock
 const productosFiltrados = productos
  .filter((p) => Number(p.stock_total) > 0) // solo con stock positivo
  .filter((p) => {
    const texto = busqueda.toLowerCase();
    const nombre = p.nombre.toLowerCase();
    const categoriaNombre = p.categoria?.nombre_categoria?.toLowerCase() ?? "";

    const coincideBusqueda = nombre.includes(texto) || categoriaNombre.includes(texto);
    const coincideCategoria =
      !categoriaSeleccionada || p.categoria?.id_categoria.toString() === categoriaSeleccionada.toString();

    return coincideBusqueda && coincideCategoria;
  });


  // 🔹 Abrir modal para crear
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

  // 🔹 Abrir modal para editar
  const abrirEditar = (producto) => {
    setEditando(true);
    setIdEditando(producto.id_producto);
    setFormData({
      ...producto,
      categoria: producto.categoria?.id_categoria || "",
    });
    setModalOpen(true);
  };
const handleInputChange = (id, value) => {
  const producto = carrito.find(item => item.id_producto === id);
  const stock = producto?.stock_total || 0;
  let num = Number(value.replace(/\D/g, ""));

  if (num > stock) {
    alert(`La cantidad máxima disponible es ${stock}`);
    num = 0; // O puedes usar stock si quieres poner automáticamente el máximo
  }

  setInputTemporal(prev => ({ ...prev, [id]: num.toString() }));
  cambiarCantidad(id, num);
};

const handleInputBlur = (id) => {
  const value = Number(inputTemporal[id]);
  const producto = carrito.find(item => item.id_producto === id);
  const stock = producto?.stock_total || 0;

  if (!value || value < 1 || value > stock) {
    setInputTemporal(prev => ({ ...prev, [id]: "0" })); // Resetea si inválido
    cambiarCantidad(id, 0);
  } else {
    setInputTemporal(prev => ({ ...prev, [id]: value.toString() }));
    cambiarCantidad(id, value);
  }
};

  // 🔹 Guardar producto
  const handleSubmit = async (e, setError) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nombre.trim()) {
        setError("Debes escribir el nombre del producto");
        setStatus(false);
        return;
      }
      if (!formData.categoria) {
        setError("Debes seleccionar una categoría");
        setStatus(false);
        return;
      }

      // Validar que stock_total >= stock_minimo
      if (Number(formData.stock_total) < Number(formData.stock_minimo)) {
        setError("El stock total debe ser mayor o igual al mínimo");
        setStatus(false);
        return;
      }

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
      setStatus(true);

      setTimeout(() => {
        setModalOpen(false);
        setStatus(null);
      }, 2000);
    } catch (error) {
      console.error("Error guardando producto:", error);
      setError("Error guardando producto");
      setStatus(false);
      setTimeout(() => setStatus(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar producto
  const handleDelete = async (id_producto) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id_producto);
      await cargarProductos(categorias);
      setStatusEliminar(true);
      setTimeout(() => setStatusEliminar(null), 2000);
    } catch (error) {
      console.error("Error eliminando producto:", error);
      setStatusEliminar(false);
      setTimeout(() => setStatusEliminar(null), 2000);
    }
  };

  return (
    <div className="w-full bg-gray-200 p-4">
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
           {grupo === "Administrador" && (
            <Button
              type="button"
              className="h-10 px-4 text-sm w-fit"
              onClick={abrirCrear}
            >
              Añadir nuevo Producto
            </Button>
          )}

          <div className="w-full sm:w-[320px]">
            <Buscador busqueda={busqueda} setBusqueda={setBusqueda} placeholder="Buscar por nombre" />
            <FiltroCategoria
              categorias={categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              setCategoriaSeleccionada={setCategoriaSeleccionada}
            />
          </div>
        </div>

        <div className="relative">
          <DataTable
            title="Listado de Productos"
            columns={columns}
            data={productosFiltrados}
            onEdit={grupo === "Administrador" ? abrirEditar : null}
            onDelete={
              grupo === "Administrador"
                ? (row) => handleDelete(row.id_producto)
                : null
            }
            emptyText="No hay productos registrados."

          />
          <AnimatePresence>
            {statusEliminar !== null && (
              <div className="absolute inset-0 flex justify-center items-center bg-white/70 rounded-lg z-50">
                <RegistroAnimacion success={statusEliminar} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? "Editar Producto" : "Registrar Producto"}>
        {status === null ? (
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
        ) : (
          <RegistroAnimacion success={status} />
        )}
      </Modal>
    </div>
  );
};

export default Inventario;
