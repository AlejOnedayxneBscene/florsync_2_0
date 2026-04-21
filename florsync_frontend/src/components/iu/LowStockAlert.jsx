import React from "react";

export default function LowStockAlert({ productos }) {
  if (!productos) return null;

  // 👇 CASO: no hay productos bajos
  if (productos.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow">
        <h2 className="text-lg font-bold text-green-700 mb-2">
           Stock en buen estado
        </h2>
        <p className="text-sm text-green-600">
          No hay productos a punto de agotarse.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow">
      <h2 className="text-lg font-bold text-red-700 mb-3">
         Stock bajo ({productos.length})
      </h2>

      <div className="flex flex-col gap-2">
        {productos.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-white p-3 rounded-lg border"
          >
            <span className="font-medium text-gray-800">
              {p.nombre}
            </span>

            <span
              className={`text-sm font-semibold ${
                p.stock === 0
                  ? "text-red-700"
                  : "text-orange-500"
              }`}
            >
              {p.stock} / min {p.stock_minimo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}