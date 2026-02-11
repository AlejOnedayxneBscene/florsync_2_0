const menuItems = [
 {
    name: "Inventario",
    path: "/inventario",
    children: [
         { name: "Gestión de inventario", path: "/inventario" },

    ],
  },
  {
    name: "Ventas",
    path: "/ventas",
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
  children: [
    { name: "Gestión de categorías", path: "/categorias" },
  ],
},

];

export default menuItems;
