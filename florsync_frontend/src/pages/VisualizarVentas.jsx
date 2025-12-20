import React, { useEffect, useState } from "react";
import { obtenerVentas } from "../api/test.api";
import "../css/VentasMostrar.css";


const VentasMostrar = () => {
  const [ventas, setVentas] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [fechaConsultada, setFechaConsultada] = useState('');

  const obtenerFechaLocal = () => {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  };

  useEffect(() => {
    const hoy = obtenerFechaLocal();
    setFechaFiltro(hoy);
    cargarVentas(hoy);
  }, []);

    useEffect(() => {
          document.body.classList.add("ventas-body");
          return () => {
              document.body.classList.remove("ventas-body");
          };
      }, []);


       useEffect(() => {
              document.body.classList.add("ventas-body");
              return () => document.body.classList.remove("ventas-body");
          }, []);
  const cargarVentas = async (fecha) => {
    try {
      const data = await obtenerVentas(fecha);
      setVentas(data);
      setFechaConsultada(fecha);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      setVentas([]);
    }
  };

  const handleFiltrar = () => {
    if (fechaFiltro) {
      cargarVentas(fechaFiltro);
    }
  };

  const formatearSoloFecha = (fecha) => {
    if (!fecha) return "Fecha inválida";
    const partes = fecha.split("-");
    const fechaObj = new Date(
      parseInt(partes[0]),
      parseInt(partes[1]) - 1,
      parseInt(partes[2])
    );

    return fechaObj.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return "Fecha inválida";
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatearNumero = (num) => {
    const n = parseFloat(num);
    return isNaN(n)
      ? "0.00"
      : n.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  };

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <h1 className="titulo">
          Historial de <span>Ventas</span>
        </h1>
      </div>

      <div className="filtro-fecha">
        <input
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
        />
        <button onClick={handleFiltrar}>Filtrar</button>
      </div>

      {fechaConsultada && (
        <h3 className="subtitulo">
          Ventas realizadas el: {formatearSoloFecha(fechaConsultada)}
        </h3>
      )}

      {ventas.length === 0 ? (
        <p>No hay ventas registradas.</p>
      ) : (
        ventas.map((venta, index) => {
          const cliente = venta.cliente ?? {};
          const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];

          return (
            <div key={index} className="venta-card">
              <h3>Venta #{index + 1}</h3>
              <p>
                <strong>Fecha:</strong> {formatearFechaHora(venta.fecha)}
              </p>
              <p>
                <strong>Total:</strong> ${formatearNumero(venta.total)}
              </p>

              <div className="cliente-info">
                <p><strong>Nombre:</strong> {cliente.nombre_cliente || "Anónimo"}</p>
                <p><strong>Cédula:</strong> {cliente.cedula || "N/A"}</p>
                <p><strong>Teléfono:</strong> {cliente.telefono || "N/A"}</p>
                <p><strong>Correo:</strong> {cliente.correo || "N/A"}</p>
                <p><strong>Dirección:</strong> {cliente.direccion || "N/A"}</p>
              </div>

              {detalles.length > 0 ? (
                <div className="productos-detalle">
                  <p><strong>Productos vendidos:</strong></p>
                  <ul>
                    {detalles.map((detalle, i) => (
                      <li key={i}>
                        {detalle.producto} - {detalle.cantidad} unidad(es) x ${formatearNumero(detalle.precio)} = ${formatearNumero(detalle.total || detalle.precio * detalle.cantidad)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ color: "red" }}>
                  ❗ Esta venta no tiene productos registrados.
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default VentasMostrar;
