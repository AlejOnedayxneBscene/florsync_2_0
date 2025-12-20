import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { obtenerInforme } from "../api/test.api";
import "../css/VentasMostrar.css";


const Informe = () => {
  const { tipo } = useParams(); 
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");


  useEffect(() => {
    document.body.classList.add("ventas-body");
    return () => {
        document.body.classList.remove("ventas-body");
    };
}, []);

  const obtenerFechaActual = () => {
    const ahora = new Date();
    if (tipo === "informe-diario") {
      const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
      return fechaLocal.toISOString().split("T")[0]; 
    } else if (tipo === "informe-mensual") {
      return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`; // yyyy-mm
    }
    return "";
  };

  // Llamar a la API
  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      setError(null);
      try {
        const fecha = fechaSeleccionada || obtenerFechaActual(); 
        const response = await obtenerInforme(tipo, fecha);  
        setDatos(response.data);
      } catch (error) {
        setError("Hubo un problema al cargar el informe.");
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [tipo, fechaSeleccionada]); 

  const manejarCambioFecha = (e) => {
    setFechaSeleccionada(e.target.value);
  };

  const obtenerTituloFecha = () => {
    const fecha = fechaSeleccionada || obtenerFechaActual();
    const ahora = new Date(fecha);
  
    if (isNaN(ahora)) {
      return "Fecha inválida"; 
    }
  
    if (tipo === "informe-diario") {
      return ahora.toLocaleDateString("es-ES"); 
    } else if (tipo === "informe-mensual") {
      return ahora.toLocaleString("default", { month: "long", year: "numeric" });
    }
  
    return "";
  };
  if (cargando) return <div>Cargando informe...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <h1 className="titulo">
          Informe <span>{tipo === "informe-diario" ? "Diario" : "Mensual"}</span>
        </h1>
      </div>
  
      <div className="filtro-fecha">
        <label>
          {tipo === "informe-diario" ? "Selecciona una fecha:" : "Selecciona un mes:"}
          <input
            type={tipo === "informe-diario" ? "date" : "month"}
            value={fechaSeleccionada || obtenerFechaActual()}
            onChange={manejarCambioFecha}
          />
        </label>
      </div>
  
      {datos ? (
        <div className="venta-card">
          <p><strong>Fecha seleccionada:</strong> {fechaSeleccionada || obtenerFechaActual()}</p>
          <p><strong>Número de ventas:</strong> {datos.numero_ventas}</p>
          <p><strong>Total vendido:</strong> ${datos.total_vendido}</p>
  
          <div>
            <h4>🛍️ Top 5 productos por cantidad:</h4>
            <ul>
              {datos.top_5_productos_por_cantidad.map((item, i) => (
                <li key={i}>
                  {item.producto__nombre} - {item.total_cantidad} unidades
                </li>
              ))}
            </ul>
          </div>
  
          <div>
            <h4>💰 Top 5 productos por valor:</h4>
            <ul>
              {datos.top_5_productos_por_valor.map((item, i) => (
                <li key={i}>
                  {item.producto__nombre} - ${item.valor_total}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>Cargando informe...</p>
      )}
    </div>
  );
  
};

export default Informe;
