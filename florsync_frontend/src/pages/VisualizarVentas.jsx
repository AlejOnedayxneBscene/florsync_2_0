import React, { useEffect, useState } from "react";
import { obtenerVentas } from "../api/apiVentas";

const VentasMostrar = () => {
  const [ventas, setVentas] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [fechaConsultada, setFechaConsultada] = useState("");

  const usuario = JSON.parse(localStorage.getItem("user") || "null");
const grupo = usuario?.grupo;

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
    if (fechaFiltro) cargarVentas(fechaFiltro);
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
    return new Date(fecha).toLocaleString("es-CO", {
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
  const n = Number(num);

  return isNaN(n)
    ? "$0"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(n);
};


return (
  <div className="min-h-screen bg-gray-100 p-6 font-sans text-gray-800">

    {/* FILTRO */}
    <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col sm:flex-row gap-3 items-center mb-6">
      <input
        type="date"
        value={fechaFiltro}
        onChange={(e) => setFechaFiltro(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-teal-500"
      />

      <button
        onClick={handleFiltrar}
        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition"
      >
        Filtrar
      </button>
    </div>

    {/* TITULO */}
    {fechaConsultada && (
      <h2 className="text-2xl font-bold tracking-tight text-gray-700 mb-6">
        Ventas realizadas el:{" "}
        <span className="text-teal-700">
          {formatearSoloFecha(fechaConsultada)}
        </span>
      </h2>
    )}

    {/* LISTA */}
    {ventas.length === 0 ? (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
        No hay ventas registradas.
      </div>
    ) : (
      <div className="space-y-5">
        {ventas.map((venta, index) => {
          const cliente = venta.cliente ?? {};
          const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];
          const usuario = venta.usuario ?? null;

          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3">
                <h3 className="text-xl font-bold text-teal-700">
                  Venta #{index + 1}
                </h3>

                <p className="text-sm text-gray-500">
                  {formatearFechaHora(venta.fecha)}
                </p>
              </div>

              <p className="text-2xl font-extrabold text-green-600 mb-4">
                ${formatearNumero(venta.total)}
              </p>

              {/*  USUARIO */}
              {usuario && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 text-sm">
                  <p>
                    <span className="font-semibold">Vendedor:</span>{" "}
                    {usuario.nombre}
                  </p>
                  <p>
                    <span className="font-semibold">ID:</span> {usuario.id}
                  </p>
                </div>
              )}

              {/* CLIENTE */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm leading-relaxed">
                <p><strong>Nombre:</strong> {cliente.nombre_cliente || "Anónimo"}</p>
                <p><strong>Cédula:</strong> {cliente.cedula || "N/A"}</p>
                <p><strong>Teléfono:</strong> {cliente.telefono || "N/A"}</p>
                <p><strong>Correo:</strong> {cliente.correo || "N/A"}</p>
                <p><strong>Dirección:</strong> {cliente.direccion || "N/A"}</p>
              </div>

              {/* PRODUCTOS */}
              {detalles.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold mb-2 text-gray-700">
                    Productos vendidos:
                  </p>

                  <ul className="space-y-1 text-sm text-gray-700">
                    {detalles.map((detalle, i) => (
                      <li key={i} className="border-b pb-1">
                        {detalle.producto} — {detalle.cantidad} x $
                        {formatearNumero(detalle.precio)} = $
                        {formatearNumero(
                          detalle.total ||
                            detalle.precio * detalle.cantidad
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-red-600 text-sm font-semibold">
                  ❗ Esta venta no tiene productos registrados.
                </p>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

};

export default VentasMostrar;
