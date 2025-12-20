import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/MenuStyles.css"; // Asegúrate de tener este archivo con los estilos

const menuItems = [
  { name: "Inventario", image: "/images/inventario.png" },
  { name: "Ventas", image: "/images/ventas.png" },
  { name: "Clientes", image: "/images/clientes.png" },
  { name: "Informes", image: "/images/informes.png" },
];

const Menu = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("menu-body"); // Agregar clase al montar

    return () => {
      document.body.classList.remove("menu-body"); // Remover clase al desmontar
    };
  }, []);

  return (
    <div>
      <header className="menu-header">
        <h1 className="menu-title">Menú</h1>
      </header>
      <div className="menu-container">
        {menuItems.map((item, index) => (
          <div
            className="menu-item"
            key={index}
            onClick={() => navigate(`/modulo/${item.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
            <span>{item.name}</span>
            <img src={item.image} alt={item.name} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
