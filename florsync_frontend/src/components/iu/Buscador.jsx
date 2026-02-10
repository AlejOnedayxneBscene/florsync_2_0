// Buscador.jsx
import React from "react";

const Buscador = ({ busqueda, setBusqueda, placeholder = "Buscar..." }) => {
  return (
    <div className="w-full sm:w-[320px] mb-3 sm:mb-0">
      <input
        type="text"
        placeholder={placeholder}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-white border-4 border-gray-500 rounded px-4 py-2 text-[15px] focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-400 transition"
      />
    </div>
  );
};

export default Buscador;
