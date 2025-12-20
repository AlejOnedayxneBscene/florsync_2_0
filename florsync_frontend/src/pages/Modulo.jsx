import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/ModuloStyles.css";

const Modulo = () => {
  const { nombre } = useParams();
  const navigate = useNavigate();

  const modulos = {
    inventario: {
      titulo: "Inventario",
      opciones: [
        { tipo: "registros", nombre: "Añadir nuevo producto", imagen: "/images/nuevo_producto.png" },
        { tipo: "modificar", nombre: "Actualizar producto", imagen: "/images/actualizar_producto.png" },
        { tipo: "visualizar", nombre: "Visualizar inventario actual", imagen: "/images/inventario_actual.png" },
        { tipo: "eliminar", nombre: "Eliminar producto", imagen: "/images/eliminar_cliente.png" },
      ],
    },
    ventas: {
      titulo: "Ventas",
      opciones: [
        { tipo: "registrar-venta", nombre: "Registrar venta", imagen: "/images/vender.png" },
        { tipo: "visualizar-historial", nombre: "Historial de ventas", imagen: "/images/historial.png" },
      ],
    },
    clientes: {
      titulo: "Clientes",
      opciones: [
        { tipo: "registros", nombre: "Registrar cliente", imagen: "/images/añadir_cliente.png" },
        { tipo: "modificar", nombre: "Modificar clientes existentes", imagen: "/images/editar_cliente.png" },
        { tipo: "visualizar-cliente", nombre: "Visualizar cliente", imagen: "/images/ver_cliente.png" },
        { tipo: "eliminar", nombre: "Eliminar cliente", imagen: "/images/eliminar_cliente.png" },
      ],
    },
    informes: {
      titulo: "Informes",
      opciones: [
        { tipo: "informe", nombre: "Informe diario", imagen: "/images/informe_diario.png" },
        { tipo: "informe", nombre: "Informe mensual", imagen: "/images/informe_mensual.png" },
      ],
    },
  };

  // Obtener el módulo correspondiente
  const modulo = modulos[nombre];

  useEffect(() => {
    document.body.classList.add("modulo-body");
    return () => {
      document.body.classList.remove("modulo-body");
    };
  }, []);

  if (!modulo) {
    return <h1 className="error">Módulo no encontrado</h1>;
  }

  const handleClick = (opcion) => {
    const tipoOpcion = opcion.tipo;
    const nombreFormateado = opcion.nombre.toLowerCase().replace(/\s/g, "-");

    switch (tipoOpcion) {
      case "registrar":
        navigate(`/registrar/${nombreFormateado}`);
        break;
      case "registrar-venta":
        navigate(`/registrar-venta/`);
        break;
      case "modificar":
        navigate(`/modificar/${nombreFormateado}`);
        break;
      case "visualizar":
        navigate(`/visualizar/${nombreFormateado}`);
        break;
      case "eliminar":
        navigate(`/eliminar/${nombreFormateado}`);
        break;
      case "informe":
        navigate(`/informe/${nombreFormateado}`);
        break;
      case "visualizar-cliente": 
         navigate(`/visualizar-cliente/${nombreFormateado}`);
        break;
        case "registros":
        navigate(`/registrar/${nombreFormateado}`);
        break;
      case 'visualizar-historial':
        navigate(`/visualizar-historial/${nombreFormateado}`);
        break;
      default:
        console.warn("Opción no reconocida:", tipoOpcion);
    }
  };

  return (
    <div className="modulo-body">
      <header className="modulo-header">
        <h1 className="titulo">{modulo.titulo}</h1>
      </header>
      <div className="modulo-container">
        <div className="modulo-content">
          {modulo.opciones.map((opcion, index) => (
            <button key={index} className="modulo-item" onClick={() => handleClick(opcion)}>
              <span>{opcion.nombre}</span>
              <img src={opcion.imagen} alt={opcion.nombre} className="icono" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Modulo;