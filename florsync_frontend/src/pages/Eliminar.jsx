import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    obtenerProductoPorID,
    eliminarProducto,
    eliminarCliente,
    obtenerClientesPorID,
} from "../api/test.api";
import "../css/Modificar.css";

const Eliminar = () => {
    const { tipo, id } = useParams();
    const navigate = useNavigate();
    const [filtroID, setFiltroID] = useState(id || "");
    const [formData, setFormData] = useState({});
    const [error, setError] = useState("");

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
            let data;
            if (tipo === "eliminar-producto") {
                data = await obtenerProductoPorID(filtroID);
            } else if (tipo === "eliminar-cliente") {
                data = await obtenerClientesPorID(filtroID);
            } else {
                throw new Error("Tipo no válido");
            }
            setFormData(data);
        } catch (error) {
            setError("No se encontró ningún registro con ese ID.");
        }
    };

    const handleEliminar = async () => {
        if (
            !window.confirm(
                `¿Estás seguro de que deseas eliminar este ${
                    tipo === "eliminar-producto" ? "producto" : "cliente"
                }?`
            )
        ) {
            return;
        }
        try {
            if (tipo === "eliminar-producto") {
                await eliminarProducto(filtroID);
            } else if (tipo === "eliminar-cliente") {
                await eliminarCliente(filtroID);
            }
            alert("Eliminado exitosamente");
            setFormData({});
            setFiltroID("");
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    };

    const volverInicioSesion = () => {
        navigate("/menu"); 
    };

    return (
        <div className="modificar-body">
            <div className="modificar-header">
                <h2>Eliminar {tipo === "eliminar-producto" ? "Producto" : "Cliente"}</h2>
            </div>

            <input
                type="text"
                className="buscador-eliminar"
                placeholder="Buscar por ID"
                value={filtroID}
                onChange={(e) => setFiltroID(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarPorID()}
            />
            <button className="btn-buscar" onClick={buscarPorID}>
                Buscar
            </button>

            {error && <p className="error">{error}</p>}

            {formData && Object.keys(formData).length > 0 && (
                <div className="modificar-container">
                    <div className="formulario">
                        {(tipo === "eliminar-producto" ? datosProducto : datosCliente).map(
                            (dato) => (
                                <div key={dato.campo} className="fila">
                                    <label>{dato.etiqueta}:</label>
                                    <span>{formData[dato.campo]}</span>
                                </div>
                            )
                        )}
                        <button className="btn-eliminar" onClick={handleEliminar}>
                            Eliminar {tipo === "eliminar-producto" ? "Producto" : "Cliente"}
                        </button>
                        <button className="btn-volver" onClick={volverInicioSesion}>
                            Volver al Inicio de Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Eliminar;