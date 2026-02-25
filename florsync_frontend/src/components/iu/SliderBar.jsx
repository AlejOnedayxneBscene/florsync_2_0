import { useEffect, useRef } from "react";
import menuItems from "../../data/menuItems";
import SidebarItem from "./SliderBarItems";
import NameApp from "./NameApp";
import { useAuth } from "../AuthContext";

export default function SideBar({ open, setOpen }) {
  const ref = useRef(null);
  const { user, isAuthLoaded } = useAuth();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!isAuthLoaded) return null;

const userGrupo = user?.grupo || "";

const filteredItems = menuItems.filter((item) => {
  if (item.name === "Historial") {
    return userGrupo === "Administrador";
  }
  return true;
});

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        ref={ref}
        className={`fixed top-14 left-0 h-[calc(100%-3.5rem)] w-64
        bg-gradient-to-br from-[#032221] via-[#044A45] to-[#021716]
        text-white p-4 z-40
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <h2 className="text-xl font-bold mb-4">Menú</h2>

        <nav className="flex flex-col gap-2">
          {filteredItems.map((item) => (
            <SidebarItem
              key={item.name}
              item={item}
              closeSidebar={() => setOpen(false)}
            />
          ))}
        </nav>

        <div className="absolute bottom-4">
          <NameApp text="FlorSync 2.0" className="text-xl font-bold" />
        </div>
      </aside>
    </>
  );
}
