import React, { useEffect, useState } from "react";
import { obtenerProductos } from "../api/apiProductos";
import { registrarVenta } from "../api/apiVentas";
import { obtenerCategorias } from "../api/apiCategorias";
import DataTable from "../components/iu/CategoriasList";
import Buscador from "../components/iu/Buscador";
import FiltroCategoria from "../components/iu/FiltroCategoria";
import Button from "../components/iu/Button";
import ResumenVenta from "../components/iu/ResumeVenta";
import { buscarClientePorCedula, crearCliente } from "../api/apiClientes";
import ConfirmModal from "../components/iu/ConfirmModal";

const Ventas = () => {
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ventaSuccess, setVentaSuccess] = useState(null);
  const [clienteParaVenta, setClienteParaVenta] = useState(null);

  // CARGAR PRODUCTOS Y CATEGORÍAS
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const categoriasData = await obtenerCategorias();
        setCategorias(categoriasData);

        const productosData = await obtenerProductos();
        const productosConCategorias = productosData.map((p) => {
          const cat = categoriasData.find((c) => c.id_categoria === p.categoria);
          return { ...p, categoria: cat || { nombre_categoria: "-" } };
        });

        setProductos(productosConCategorias);
      } catch (error) {
        console.error("Error cargando productos o categorías:", error);
      }
    };

    cargarDatos();
  }, []);

  // CARRITO
  const agregarAlCarrito = (producto) => {
    if (carrito.find((item) => item.id_producto === producto.id_producto)) return;
    setCarrito([...carrito, { ...producto, cantidad: 1 }]);
  };

  const aumentarCantidad = (id) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id_producto === id && item.cantidad < item.stock_total
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const disminuirCantidad = (id) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.id_producto === id ? { ...item, cantidad: item.cantidad - 1 } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const cambiarCantidad = (id, nuevaCantidad) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id_producto === id
          ? { ...item, cantidad: Math.min(nuevaCantidad, item.stock_total) }
          : item
      )
    );
  };

  const [inputTemporal, setInputTemporal] = useState({});
  const handleInputChange = (id, value) => {
  // Obtener el producto del carrito
  const producto = carrito.find((item) => item.id_producto === id);
  let nuevoValor = Number(value);

  // Limitar entre 1 y stock_total
  if (nuevoValor > producto.stock_total) nuevoValor = producto.stock_total;
  if (nuevoValor < 1) nuevoValor = 1;

  setInputTemporal((prev) => ({ ...prev, [id]: nuevoValor.toString() }));
  cambiarCantidad(id, nuevoValor);
};


  // REGISTRAR VENTA CON LOGS
  const handleVenta = async ({ cliente }) => {
    if (carrito.length === 0) {
      console.warn("⚠️ Carrito vacío, no se puede registrar venta");
      return;
    }

    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    if (metodoPago === "efectivo" && Number(efectivoRecibido) < total) {
      console.warn("⚠️ Efectivo recibido insuficiente", efectivoRecibido, "para total", total);
      return;
    }

    let clienteId = null;
    if (cliente?.cedula) {
      console.log("🔍 Buscando cliente por cédula:", cliente.cedula);
      const existente = await buscarClientePorCedula(cliente.cedula);
      if (existente) {
        console.log(" Cliente existente encontrado:", existente);
        clienteId = existente.id_cliente;
      } else {
        console.log(" Cliente no existe, creando nuevo cliente:", cliente);
        const nuevo = await crearCliente(cliente);
        clienteId = nuevo.id_cliente;
        console.log(" Cliente creado:", nuevo);
      }
    }

   const payload = {
  cliente: clienteParaVenta || null,
  metodo_pago: metodoPago,
  efectivo_recibido:
    metodoPago === "efectivo"
      ? Number(efectivoRecibido)
      : null,
  total: total,
  productos: carrito.map((item) => ({
    id_producto: item.id_producto,
    cantidad: item.cantidad,
  })),
};


    console.log("📤 Payload de la venta que se enviará al backend:", payload);

    try {
      const respuesta = await registrarVenta(payload);
      console.log("📥 Respuesta del backend:", respuesta);
    } catch (error) {
      console.error("🔥 Error al registrar la venta:", error);
      throw error;
    }

    // 🔹 Descontar stock en frontend
    setProductos((prev) =>
      prev.map((p) => {
        const itemVendido = carrito.find((c) => c.id_producto === p.id_producto);
        return itemVendido ? { ...p, stock_total: p.stock_total - itemVendido.cantidad } : p;
      })
    );

    // 🔹 Limpiar carrito y reiniciar pago
    setCarrito([]);
    setMetodoPago("efectivo");
    setEfectivoRecibido("");
  };

  const handleConfirmVenta = (cliente) => {
    if (carrito.length === 0) return;
    setClienteParaVenta(cliente);
    setConfirmOpen(true);
  };

  const handleVentaReal = async () => {
    try {
      await handleVenta({ cliente: clienteParaVenta });
      setVentaSuccess(true);
    } catch (error) {
      setVentaSuccess(false);
    } finally {
      setTimeout(() => {
        setConfirmOpen(false);
        setVentaSuccess(null);
      }, 2000);
    }
  };

  const stockDisponible = (producto) => {
  const enCarrito = carrito.find(
    (c) => c.id_producto === producto.id_producto
  );
  return producto.stock_total - (enCarrito?.cantidad || 0);
};

  // FILTROS
  const productosFiltrados = productos.filter((producto) => {
    const coincideNombre =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.id_producto.toString().includes(busqueda);
    const coincideCategoria =
      !categoriaSeleccionada || producto.categoria?.id_categoria === Number(categoriaSeleccionada);
    return coincideNombre && coincideCategoria;
  });

  // COLUMNAS TABLA
  const columns = [
    { key: "id_producto", label: "ID" },
    { key: "nombre", label: "Nombre" },
    { key: "categoria", label: "Categoría", render: (row) => row.categoria?.nombre_categoria || "-" },
    {
      key: "precio",
      label: "Precio",
      render: (row) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(
          row.precio
        ),
    },
      {
    key: "stock_total",
    label: "Stock",
    render: (row) => stockDisponible(row),
  }
,
    {
      key: "venta",
      label: "Venta",
      align: "center",
      render: (row) => {
        const productoEnCarrito = carrito.find((item) => item.id_producto === row.id_producto);
        if (!productoEnCarrito)
          return <Button className="h-6 px-2 text-xs" onClick={() => agregarAlCarrito(row)}>Añadir</Button>;

        return (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => disminuirCantidad(row.id_producto)} className="w-6 h-6 rounded-full bg-red-500 text-white text-sm">−</button>
            <input
  type="number"
  min="1"
  max={row.stock_total}
  value={inputTemporal[row.id_producto] ?? productoEnCarrito.cantidad.toString()}
  onChange={(e) => {
    const val = e.target.value;
    // Permitimos temporalmente vacíos o números
    if (/^\d*$/.test(val)) {
      setInputTemporal((prev) => ({ ...prev, [row.id_producto]: val }));
    }
  }}
  onBlur={() => {
    let val = Number(inputTemporal[row.id_producto]);
    if (!val || val < 1) val = 1;
    if (val > row.stock_total) val = row.stock_total;

    cambiarCantidad(row.id_producto, val);
    setInputTemporal((prev) => ({ ...prev, [row.id_producto]: val.toString() }));
  }}
  className="w-10 text-center border rounded text-sm"
/>

            <button
              onClick={() => aumentarCantidad(row.id_producto)}
              disabled={productoEnCarrito.cantidad >= row.stock_total}
              className="w-6 h-6 rounded-full bg-green-500 text-white text-sm disabled:bg-gray-300"
            >
              +
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full bg-gray-200 p-4 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <Buscador busqueda={busqueda} setBusqueda={setBusqueda} placeholder="Buscar producto" />
              <FiltroCategoria categorias={categorias} categoriaSeleccionada={categoriaSeleccionada} setCategoriaSeleccionada={setCategoriaSeleccionada} />
            </div>
            <div className="text-right mt-2 lg:mt-0 lg:ml-4">
              <div className="text-xl font-semibold text-gray-700">Total</div>
              <span className="text-5xl font-extrabold text-green-600">
                {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(
                  carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
                )}
              </span>
            </div>
          </div>

          <DataTable title="Productos" columns={columns} data={productosFiltrados} />
        </div>

        <ResumenVenta
          carrito={carrito}
          setCarrito={setCarrito}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          efectivoRecibido={efectivoRecibido}
          setEfectivoRecibido={setEfectivoRecibido}
          onRealizarVenta={handleConfirmVenta}
          buscarClientePorCedula={buscarClientePorCedula}
        />
      </div>

      <ConfirmModal
        open={confirmOpen}
        onConfirm={handleVentaReal}
        onCancel={() => setConfirmOpen(false)}
        success={ventaSuccess}
      />
    </div>
  );
};

export default Ventas;
