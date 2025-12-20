import React, { useEffect, useState } from "react";
import { obtenerProductos } from "../api/test.api";
import "../css/Visualizar.css"; 

const Visualizar = () => {
    const [productos, setProductos] = useState([]);
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [tipos, setTipos] = useState([]);

    useEffect(() => {
        obtenerProductos()
            .then(data => {
                setProductos(data);
                const tiposUnicos = [...new Set(data.map(producto => producto.tipo))];
                setTipos(tiposUnicos);
            })
            .catch(error => console.error("Error al obtener productos:", error));
    }, []);

    const productosFiltrados = productos.filter(producto =>
        (producto.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) || 
         producto.id_producto.toString().includes(filtroNombre)) &&
        (filtroTipo === "" || producto.tipo === filtroTipo)
    );

    useEffect(() => {
        document.body.classList.add("inventario-body");
        return () => {
          document.body.classList.remove("inventario-body");
        };
      }, []);

      return (
        <div>
            {/* Encabezado con barra de búsqueda y filtros */}
            <div className="encabezado-inventario">
                <h1>Inventario <span>Actual</span></h1>
    
                {/* Barra de búsqueda */}
                <input
                    type="text"
                    className="buscador"
                    placeholder="Buscar producto"
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                />
    
                {/* Filtros */}
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
            </div>
    
            {/* Contenedor del inventario */}
            <div className="inventario-container">
                {productosFiltrados.length === 0 ? (
                    <p className="mensaje-no-productos">No hay productos disponibles.</p>
                ) : (
                    <div className="productos-container">
                        {productosFiltrados.map(producto => (
                            <div key={producto.id_producto} className="producto-card">
                                <p><strong>Referencia:</strong> {producto.id_producto}</p>
                                <p><strong>Nombre del producto:</strong> {producto.nombre}</p>
                                <p><strong>Cantidad actual:</strong> {producto.cantidad}</p>
                                <p><strong>Precio:</strong> ${parseFloat(producto.precio).toFixed(0)}</p>
                                <p><strong>Tipo:</strong> {producto.tipo}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
    
}
export default Visualizar;