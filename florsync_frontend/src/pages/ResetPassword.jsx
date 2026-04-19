import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginContainer from "../components/iu/LoginContainer";
import { confirmarResetPassword } from "../api/apiUsuarios";
import { useLocation } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!codigo) {
      return setError("Ingresa el código");
    }

    if (password !== confirm) {
      return setError("Las contraseñas no coinciden");
    }

    if (password.length < 8) {
      return setError("Mínimo 8 caracteres");
    }

    setLoading(true);
    setError("");

    try {
      // 🔥 ahora mandas el código, no el token de URL
      await confirmarResetPassword(email, codigo, password);

      navigate("/login");
    } catch (err) {
      setError("Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex flex-col gap-6 w-full max-w-sm text-white">

          <h2 className="text-2xl font-bold">Nueva contraseña</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            
            <input
              type="text"
              placeholder="Código de verificación"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="bg-[#0d3b2e] border border-white/10 rounded-xl px-4 py-3"
            />

            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0d3b2e] border border-white/10 rounded-xl px-4 py-3"
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-[#0d3b2e] border border-white/10 rounded-xl px-4 py-3"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#4ecfa0] py-3 rounded-xl text-black"
            >
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </button>

            <Link to="/login" className="text-center text-sm text-white/50">
              Volver
            </Link>

          </form>

        </div>
      </div>
    </LoginContainer>
  );
}