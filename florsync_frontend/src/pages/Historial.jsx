import { useEffect, useState } from "react";
import { obtenerAuditoria } from "../api/apiAuditoria";

export default function Historial() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    cargarLogs();
  }, []);

const cargarLogs = async () => {
  const data = await obtenerAuditoria();
  console.log("DATA BACKEND:", data);
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

 return (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Actividad del sistema</h1>

    {Array.isArray(logs) ? (
      logs.map((log) => (
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
      <p>No hay registros disponibles.</p>
    )}
  </div>
);

}
