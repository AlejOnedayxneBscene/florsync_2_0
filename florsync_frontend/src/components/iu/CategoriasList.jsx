import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const capitalize = (text) => {
  if (!text) return "-";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Función para formatear precios en COP
const formatPrecio = (value) => {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const DataTable = ({
  title = "Listado",
  columns = [],
  data = [],
  onEdit,
  onDelete,
  emptyText = "No hay registros.",
}) => {
  // 🔹 Filtrar productos con stock total > 0
// Si existe stock_total, filtra por > 0, si no, devuelve todos los datos
const filteredData = data.filter((p) => {
  if ("stock_total" in p) return Number(p.stock_total) > 0;
  return true;
});

  return (
    <div className="w-full bg-white shadow-md rounded-md overflow-hidden">
      <div className="bg-[#062b2b] text-white px-6 py-4 font-bold text-xl">
        {title}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#062b2b] text-white text-lg">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-5 font-semibold ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="p-5 text-center font-semibold text-lg">Opciones</th>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="p-10 text-center text-gray-500 text-lg"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`border-b text-lg ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`p-5 ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : col.key === "precio"
                        ? formatPrecio(row[col.key])
                        : typeof row[col.key] === "string"
                        ? capitalize(row[col.key])
                        : row[col.key] ?? "-"}
                    </td>
                  ))}

                  {(onEdit || onDelete) && (
                    <td className="p-5">
                      <div className="flex justify-center gap-4">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                            title="Editar"
                          >
                            <Pencil size={22} />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                            title="Eliminar"
                          >
                            <Trash2 size={22} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
