import { useAuth } from "../components/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";

import SummaryCards from "../components/iu/SummaryCards";
import SalesChart from "../components/iu/SalesChart";
import TopProductsChart from "../components/iu/TopProductsChart";
import Filters from "../components/iu/Filters";
import ProfileCard from "../components/iu/ProfileCard";
import { obtenerDashboard } from "../api/apiVentas";


export default function Dashboard() {
  const { user, isAuthLoaded } = useAuth();
  const [view, setView] = useState("week");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);

  // Reset offset al cambiar de vista
  const handleSetView = (v) => {
    setView(v);
    setOffset(0);
  };

  useEffect(() => {
    obtenerDashboard(view, offset)
      .then(setData)
      .catch(console.error);
  }, [view, offset]);

  if (!isAuthLoaded) return <div>Cargando usuario...</div>;
  if (!data) return <div>Cargando datos...</div>;

  const nombre = user?.first_name || user?.username || "Usuario";

  const periodLabel = view === "day"
    ? data.period?.start
    : view === "week"
    ? `${data.period?.start} — ${data.period?.end}`
    : data.period?.start?.slice(0, 7);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">DASHBOARD</h1>

      <div className="flex items-center gap-6">
        <Filters view={view} setView={handleSetView} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(o => o - 1)}
            className="px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >◀</button>
          <span className="text-sm font-medium">{periodLabel}</span>
          <button
            onClick={() => setOffset(o => o + 1)}
            className="px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >▶</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <ProfileCard nombre={nombre} />
        <SummaryCards summary={data.summary} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <SalesChart data={data} view={view} />
        <TopProductsChart products={data.top_products} />
      </div>
    </div>
  );
}