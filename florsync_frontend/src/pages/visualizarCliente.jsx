import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/VisualizarClientes.css";

const VisualizarCliente = () => {
  const { tipo } = useParams();
  const navigate = useNavigate(); // Para navegar hacia atrás
  const [cedulaBuscar, setCedulaBuscar] = useState("");
  const [cliente, setCliente] = useState({
    cedula: "",
    nombre_cliente: "",
    telefono: "",
    direccion: "",
    correo: "",
    compras: "0",
    fecha_registro: "",
  });

  useEffect(() => {
    document.body.classList.add("visualizarCliente-body");
    return () => {
      document.body.classList.remove("visualizarCliente-body");
    };
  }, []);

  const buscarCliente = async () => {
    if (!cedulaBuscar || cedulaBuscar.length < 5) {
      alert("Por favor, ingrese una cédula válida (mínimo 5 dígitos).");
      return;
    }
    try {
      const response = await axios.get("http://localhost:8000/api/visualizar-cliente/", {
        params: { cedula: cedulaBuscar }
      });

      if (response.data.length > 0) {
        setCliente(response.data[0]);
      } else {
        alert("Cliente no encontrado.");
        setCliente({
          cedula: "",
          nombre_cliente: "",
          telefono: "",
          direccion: "",
          correo: "",
          compras: "0",
          fecha_registro: "",
        });
      }
    } catch (error) {
      console.error("Error al buscar cliente:", error.response?.data || error.message);
      alert("Error al buscar cliente. Verifica la cédula ingresada.");
    }
  };

  const volverAtras = () => {
    navigate(-1); // Vuelve a la página anterior
  };

  return (
    <div className="visualizarCliente-body">
      {/* Encabezado */}
      <div className="encabezado-cliente" style={{ fontWeight: 400 }}>
        <h1 className="titulo-encabezado">Clientes Registrados</h1>
      </div>

      {/* Input para buscar por cédula */}
      <div className="search-container">
        <input
          type="text"
          className="search-box"
          placeholder="Buscar por cédula"
          value={cedulaBuscar}
          onChange={(e) => setCedulaBuscar(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
        />
        <button onClick={buscarCliente}>Buscar</button>
      </div>

      <div className="clientes-container">
        <table className="table">
          <tbody>
            <tr>
              <td>Cédula</td>
              <td>{cliente.cedula || "-"}</td>
            </tr>
            <tr>
              <td>Nombre</td>
              <td>{cliente.nombre_cliente || "-"}</td>
            </tr>
            <tr>
              <td>Teléfono</td>
              <td>{cliente.telefono || "-"}</td>
            </tr>
            <tr>
              <td>Dirección</td>
              <td>{cliente.direccion || "-"}</td>
            </tr>
            <tr>
              <td>Correo</td>
              <td>{cliente.correo || "-"}</td>
            </tr>
            <tr>
              <td>Compras en el mes</td>
              <td>{cliente.compras || "0"}</td>
            </tr>
            <tr>
              <td>Fecha de registro</td>
              <td>{cliente.fecha_registro || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botón para volver atrás */}
      <div className="volver-container">
        <button onClick={volverAtras} className="btn-volver">
          Anterior
        </button>
      </div>
    </div>
  );
};

export default VisualizarCliente;
