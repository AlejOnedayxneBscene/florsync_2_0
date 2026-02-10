import React from "react";

const FiltroCategoria = ({ categorias, categoriaSeleccionada, setCategoriaSeleccionada }) => {
  return (
    <div className="w-full sm:w-[320px] mt-2 sm:mt-0">
      <select
        value={categoriaSeleccionada}
        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        className="w-full border-2 border-blue-400 bg-gray-100 rounded px-4 py-2 text-[15px] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 transition"
      >
        <option value="">Filtrar por categoría</option>
        {categorias
          .filter((c) => c.activo !== false) // 🔹 solo categorías activas
          .map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre_categoria}
            </option>
          ))}
      </select>
    </div>
  );
};

export default FiltroCategoria;
