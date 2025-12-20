import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerProductoPorID, modificarProducto, obtenerClientesPorID, modificarCliente } from "../api/test.api";
import "../css/Modificar.css";

const Modificar = () => {
    const { tipo, id } = useParams();
    const navigate = useNavigate();
    const [filtroID, setFiltroID] = useState(id || "");
    const [formData, setFormData] = useState({});
    const [error, setError] = useState("");
    const [modificadoExitoso, setModificadoExitoso] = useState(false);
    const [cantidadAgregar, setCantidadAgregar] = useState(""); // Mantiene el valor de la cantidad a añadir

    const datosProducto = [
        { campo: "nombre", etiqueta: "Nombre" },
        { campo: "precio", etiqueta: "Precio" },
        { campo: "tipo", etiqueta: "Tipo" },
        { campo: "cantidad", etiqueta: "Cantidad" },
        
    ];

    const datosCliente = [
        { campo: "cedula", etiqueta: "ID Cliente" },
        { campo: "nombre_cliente", etiqueta: "Nombre" },
        { campo: "telefono", etiqueta: "Teléfono" },
        { campo: "direccion", etiqueta: "Dirección" },
        { campo: "correo", etiqueta: "Correo" },
    ];

    useEffect(() => {
        document.body.classList.add("modificar-body");
        return () => {
            document.body.classList.remove("modificar-body");
        };
    }, []);

    const buscarPorID = async () => {
        try {
            setError("");
            setModificadoExitoso(false);
            let data;
            if (tipo === "actualizar-producto") {
                data = await obtenerProductoPorID(filtroID);
            } else if (tipo === "modificar-clientes-existentes") {
                data = await obtenerClientesPorID(filtroID);
            } else {
                throw new Error("Tipo no válido");
            }
            setFormData(data);
            setCantidadAgregar(""); // Limpiar el campo de cantidad agregar
        } catch (error) {
            setError("No se encontró ningún registro con ese ID.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validaciones de campos específicos
        if (["precio", "telefono", "cedula"].includes(name) && !/^\d*$/.test(value)) return;
        if (name === "correo" && value.length > 50) return;
        if (value.length > 45 && name !== "correo") return;

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCantidadAgregarChange = (e) => {
        const { value } = e.target;
        // Solo permitir números en "Añadir Cantidad"
        if (/^\d*$/.test(value)) {
            setCantidadAgregar(value);
        }
    };

    const validarCampos = () => {
        if (tipo === "actualizar-producto") {
            const { nombre, precio, tipo: tipoProd, cantidad, cantidadAgregar } = formData;
            
            // Validación para asegurar que los campos no estén vacíos, considerando el 0 como válido para cantidad
            if (!nombre || !precio || !tipoProd || cantidad === undefined || cantidad === null || cantidad === "") {
                setError("Todos los campos deben estar completos.");
                return false;
            }
            
            if (cantidadAgregar && !/^\d+$/.test(cantidadAgregar)) {
                setError("La cantidad a añadir debe ser un número.");
                return false;
            }
        } else {
            const { cedula, nombre_cliente, telefono, direccion, correo } = formData;
            
            if (!cedula || !nombre_cliente || !telefono || !direccion || !correo) {
                setError("Todos los campos deben estar completos.");
                return false;
            }
            
            if (cedula.length < 10 || telefono.length < 10) {
                setError("La cédula y el teléfono deben tener al menos 10 dígitos.");
                return false;
            }
            
            const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
            if (!correoValido) {
                setError("El correo no es válido.");
                return false;
            }
        }
        
        setError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarCampos()) return;

        try {
            if (tipo === "actualizar-producto") {
                const cantidadOriginal = parseInt(formData.cantidad || "0", 10);
                const cantidadExtra = parseInt(cantidadAgregar || "0", 10);
                const nuevaCantidad = cantidadOriginal + cantidadExtra;

                const formDataActualizado = {
                    ...formData,
                    cantidad: nuevaCantidad.toString()
                };

                await modificarProducto(formData.id_producto, formDataActualizado);
            } else {
                await modificarCliente(formData.cedula, formData);
            }
            setModificadoExitoso(true);
        } catch (error) {
            alert("Error al modificar: " + error.message);
        }
    };

    const volverAlInicio = () => navigate("/menu");
    const modificarOtro = () => {
        setFormData({});
        setFiltroID("");
        setModificadoExitoso(false);
        setCantidadAgregar("");
    };

    return (
        <div className="modificar-body">
            <div className="modificar-header">
                <h2>Modificar {tipo === "actualizar-producto" ? "Producto" : "Cliente"}</h2>
            </div>
    
            {!modificadoExitoso && (
                <>
                    <input
                        type="text"
                        className="buscador-modificar"
                        placeholder="Buscar por ID"
                        value={filtroID}
                        onChange={(e) => setFiltroID(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && buscarPorID()}
                    />
                    <button className="btn-buscar" onClick={buscarPorID}>Buscar</button>
                </>
            )}
    
            {error && <p className="error">{error}</p>}
    
            {modificadoExitoso ? (
                <div className="mensaje-exito">
                    <h3>¡{tipo === "actualizar-producto" ? "Producto" : "Cliente"} modificado exitosamente!</h3>
                    <button className="btn-volver" onClick={volverAlInicio}>Volver al Menú Principal</button>
                    <button className="btn-modificar" onClick={modificarOtro}>Modificar Otro</button>
                </div>
            ) : (
                formData && Object.keys(formData).length > 0 && (
                    <div className="modificar-container">
                        <form onSubmit={handleSubmit} className="formulario">
                            {(tipo === "actualizar-producto" ? datosProducto : datosCliente).map((dato) => (
                                <div key={dato.campo} className="fila">
                                    <label>{dato.etiqueta}</label>
                                    <div className="columna">
                                        {tipo === "actualizar-producto" && dato.campo === "cantidad" ? (
                                            <>
                                                {/* Mostrar la cantidad actual */}
                                                <div className="cantidad-container">
                                                    <input
                                                        type="text"
                                                        name="cantidad_actual"
                                                        className="input-editable"
                                                        value={formData.cantidad ?? ""}
                                                        readOnly
                                                    />
                                                </div>
    
                                                {/* Input para añadir cantidad */}
                                                <input
                                                    type="text"
                                                    name="cantidadAgregar"
                                                    className="input-editable"
                                                    value={cantidadAgregar}
                                                    onChange={handleCantidadAgregarChange}
                                                    placeholder="Añadir Cantidad"
                                                />
                                            </>
                                        ) : (
                                            <input
                                                type="text"
                                                name={dato.campo}
                                                className="input-editable"
                                                value={formData[dato.campo] ?? ""}
                                                onChange={handleChange}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="botones-finales">
                                <button type="submit" className="btn-modificar">
                                    Modificar {tipo === "actualizar-producto" ? "Producto" : "Cliente"}
                                </button>
                                <button type="button" className="btn-volver" onClick={() => navigate("/menu")}>
                                    Volver al Menú Principal
                                </button>
                            </div>
                        </form>
                    </div>
                )
            )}
        </div>
    );
};

export default Modificar;
