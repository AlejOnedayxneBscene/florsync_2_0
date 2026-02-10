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

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

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
        throw new Error("Validación");
      }

      if (editando) {
        await actualizarCategoria(idEditando, formData);
      } else {
        await crearCategoria(formData);
      }

      await cargarCategorias();
      setBusqueda("");

      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    } catch (error) {
      console.log(" ERROR COMPLETO:", error);
      console.log(" STATUS:", error.response?.status);
      console.log(" DATA BACKEND:", error.response?.data);

      setError("Error guardando categoría");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_categoria) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;

    try {
      await eliminarCategoria(id_categoria);
      await cargarCategorias();
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  return (
    <div className="w-full bg-gray-200 p-4">
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <Button
            type="button"
            className="h-10 px-4 text-sm w-fit"
            onClick={abrirCrear}
          >
            Añadir nueva categoría
          </Button>

          <div className="w-full sm:w-[320px]">
                          <Buscador busqueda={busqueda} setBusqueda={setBusqueda} placeholder="Buscar por nombre" />

          </div>

        </div>

        {/* Tabla dinámica */}
        <DataTable
          title="Listado de Categorías"
          columns={columns}
          data={categoriasFiltradas}
          onEdit={abrirEditar}
          onDelete={(row) => handleDelete(row.id_categoria)}
          emptyText="No hay categorías registradas."
        />
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? "Editar Categoría" : "Registrar Categoría"}
      >
        <Form
          fields={fields}
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          loading={loading}
          submitText={editando ? "Actualizar" : "Guardar"}
        />
      </Modal>
    </div>
  );
};

export default Categorias;
