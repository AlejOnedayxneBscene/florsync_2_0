import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Registrar.css";
import { registrarClientes, registrarProducto } from "../api/test.api";

const Registrar = () => {
  const navigate = useNavigate();

  const modulos = {
    inventario: {
      titulo: "Nuevo Producto",
      datos: [
        { campo: "id_producto", etiqueta: "Número de referencia" },
        { campo: "nombre", etiqueta: "Nombre del producto" },
        { campo: "precio", etiqueta: "Precio del producto" },
        { campo: "tipo", etiqueta: "Tipo del producto" },
        { campo: "cantidad", etiqueta: "Cantidad" },
      ],
    },
    clientes: {
      titulo: "Nuevo Cliente",
      datos: [
        { campo: "cedula", etiqueta: "Cédula" },
        { campo: "nombre_cliente", etiqueta: "Nombre del cliente" },
        { campo: "direccion", etiqueta: "Dirección" },
        { campo: "correo", etiqueta: "Correo electrónico" },
        { campo: "telefono", etiqueta: "Teléfono" },
      ],
    },
  };

  const { tipo } = useParams();
  const mappings = {
    "añadir-nuevo-producto": "inventario",
    "registrar-cliente": "clientes",
  };

  const moduloSeleccionado = mappings[tipo] || tipo;
  const modulo = modulos[moduloSeleccionado];

  const [formData, setFormData] = useState({});
  const [mensajeExito, setMensajeExito] = useState("");

  if (!modulo) {
    return <p>Tipo de formulario no reconocido</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      ["precio", "cantidad", "id_producto", "cedula"].includes(name) &&
      parseInt(value) < 0
    ) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validarFormulario = () => {
    if (moduloSeleccionado === "inventario") {
      const { id_producto, precio, cantidad } = formData;
      if (id_producto < 0 || cantidad < 0 || precio < 0) {
        alert("Ni el ID, ni el precio, ni la cantidad pueden ser negativos.");
        return false;
      }
      if (precio < 500) {
        alert("El precio no puede ser menor a 500.");
        return false;
      }
    } else {
      const { telefono, correo, cedula } = formData;

      if (cedula < 0 || cedula.toString().length < 10) {
        alert("La cédula debe ser positiva y tener al menos 10 dígitos.");
        return false;
      }

      if (!correo.includes("@")) {
        alert("El correo debe contener '@'.");
        return false;
      }

      if (!/^\d{10,}$/.test(telefono)) {
        alert("El teléfono debe tener al menos 10 dígitos.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      if (moduloSeleccionado === "inventario") {
        await registrarProducto(formData);
        setMensajeExito("Producto registrado con éxito");
      } else {
        await registrarClientes(formData);
        setMensajeExito("Cliente registrado con éxito");
      }
      setFormData({});
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al registrar. Intenta de nuevo.");
    }
  };

  const volverMenu = () => {
    navigate("/menu");
  };

  const registrarOtro = () => {
    setMensajeExito("");
    setFormData({});
  };

  useEffect(() => {
    document.body.classList.add("formulario-body");
    return () => {
      document.body.classList.remove("formulario-body");
    };
  }, []);

  return (
    <div className="formulario-body">
      <div className="formulario-header">
        <h1>{modulo.titulo}</h1>
      </div>

      {mensajeExito ? (
        <div className="formulario-exito">
          <p>{mensajeExito}</p>
          <button className="btn-volver" onClick={volverMenu}>
            Volver al menú principal
          </button>
          <button className="btn-modificar" onClick={registrarOtro}>
            Registrar otro
          </button>
        </div>
      ) : (
        <div className="formulario-container">
          <form className="formulario-form" onSubmit={handleSubmit}>
            {modulo.datos.map((campo) => (
              <div key={campo.campo} className="formulario-item">
                <input
                  type={
                    ["cantidad", "precio", "id_producto", "cedula"].includes(campo.campo)
                      ? "number"
                      : campo.campo === "correo"
                      ? "email"
                      : "text"
                  }
                  name={campo.campo}
                  placeholder={campo.etiqueta}
                  value={formData[campo.campo] || ""}
                  onChange={handleChange}
                  min={
                    campo.campo === "precio"
                      ? 500
                      : ["cantidad", "id_producto", "cedula"].includes(campo.campo)
                      ? 1
                      : undefined
                  }
                />
              </div>
            ))}
            <button type="submit" className="formulario-button">
              Registrar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Registrar;
