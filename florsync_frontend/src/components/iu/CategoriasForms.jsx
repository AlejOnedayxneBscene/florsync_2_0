import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

const Form = ({
  fields = [],
  formData,
  handleChange,
  handleSubmit,
  loading,
  submitText = "Guardar",
}) => {
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setError("");
    setFieldError({});
    setStatus(null);
  }, [formData]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError("");
    setFieldError({});

    const errors = {};

    // 🔹 Validaciones personalizadas
    fields.forEach((f) => {
      const val = formData[f.name];

      if (!val && f.type !== "number") {
        errors[f.name] = "Este campo es obligatorio";
      }

      if (f.type === "number") {
        const num = Number(val);
        if (!val || num <= 0) {
          errors[f.name] = "El valor debe ser mayor que 0";
        }
        if (f.name === "precio" && num < 500) {
          errors[f.name] = "El precio mínimo es 500";
        }
      }
    });

    // 🔹 Validación stock_total >= stock_minimo
    if (
      formData.stock_total &&
      formData.stock_minimo &&
      Number(formData.stock_total) < Number(formData.stock_minimo)
    ) {
      errors.stock_total = "Stock total debe ser mayor o igual al mínimo";
      errors.stock_minimo = "Stock mínimo no puede ser mayor que el total";
    }

    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      setError("Por favor corrige los campos resaltados");
      setStatus("error");
      return;
    }

    try {
      await handleSubmit(e, setError, setFieldError);
      setStatus("success");
      setTimeout(() => setStatus(null), 1400);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus(null), 1400);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      {status && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold
            ${status === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {status === "success" ? (
            <>
              <CheckCircle2 size={18} />
              <span>Guardado correctamente</span>
            </>
          ) : (
            <>
              <XCircle size={18} />
              <span>Ocurrió un error</span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>
      )}

      {fields.map((f) => (
        <div key={f.name}>
          <label className="block mb-1 font-semibold text-[15px]">{f.label}</label>

          {/* 🔹 Campo select de categoría */}
          {f.name === "categoria" && f.options ? (
            <select
              name={f.name}
              value={formData[f.name] ?? ""}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2
                ${fieldError[f.name] ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Seleccione una categoría</option>
              {f.options
                .filter(c => c.activo !== false) // 🔹 solo categorías activas
                .map((opt) => (
                  <option key={opt.id_categoria} value={opt.id_categoria}>
                    {opt.nombre_categoria}
                  </option>
                ))
              }

              {/* 🔹 Si el producto tiene categoría desactivada, mostrarla pero deshabilitada */}
              {formData.categoria &&
                !f.options.some(c => c.id_categoria === formData.categoria) && (
                  <option value={formData.categoria} disabled>
                    {formData.categoria_nombre || "Categoría desactivada"}
                  </option>
                )}
            </select>
          ) : (
            // 🔹 Campo input genérico (texto o número)
            <input
              type={f.type || "text"}
              name={f.name}
              value={
                typeof formData[f.name] === "string"
                  ? formData[f.name].toLowerCase()
                  : formData[f.name] ?? ""
              }
              onChange={(e) => {
                let value = e.target.value;
                if (f.type === "text" || f.type === "textarea") {
                  value = value.toLowerCase();
                }
                if (f.type === "number" && value.startsWith("-")) return;
                handleChange({ target: { name: f.name, value } });
              }}
              placeholder={f.placeholder || ""}
              min={f.type === "number" ? 1 : undefined}
              className={`w-full border rounded px-3 py-2
                ${fieldError[f.name] ? "border-red-500" : "border-gray-300"}`}
            />
          )}

          {fieldError[f.name] && (
            <p className="text-red-500 text-sm mt-1">{fieldError[f.name]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold
          ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
      >
        {loading ? "Guardando..." : submitText}
      </button>
    </form>
  );
};

export default Form;
