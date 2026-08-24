import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TopProductsChart({ products }) {
  const [modo, setModo] = useState("vendidos"); // "vendidos" | "ingresos"

  if (!products || products.length === 0)
    return <div className="bg-white p-4 rounded-xl">Sin datos de productos</div>;

  const dataKey = modo === "vendidos" ? "total_vendido" : "total_ingresos";
  const label   = modo === "vendidos" ? "Unidades vendidas" : "Ingresos ($)";
  const format  = modo === "vendidos"
    ? (v) => [`${v} uds.`, "Vendidos"]
    : (v) => [`$${v.toLocaleString()}`, "Ingresos"];

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h3 className="text-base md:text-lg font-semibold">Top 5 Productos</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setModo("vendidos")}
            className={`px-3 py-1 rounded-full text-sm ${
              modo === "vendidos"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Cantidad
          </button>
          <button
            onClick={() => setModo("ingresos")}
            className={`px-3 py-1 rounded-full text-sm ${
              modo === "ingresos"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Ganancias
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={products}
          layout="vertical"
          margin={{ left: 20 }}
        >
          <XAxis type="number" />
          <YAxis type="category" dataKey="nombre" width={window.innerWidth < 768 ? 80 : 120} tick={{ fontSize: window.innerWidth < 768 ? 11 : 12 }} />
          <Tooltip formatter={format} />
          <Bar dataKey={dataKey} fill="#4f46e5" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}