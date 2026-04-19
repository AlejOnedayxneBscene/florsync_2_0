import React, { useState } from "react";
import { X } from "lucide-react";

const ModalStock = ({ producto, onClose, onConfirm }) => {
  const [cantidad, setCantidad] = useState("");
  const [modo, setModo] = useState("sumar"); // "sumar" | "restar"

  const handleConfirm = () => {
    const valor = parseInt(cantidad);
    if (isNaN(valor) || valor <= 0) return;
    onConfirm(producto, modo === "sumar" ? valor : -valor);
    onClose();
  };

  const stockResultante = () => {
    const valor = parseInt(cantidad);
    if (isNaN(valor) || valor <= 0) return producto.stock_total;
    return modo === "sumar"
      ? producto.stock_total + valor
      : Math.max(producto.stock_total - valor, producto.stock_minimo);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        
        {/* Header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={22} />
        </button>
        <h2 className="text-xl font-bold text-[#062b2b] mb-1">
          Ajustar Stock
        </h2>
        <p className="text-gray-500 text-sm mb-5">
          Producto:{" "}
          <span className="font-semibold text-gray-700">
            {producto.nombre}
          </span>
        </p>

        {/* Stock actual */}
        <div className="bg-gray-50 rounded-lg p-4 mb-5 text-center">
          <p className="text-sm text-gray-500">Stock actual</p>
          <p className="text-4xl font-bold text-[#062b2b]">
            {producto.stock_total}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Mínimo: {producto.stock_minimo}
          </p>
        </div>

        {/* Modo sumar / restar */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-5">
          <button
            onClick={() => setModo("sumar")}
            className={`flex-1 py-2 font-semibold text-sm transition ${
              modo === "sumar"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            + Sumar unidades
          </button>
          <button
            onClick={() => setModo("restar")}
            className={`flex-1 py-2 font-semibold text-sm transition ${
              modo === "restar"
                ? "bg-red-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            − Restar unidades
          </button>
        </div>

        {/* Input cantidad */}
        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="¿Cuántas unidades?"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-center focus:outline-none focus:ring-2 focus:ring-[#062b2b] mb-4"
        />

        {/* Preview resultado */}
        {cantidad && parseInt(cantidad) > 0 && (
          <p className="text-center text-sm text-gray-500 mb-4">
            Stock resultante:{" "}
            <span
              className={`font-bold text-base ${
                modo === "sumar" ? "text-green-600" : "text-red-500"
              }`}
            >
              {stockResultante()}
            </span>
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!cantidad || parseInt(cantidad) <= 0}
            className="flex-1 py-3 rounded-lg bg-[#062b2b] text-white font-semibold hover:bg-[#0a3f3f] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalStock;