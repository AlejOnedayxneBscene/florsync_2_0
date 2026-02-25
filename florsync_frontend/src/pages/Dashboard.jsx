import { useAuth } from "../components/AuthContext";

export default function Dashboard() {
  const { user, isAuthLoaded } = useAuth();

  if (!isAuthLoaded) return <div>Cargando...</div>;

  const nombre =
    user?.first_name ||
    user?.username ||
    "Usuario";

  return (
    <div className="p-6">
      <div className="bg-white shadow-md rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Bienvenido, {nombre} 
        </h1>

        <p className="mt-4 text-gray-600">
          Este es tu panel principal
        </p>
      </div>
    </div>
  );
}