import React, { useEffect, useState } from "react";
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} 
from "../api/apiCategorias";

import Modal from "../components/iu/Modal";
import Button from "../components/iu/Button";
import Buscador from "../components/iu/Buscador";
import Form from "../components/iu/CategoriasForms";
import DataTable from "../components/iu/CategoriasList";
import RegistroAnimacion from "../components/iu/registroAnimacion";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
const [status, setStatus] = useState(null); // null = formulario, true = éxito, false = error
const [statusEliminar, setStatusEliminar] = useState(null); // null = nada, true = éxito, false = error
 const usuario = JSON.parse(localStorage.getItem("user") || "null");
const grupo = usuario?.grupo;
  const [busqueda, setBusqueda] = useState("");

  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre_categoria: "",
  });

  //  campos dinámicos
  const fields = [
    {
      name: "nombre_categoria",
      label: "Nombre de categoría",
      placeholder: "Ej: Rosas",
      type: "text",
    },
  ];

  //  columnas dinámicas
const columns = [
  { key: "id_categoria", label: "ID" },
  { key: "nombre_categoria", label: "Nombre" },
  {
    key: "activo",
    label: "Activo",
    align: "center",
    render: (row) => {
      const activo =
        row.activo === true ||
        row.activo === 1 ||
        row.activo === "1" ||
        row.activo === "true";

      return activo ? "Sí" : "No";
    },
  },
];


  const cargarCategorias = async () => {
    try {
      const data = await obtenerCategorias();
      setCategorias(data.filter((c) => c.activo !== false));
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const categoriasFiltradas = categorias.filter((c) =>
    c.nombre_categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirCrear = () => {
    setEditando(false);
    setIdEditando(null);
    setFormData({ nombre_categoria: "" });
    setModalOpen(true);
  };

  const abrirEditar = (categoria) => {
    setEditando(true);
    setIdEditando(categoria.id_categoria);
    setFormData({ nombre_categoria: categoria.nombre_categoria });
    setModalOpen(true);
  };

 const handleSubmit = async (e, setError, setFieldError) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (!formData.nombre_categoria.trim()) {
      setError("Debes escribir el nombre de la categoría");
      setFieldError({ nombre_categoria: true });
      setStatus(false); // animación de error
      return;
    }

    if (editando) {
      await actualizarCategoria(idEditando, formData);
    } else {
      await crearCategoria(formData);
    }

    await cargarCategorias();
    setBusqueda("");

    setStatus(true); // animación de éxito
    setTimeout(() => {
      setModalOpen(false);
      setStatus(null); // resetea status
    }, 2000);

  } catch (error) {
    console.error("Error guardando categoría:", error);
    setError("Error guardando categoría");
    setStatus(false); // animación de error
    setTimeout(() => setStatus(null), 2000); // vuelve al formulario
  } finally {
    setLoading(false);
  }
};


const handleDelete = async (id_categoria) => {
  if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;

  try {
    await eliminarCategoria(id_categoria);
    await cargarCategorias();

    setStatusEliminar(true); // éxito
    setTimeout(() => setStatusEliminar(null), 2000); // desaparece después de 2s
  } catch (error) {
    console.error("Error eliminando:", error);

    setStatusEliminar(false); // error
    setTimeout(() => setStatusEliminar(null), 2000);
  }
};


  return (
    <div className="w-full bg-gray-200 p-4">
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {grupo === "Administrador" && (
            <Button
              type="button"
              className="h-10 px-4 text-sm w-fit"
              onClick={abrirCrear}
            >
              Añadir nueva Categoria
            </Button>
          )}

          <div className="w-full sm:w-[320px]">
                          <Buscador busqueda={busqueda} setBusqueda={setBusqueda} placeholder="Buscar por nombre" />

          </div>

        </div>

        {/* Tabla dinámica */}
       <div className="relative">
  <DataTable
    title="Listado de Categorías"
    columns={columns}
    data={categoriasFiltradas}
    onEdit={grupo === "Administrador" ? abrirEditar : null}
    onDelete={
      grupo === "Administrador"
        ? (row) => handleDelete(row.id_categoria)
        : null
    }
    emptyText="No hay categorías registradas."
  />

  {statusEliminar !== null && (
    <div className="absolute inset-0 flex justify-center items-center bg-white/70 rounded-lg z-50">
      <RegistroAnimacion success={statusEliminar} />
    </div>
  )}
</div>

      </div>

      {/* Modal */}
    
<Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title={editando ? "Editar Categoría" : "Registrar Categoría"}
>
  {status === null ? (
    <Form
      fields={fields}
      formData={formData}
      handleChange={handleChange}
      handleSubmit={handleSubmit} // ← aquí
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

export default Categorias;
