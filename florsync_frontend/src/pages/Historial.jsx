import { useEffect, useState } from "react";
import { obtenerAuditoria } from "../api/apiAuditoria";

export default function Historial() {

  const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [logs, setLogs] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [fechaFiltro, setFechaFiltro] = useState(hoy());

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    const data = await obtenerAuditoria();
    setLogs(data.results || data);
  };

  const colorAccion = (accion) => {
    if (accion === "CREATE") return "text-green-600";
    if (accion === "UPDATE") return "text-yellow-600";
    if (accion === "DELETE") return "text-red-600";
    return "";
  };

  const textoAccion = (accion) => {
    if (accion === "CREATE") return "creó";
    if (accion === "UPDATE") return "editó";
    if (accion === "DELETE") return "eliminó";
  };

  const handleFiltrar = () => {
    setFecha(fechaFiltro);
  };

  const logsFiltrados = logs.filter((log) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      log.usuario?.toLowerCase().includes(texto) ||
      log.objeto_nombre?.toLowerCase().includes(texto) ||
      log.modelo?.toLowerCase().includes(texto);

    const fechaLog = new Date(log.fecha);
    const fechaLogLocal = `${fechaLog.getFullYear()}-${String(fechaLog.getMonth() + 1).padStart(2, "0")}-${String(fechaLog.getDate()).padStart(2, "0")}`;
    const coincideFecha = fecha ? fechaLogLocal === fecha : true;

    return coincideBusqueda && coincideFecha;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Actividad del sistema</h1>

      <div className="bg-white rounded-2xl shadow-md border p-4 flex flex-col sm:flex-row gap-3 items-center mb-6">
        <input
          type="text"
          placeholder=" Buscar por usuario, producto o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
        />

        <input
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
        />

        <button
          onClick={handleFiltrar}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold transition shadow"
        >
          Filtrar
        </button>

        <button
          onClick={() => {
            setBusqueda("");
            setFecha("");
            setFechaFiltro("");
          }}
          className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg transition"
        >
          Limpiar
        </button>
      </div>

      {logsFiltrados.length > 0 ? (
        logsFiltrados.map((log) => (
          <div key={log.id} className="bg-white shadow rounded p-4 mb-3">
            <p className={`font-semibold ${colorAccion(log.accion)}`}>
              {log.usuario} {textoAccion(log.accion)}{" "}
              {log.modelo?.toLowerCase()}{" "}
              <strong>{log.objeto_nombre}</strong>
            </p>

            {log.cambios &&
              Object.entries(log.cambios).map(([campo, valor]) => (
                <p key={campo} className="text-sm ml-2 text-gray-700">
                  {typeof valor === "object"
                    ? `${campo}: ${valor.antes} → ${valor.despues}`
                    : `${campo}: ${valor}`}
                </p>
              ))}

            <p className="text-xs text-gray-500 mt-2">
              {new Date(log.fecha).toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-600">
          No hay registros para esta búsqueda o fecha.
        </p>
      )}
    </div>
  );
}