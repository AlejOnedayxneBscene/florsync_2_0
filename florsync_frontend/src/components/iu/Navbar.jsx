import { useState } from "react";
import { Menu } from "lucide-react";
import SideBar from "./SideBar";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-14 bg-gradient-to-br from-[#032221] via-[#044A45] to-[#021716] text-white flex items-center px-4 z-50">
        
        {/* BOTÓN HAMBURGUESA */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md bg-gradient-to-br from-[#032221] via-[#044A45] to-[#021716] transition hover:opacity-80"
        >
          <Menu size={26} />
        </button>

        <h1 className="ml-4 font-bold text-lg">Mi App</h1>
      </header>

      <SideBar open={open} setOpen={setOpen} />
    </>
  );
}
