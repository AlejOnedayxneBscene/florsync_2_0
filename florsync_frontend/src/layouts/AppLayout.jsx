import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "../components/iu/TopBar";
import SideBar from "../components/iu/SliderBar";

export default function AppLayout() {
  const [open, setOpen] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 flex">
      {/* Sidebar */}
      <SideBar open={open} setOpen={setOpen} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopBar fijo arriba */}
        <TopBar toggleSidebar={() => setOpen(!open)} />

        {/* Main */}
        <main
          className={`
            flex-1
            transition-all duration-300
            pt-16
            ${open ? "ml-0 md:ml-64" : "ml-0"}
          `}
        >
          {/* Contenido */}
          <div className="w-full min-h-[calc(100vh-64px)] px-4 md:px-6 py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
