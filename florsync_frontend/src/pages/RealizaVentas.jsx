import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importar para la navegación
import { obtenerProductos } from "../api/test.api";
import "../css/Ventas.css"; // Importamos los estilos

const Ventas = () => {
    const [productos, setProductos] = useState([]);
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [tipos, setTipos] = useState([]);
    const [ventas, setVentas] = useState({});
    const [carrito, setCarrito] = useState([]);
    const [mostrarCantidad, setMostrarCantidad] = useState({});
    const navigate = useNavigate(); // Hook para la navegación

    useEffect(() => {
        document.body.classList.add("menu-body");
        return () => {
            document.body.classList.remove("menu-body");
        };
    }, []);

     useEffect(() => {
                  document.body.classList.add("menu-body");
                  return () => document.body.classList.remove("menu-body");
              }, []);

    useEffect(() => {
        obtenerProductos()
            .then(data => {
                setProductos(data);
                const tiposUnicos = [...new Set(data.map(producto => producto.tipo))];
                setTipos(tiposUnicos);
            })
            .catch(error => console.error("Error al obtener productos:", error));
    }, []);

    const agregarAlCarrito = (producto) => {
        setMostrarCantidad({ ...mostrarCantidad, [producto.id_producto]: true });
    };

    const confirmarAgregarCarrito = (producto) => {
        const cantidadSeleccionada = parseInt(ventas[producto.id_producto] || "0", 10);
    
        if (cantidadSeleccionada > 0 && cantidadSeleccionada <= producto.cantidad) {
            // Reducir el stock disponible en la UI
            setProductos(prevProductos =>
                prevProductos.map(item =>
                    item.id_producto === producto.id_producto
                        ? { ...item, cantidad: item.cantidad - cantidadSeleccionada }
                        : item
                )
            );
    
            // Agregar el producto apara venta
            const productoExistente = carrito.find(item => item.id_producto === producto.id_producto);
    
            if (productoExistente) {
                setCarrito(carrito.map(item =>
                    item.id_producto === producto.id_producto
                        ? { ...item, cantidad: item.cantidad + cantidadSeleccionada }
                        : item
                ));
            } else {
                setCarrito([...carrito, { ...producto, cantidad: cantidadSeleccionada }]);
            }
    
            setMostrarCantidad({ ...mostrarCantidad, [producto.id_producto]: false });
        } else {
            alert("Cantidad no válida o stock insuficiente.");
        }
    };

    const productosFiltrados = productos.filter(producto =>
        (producto.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) ||
            producto.id_producto.toString().includes(filtroNombre)) &&
        (filtroTipo === "" || producto.tipo === filtroTipo)
    );

    const irAlCarrito = () => {
        console.log("Carrito antes de navegar:", carrito);
        navigate("/realizarVenta", { state: { carrito } });
    };

    return (
        <div>
            {/* Encabezado con botón de Carrito */}
            <div className="encabezado-ventas">
                <h1>Registro de <span>Ventas</span></h1>
                <input
                    type="text"
                    className="buscador"
                    placeholder="Buscar producto"
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                />
                <div className="filtros-tipos">
                    {tipos.map((tipo, index) => (
                        <label key={index} className="filtro-checkbox">
                            <input
                                type="checkbox"
                                value={tipo}
                                checked={filtroTipo === tipo}
                                onChange={(e) => setFiltroTipo(e.target.checked ? tipo : "")}
                            />
                            {tipo}
                        </label>
                    ))}
                </div>

                {/* Botón del Carrito pegado al encabezado */}
                <button className="realizar-venta" onClick={irAlCarrito}>
                     Realizar venta ({carrito.length})
                </button>
            </div>

            {/* Lista de productos */}
            <div className="ventas-container">
                {productosFiltrados.length === 0 ? (
                    <p className="mensaje-no-productos">No hay productos disponibles.</p>
                ) : (
                    <div className="productos-container">
                        {productosFiltrados.map(producto => (
                            <div key={producto.id_producto} className="producto-card">
                                <p><strong>Referencia:</strong> {producto.id_producto}</p>
                                <p><strong>Nombre del producto:</strong> {producto.nombre}</p>
                                <p><strong>Precio:</strong> ${parseFloat(producto.precio).toFixed(0)}</p>
                                <p><strong>Stock:</strong> {producto.cantidad}</p>
                                <button className="boton-anadir-carrito" onClick={() => agregarAlCarrito(producto)}>
                                    Añadir al Carrito
                                </button> 
                                 {mostrarCantidad[producto.id_producto] && (
                                    <div>
                                        <input
                                            type="number"
                                            min="1"
                                            max={producto.cantidad}
                                            placeholder="Cantidad"
                                            value={ventas.hasOwnProperty(producto.id_producto) ? ventas[producto.id_producto] : ""}
                                            onChange={(e) => {
                                                const inputValue = e.target.value;

                                                // Permitir cadena vacía mientras se escribe
                                                if (inputValue === "") {
                                                    setVentas({ ...ventas, [producto.id_producto]: "" });
                                                    return;
                                                }

                                                const value = parseInt(inputValue, 10);
                                                if (!isNaN(value) && value > 0 && value <= producto.cantidad) {
                                                    setVentas({ ...ventas, [producto.id_producto]: value });
                                                }
                                            }}
                                        />
                                            <button onClick={() => confirmarAgregarCarrito(producto)}>Confirmar</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ventas;