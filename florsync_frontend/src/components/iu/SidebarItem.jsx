import { useAuth } from "../components/AuthContext";
import menuItems from "../menuItems";
import SidebarItem from "./SidebarItem";

export default function Sidebar({ closeSidebar }) {
  const { user } = useAuth(); // tu user debe tener 'rol'

  // 🔹 Filtrar solo los items permitidos según el rol
  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.rol)
  );

  return (
    <div className="p-4 w-64 bg-gray-800 text-white h-screen">
      {filteredMenu.map(item => (
        <div key={item.path}>
          {/* Item principal */}
          <SidebarItem item={item} closeSidebar={closeSidebar} />

          {/* Sub-items si los tiene */}
          {item.children?.map(child => (
            <SidebarItem key={child.path} item={child} closeSidebar={closeSidebar} />
          ))}
        </div>
      ))}
    </div>
  );
}
