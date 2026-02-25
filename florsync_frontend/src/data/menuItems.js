const menuItems = [
  {
    name: "Inventario",
    path: "/inventario",
    roles: ["Administrador", "Vendedor"],
    children: [
      { name: "Gestión de inventario", path: "/inventario" },
    ],
  },
  {
    name: "Ventas",
    path: "/ventas",
    roles: ["Administrador", "Vendedor"],
    children: [
      { name: "Registrar venta", path: "/ventas/nueva" },
      { name: "Historial de ventas", path: "/ventas/historial" },
    ],
  },
  {
    name: "Clientes",
    path: "/clientes",
    children: [
      { name: "Gestión de clientes", path: "/clientes" },
    ],
  },
  {
    name: "Categorías",
    path: "/categorias",
    roles: ["Administrador"],
    children: [
      { name: "Gestión de categorías", path: "/categorias" },
    ],
  },
  {
    name: "Historial",
    path: "/historial",
    roles: ["Administrador"], 
    children: [
      { name: "Actividad de cambios", path: "/historial" },
    ],
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    roles: ["Administrador"], 
    children: [
      { name: "Dashboard", path: "/dashboard" },
    ],
  },
];

export default menuItems;
