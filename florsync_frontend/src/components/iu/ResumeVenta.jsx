import React, { useState, useEffect } from "react";
import Button from "../iu/Button";

const ResumenVenta = ({
  carrito = [],
  setCarrito,
  metodoPago,
  setMetodoPago,
  efectivoRecibido,
  setEfectivoRecibido,
  onRealizarVenta,
  buscarClientePorCedula,
}) => {
  const [cliente, setCliente] = useState({
    cedula: "",
    nombre_cliente: "",
    correo: "",
    telefono: "",
    direccion: "",
  });

  const [clienteEncontrado, setClienteEncontrado] = useState(false);

  // ================================
  // TOTAL REAL DE LA VENTA
  // ================================
  const total = carrito.reduce(
    (acc, item) => acc + Number(item.precio) * Number(item.cantidad),
    0
  );

  const vuelto =
    metodoPago === "efectivo"
      ? Number(efectivoRecibido || 0) - total
      : 0;

  // 🔥 Validaciones del botón
  const efectivoInsuficiente =
    metodoPago === "efectivo" &&
    Number(efectivoRecibido || 0) < total;

  const ventaDeshabilitada =
    carrito.length === 0 || efectivoInsuficiente;

  // ================================
  // CARRITO
  // ================================
  const eliminarProducto = (id) => {
    setCarrito((prev) =>
      prev.filter((item) => item.id_producto !== id)
    );
  };

  const cancelarCompra = () => {
    setCarrito([]);
    setEfectivoRecibido("");
  };

  // ================================
  // BUSCAR CLIENTE
  // ================================
  useEffect(() => {
    const buscarCliente = async () => {
      if (!cliente.cedula || cliente.cedula.length < 5) {
        setClienteEncontrado(false);
        return;
      }

      const data = await buscarClientePorCedula(cliente.cedula);

      if (data) {
        setCliente((prev) => ({
          ...prev,
          nombre_cliente: data.nombre_cliente || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
        }));
        setClienteEncontrado(true);
      } else {
        setClienteEncontrado(false);
      }
    };

    buscarCliente();
  }, [cliente.cedula, buscarClientePorCedula]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full lg:w-[420px] bg-white shadow-2xl rounded-2xl p-6 flex flex-col">

      {/* TOTAL */}
      <h2 className="text-4xl font-extrabold text-center mb-4 text-teal-700">
        ${total.toLocaleString("es-CO")}
      </h2>

      {/* CARRITO */}
      <div className="max-h-[300px] overflow-y-auto space-y-3 border-t border-b py-4">
        {carrito.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">
            No hay productos añadidos
          </p>
        ) : (
          carrito.map((item) => (
            <div
              key={item.id_producto}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"
            >
              <div>
                <p className="font-semibold text-lg">{item.nombre}</p>
                <p className="text-gray-500">
                  {item.cantidad} x ${item.precio.toLocaleString("es-CO")}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">
                  ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                </p>

                <button
                  onClick={() => eliminarProducto(item.id_producto)}
                  className="text-red-600 text-sm mt-1 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {carrito.length > 0 && (
        <button
          onClick={cancelarCompra}
          className="mt-3 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold"
        >
          Cancelar compra
        </button>
      )}

      {/* CLIENTE */}
      <div className="mt-5 space-y-2">
        <label className="text-base font-semibold">
          Cliente (Opcional)
        </label>

        <input
          type="text"
          name="cedula"
          placeholder="Cédula"
          value={cliente.cedula}
          onChange={handleChange}
          className="w-full border rounded-xl px-3 py-2 text-lg"
        />

        {clienteEncontrado && (
          <p className="text-green-600 text-sm font-semibold">
            Cliente encontrado ✔
          </p>
        )}

        <input
          type="text"
          name="nombre_cliente"
          placeholder="Nombre"
          value={cliente.nombre_cliente}
          onChange={handleChange}
          className="w-full border rounded-xl px-3 py-2"
        />

        <input
          type="email"
          name="correo"
          placeholder="Correo"
          value={cliente.correo}
          onChange={handleChange}
          className="w-full border rounded-xl px-3 py-2"
        />

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={cliente.telefono}
          onChange={handleChange}
          className="w-full border rounded-xl px-3 py-2"
        />

        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={cliente.direccion}
          onChange={handleChange}
          className="w-full border rounded-xl px-3 py-2"
        />
      </div>

      {/* MÉTODO DE PAGO */}
      <div className="mt-4">
        <label className="block text-base font-semibold mb-1">
          Método de pago
        </label>

        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-lg"
        >
          <option value="efectivo">Efectivo</option>
          <option value="nequi">Nequi</option>
          <option value="daviplata">Daviplata</option>
        </select>
      </div>

      {metodoPago === "efectivo" && (
        <div className="mt-4 space-y-2">
          <input
            type="number"
            placeholder="Efectivo recibido"
            value={efectivoRecibido}
            onChange={(e) => setEfectivoRecibido(e.target.value)}
            className="w-full border rounded-xl px-3 py-3 text-xl font-semibold"
          />

          <div
            className={`text-right text-2xl font-extrabold ${
              vuelto < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            Vuelto: ${vuelto.toLocaleString("es-CO")}
          </div>

          {vuelto < 0 && (
            <p className="text-red-600 font-semibold">
              El efectivo es insuficiente
            </p>
          )}
        </div>
      )}

      {/* BOTÓN FINAL */}
      <Button
        onClick={() => onRealizarVenta(cliente)}
        disabled={ventaDeshabilitada}
        className={`px-4 py-2 rounded mt-4 text-white ${
          ventaDeshabilitada
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Realizar Venta
      </Button>
    </div>
  );
};

export default ResumenVenta;
