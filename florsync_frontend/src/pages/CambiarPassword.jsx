import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cambiarPasswordProvisional } from "../api/apiUsuarios";
import LoginContainer from "../components/iu/LoginContainer";

const CambiarPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState({
    password_actual: false,
    password_nuevo: false,
    password_confirmar: false,
  });
  const [formData, setFormData] = useState({
    password_actual: "",
    password_nuevo: "",
    password_confirmar: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldError({ ...fieldError, [e.target.name]: false });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { password_actual, password_nuevo, password_confirmar } = formData;

    // Validaciones front
    const errors = {};
    if (!password_actual) errors.password_actual = true;
    if (!password_nuevo) errors.password_nuevo = true;
    if (!password_confirmar) errors.password_confirmar = true;

    if (Object.keys(errors).length > 0) {
      setFieldError((prev) => ({ ...prev, ...errors }));
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password_nuevo.length < 8) {
      setFieldError((prev) => ({ ...prev, password_nuevo: true }));
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password_nuevo !== password_confirmar) {
      setFieldError((prev) => ({
        ...prev,
        password_nuevo: true,
        password_confirmar: true,
      }));
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await cambiarPasswordProvisional(password_actual, password_nuevo);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err.message || "Error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <div className="w-full max-w-md mx-auto flex flex-col justify-center px-6 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 mb-4">
            <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Cambia tu contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tu cuenta tiene una contraseña provisional. Por seguridad, debes crear una nueva antes de continuar.
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-medium text-center">
              ¡Contraseña actualizada! Redirigiendo...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Password actual */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Contraseña actual
              </label>
              <input
                type="password"
                name="password_actual"
                value={formData.password_actual}
                onChange={handleChange}
                placeholder="Tu contraseña provisional"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
                  ${fieldError.password_actual
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  }`}
              />
            </div>

            {/* Nueva contraseña */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <input
                type="password"
                name="password_nuevo"
                value={formData.password_nuevo}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
                  ${fieldError.password_nuevo
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  }`}
              />
            </div>

            {/* Confirmar contraseña */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                name="password_confirmar"
                value={formData.password_confirmar}
                onChange={handleChange}
                placeholder="Repite la nueva contraseña"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
                  ${fieldError.password_confirmar
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  }`}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white font-semibold rounded-lg transition text-sm mt-2"
            >
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}
      </div>
    </LoginContainer>
  );
};

export default CambiarPassword;