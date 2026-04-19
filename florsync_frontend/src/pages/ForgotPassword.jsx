import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginContainer from "../components/iu/LoginContainer";
import { solicitarResetPassword } from "../api/apiUsuarios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return setError("Ingresa un correo");
    }

    setLoading(true);
    setError("");

    try {
      await solicitarResetPassword(email);

      // 🔥 IMPORTANTE: redirigir a pantalla de código
      navigate("/reset-password", { state: { email } });

      setSent(true);
      setEmail("");
    } catch (err) {
      console.error(err);
      setSent(true); // seguridad
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex flex-col gap-6 w-full max-w-sm text-white">

          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">Recuperar contraseña</h2>
            <p className="text-white/50 text-sm">
              Ingresa tu correo y te enviaremos un código
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col gap-4">
              <div className="bg-[#0d3b2e] rounded-xl p-4 text-sm text-white/80">
                Si el correo existe, recibirás un código.
              </div>

              <Link to="/login" className="text-center text-sm text-white/50 hover:text-white">
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <input
                type="email"
                placeholder="Tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0d3b2e] border border-white/10 rounded-xl px-4 py-3"
              />

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-[#4ecfa0] rounded-xl py-3 text-black"
              >
                {loading ? "Enviando..." : "Enviar código"}
              </button>

              <Link to="/login" className="text-center text-sm text-white/50 hover:text-white">
                Volver
              </Link>

            </form>
          )}

        </div>
      </div>
    </LoginContainer>
  );
}