import React, { useState, useEffect } from "react";
import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../api/apiClientes";
import Modal from "../components/iu/Modal";
import Button from "../components/iu/Button";
import DataTable from "../components/iu/CategoriasList";
import Form from "../components/iu/CategoriasForms";
import Buscador from "../components/iu/Buscador";
import { AnimatePresence } from "framer-motion";
import RegistroAnimacion from "../components/iu/registroAnimacion";
const Clientes = () => {

const [status, setStatus] = useState(null); // null = formulario, true = éxito, false = error
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [statusEliminar, setStatusEliminar] = useState(null); // null = nada, true = éxito, false = error
 const usuario = JSON.parse(localStorage.getItem("user") || "null");
const grupo = usuario?.grupo;
  const [formData, setFormData] = useState({
    cedula: "",
    nombre_cliente: "",
    direccion: "",
    telefono: "",
    correo: "",
  });

  // Campos para el formulario (sin 'compras')
  const fields = [
    { name: "nombre_cliente", label: "Nombre", type: "text" },
    { name: "cedula", label: "Cédula", type: "text" },
    { name: "direccion", label: "Dirección", type: "text" },
    { name: "telefono", label: "Teléfono", type: "text" },
    { name: "correo", label: "Correo", type: "email" },
  ];

  // Columnas para la tabla (sí mostramos 'compras')
  const columns = [
    { key: "cedula", label: "Cédula" },
    { key: "nombre_cliente", label: "Nombre" },
    { key: "direccion", label: "Dirección" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "compras", label: "Compras" },
    { key: "fecha_registro", label: "Fecha de Registro" },
  ];

  // Cargar clientes desde API
  const cargarClientes = async () => {
    try {
      const data = await obtenerClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Filtrado por búsqueda
  const ClientesFiltrados = clientes.filter((p) => {
    const texto = busqueda.toLowerCase();
    return p.nombre_cliente.toLowerCase().includes(texto);
  });

  // Abrir modal para crear cliente
  const abrirCrear = () => {
    setEditando(false);
    setIdEditando(null);
    setFormData({
      cedula: "",
      nombre_cliente: "",
      direccion: "",
      telefono: "",
      correo: "",
    });
    setModalOpen(true);
  };

  // Abrir modal para editar cliente
  const abrirEditar = (cliente) => {
    setEditando(true);
    setIdEditando(cliente.cedula);
    setFormData({
      cedula: cliente.cedula,
      nombre_cliente: cliente.nombre_cliente,
      direccion: cliente.direccion || "",
      telefono: cliente.telefono || "",
      correo: cliente.correo || "",
    });
    setModalOpen(true);
  };

  // Guardar o actualizar cliente
const handleSubmit = async (e, setError) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (!formData.nombre_cliente.trim() || !formData.cedula.trim()) {
      setError("Cédula y Nombre son obligatorios");
      setLoading(false);
      return;
    }

  const payload = {
  cedula: formData.cedula.trim(),
  nombre_cliente: formData.nombre_cliente.trim(),
  direccion: formData.direccion.trim() || null,
  telefono: formData.telefono.trim() || null,
  correo: formData.correo.trim() || null,
};


    if (editando) {
      await actualizarCliente(idEditando, payload);
    } else {
      await crearCliente(payload);
    }

    await cargarClientes();
    setBusqueda("");
    setStatus(true); // ← éxito
    setTimeout(() => {
      setModalOpen(false); // cierra modal
      setStatus(null); // reset status
    }, 2000);
  } catch (error) {
    console.error("Error guardando clientes:", error);
    setStatus(false); // ← error
    setTimeout(() => setStatus(null), 2000); // permite reintento
  } finally {
    setLoading(false);
  }
};


  // Eliminar cliente
const handleDelete = async (cedula) => {
  if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;

  try {
    await eliminarCliente(cedula);
    await cargarClientes();

    // Animación de éxito
    setStatusEliminar(true);
    setTimeout(() => setStatusEliminar(null), 2000); // desaparece después de 2s
  } catch (error) {
    console.error("Error eliminando cliente:", error);

    // Animación de error
    setStatusEliminar(false);
    setTimeout(() => setStatusEliminar(null), 2000); // desaparece después de 2s
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
            Añadir nuevo Cliente
          </Button>

          <div className="w-full sm:w-[320px]">
            <Buscador
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              placeholder="Buscar por nombre"
            />
          </div>
        </div>

        <div className="relative">
  <DataTable
    title="Listado de Clientes"
    columns={columns}
    data={ClientesFiltrados}
    onEdit={grupo === "Administrador" ? abrirEditar : null}
    onDelete={
      grupo === "Administrador"
        ? (row) => handleDelete(row.cedula)
        : null
    }
    emptyText="No hay clientes registrados."
  />

  {statusEliminar !== null && (
    <div className="absolute inset-0 flex justify-center items-center bg-white/70 rounded-lg z-50">
      <RegistroAnimacion success={statusEliminar} />
    </div>
  )}
</div>

      </div>

    <Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title={editando ? "Editar Cliente" : "Registrar Cliente"}
  status={status}
>
  <Form
    fields={fields}
    formData={formData}
    handleChange={(e) =>
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    handleSubmit={handleSubmit} // ← aquí
    loading={loading}
    submitText={editando ? "Actualizar" : "Guardar"}
  />
</Modal>

    </div>
  );
};

export default Clientes;
