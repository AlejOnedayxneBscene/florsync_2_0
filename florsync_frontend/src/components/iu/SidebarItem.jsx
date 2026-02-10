import { NavLink } from "react-router-dom";

export default function SidebarItem({ item, closeSidebar }) {
  return (
    <NavLink
      to={item.path}
      onClick={closeSidebar}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md transition
        ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`
      }
    >
      {item.icon && <item.icon size={20} />}
      <span>{item.name}</span>
    </NavLink>
  );
}
