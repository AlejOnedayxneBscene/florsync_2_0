import { Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../AuthContext";
import routeTitles from "../../data/routeTitles";

export default function TopBar({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const title = routeTitles[location.pathname] || "FlorSync";

 const inicial =
  user?.first_name?.[0]?.toUpperCase() ||
  user?.username?.[0]?.toUpperCase() ||
  "?";

  // Cerrar menú si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full h-14 bg-gradient-to-br from-[#032221] via-[#044A45] to-[#021716] text-white flex items-center justify-between px-4 z-50 shadow">
      
      {/* IZQUIERDA */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-transparent"
          aria-label="Abrir menú"
        >
          <Menu size={26} />
        </button>

        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>

      {/* DERECHA - USUARIO */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="w-9 h-9 rounded-full bg-white text-[#044A45] flex items-center justify-center font-bold"
        >
          {inicial}
        </button>

        {openMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg overflow-hidden">
            
            {/* Nombre del usuario */}
            <div className="px-4 py-2 border-b text-sm text-gray-600">
              {user?.first_name || user?.username || "Usuario"}
              <div className="text-xs text-gray-400">
                {user?.grupo}
              </div>
            </div>

            {/* Botón cerrar sesión */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

    </header>
  );
}