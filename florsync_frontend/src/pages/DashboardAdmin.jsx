import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

import SummaryCards from "../components/iu/SummaryCards";
import TopProductsChart from "../components/iu/TopProductsChart";
import SellerChart from "../components/iu/SellerChart";
import SalesChart from "../components/iu/SalesChart";
import Filters from "../components/iu/Filters";
import LowStockAlert from "../components/iu/LowStockAlert";
import { obtenerDashboardAdmin } from "../api/apiVentas";

export default function DashboardAdmin() {
  const { isAuthLoaded } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({ view: "week", offset: 0 });

  const handleSetView = (v) => setFilter({ view: v, offset: 0 });
  const handleOffset = (delta) => setFilter((f) => ({ ...f, offset: f.offset + delta }));

  useEffect(() => {
    setLoading(true);

    obtenerDashboardAdmin(filter.view, filter.offset)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [filter]);

  if (!isAuthLoaded || loading) return <div>Cargando...</div>;

  if (!data) return <div>Error cargando datos</div>;

const periodLabel = filter.view === "day"
  ? new Date(data.period?.start + "T00:00:00")
      .toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
  : filter.view === "week"
  ? `${data.period?.start} — ${data.period?.end}`
  : new Date(data.period?.start + "T00:00:00")
      .toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold">DASHBOARD ADMIN</h1>

      <div className="flex flex-wrap items-center gap-3 md:gap-6">

        <Filters view={filter.view} setView={handleSetView} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOffset(-1)}
            className="px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            ◀
          </button>

          <span className="text-sm font-medium">
            {periodLabel}
          </span>

          <button
            onClick={() => handleOffset(+1)}
            className="px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            ▶
          </button>
        </div>

      </div>

      <SummaryCards summary={data.summary} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <SalesChart data={data} view={filter.view} />
        <TopProductsChart products={data.top_products} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-4">Ventas por vendedor</h2>
        <SellerChart data={data.top_sellers} />
      </div>
        <LowStockAlert productos={data.low_stock} />
    </div>
  );
}