import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
export default function SidebarItem({ item, closeSidebar, isSidebarOpen }){
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
useEffect(() => {
  if (!isSidebarOpen) {
    setOpen(false); 
  }
}, [isSidebarOpen]);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 font-medium hover:bg-gray-700 rounded"
      >
        {item.name}
      </button>

      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1">
          {item.children.map((child) => (
            <button
              key={child.path}
              onClick={() => {
                navigate(child.path);
                closeSidebar();
              }}
              className="text-sm text-gray-300 px-3 py-1 hover:bg-gray-700 rounded"
            >
              {child.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
