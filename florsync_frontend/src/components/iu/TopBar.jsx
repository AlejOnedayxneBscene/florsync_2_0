import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import routeTitles from "../../data/routeTitles";

export default function TopBar({ toggleSidebar }) {
  const location = useLocation();

  const title = routeTitles[location.pathname] || "FlorSync";

  return (
    <header className="fixed top-0 left-0 w-full h-14 bg-gradient-to-br from-[#032221] via-[#044A45] to-[#021716] text-white flex items-center justify-between px-4 z-50 shadow">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-transparent z-30"
          aria-label="Abrir menú"
        >
          <Menu size={26} />
        </button>

        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <button className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">
        A
      </button>
    </header>
  );
}
