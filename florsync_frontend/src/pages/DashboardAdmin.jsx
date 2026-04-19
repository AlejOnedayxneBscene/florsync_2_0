import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

import SummaryCards from "../components/iu/SummaryCards";
import TopProductsChart from "../components/iu/TopProductsChart";
import SellerChart from "../components/iu/SellerChart";
import SalesChart from "../components/iu/SalesChart";
import Filters from "../components/iu/Filters";

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

  const periodLabel = data?.period
    ? filter.view === "day"
      ? data.period.start
      : filter.view === "week"
      ? `${data.period.start} — ${data.period.end}`
      : data.period.start?.slice(0, 7)
    : "";

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold">DASHBOARD ADMIN</h1>

      <div className="flex items-center gap-6">

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

      <div className="grid grid-cols-2 gap-6">
        <SalesChart data={data} view={filter.view} />
        <TopProductsChart products={data.top_products} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-4">Ventas por vendedor</h2>
        <SellerChart data={data.top_sellers} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-4 text-red-600">
          ⚠️ Stock bajo
        </h2>

        {data.low_stock?.length > 0 ? (
          <div className="space-y-2">
            {data.low_stock.map((p) => (
              <div key={p.id} className="flex justify-between border-b py-1">
                <span>{p.nombre}</span>
                <span className="font-bold text-red-500">
                  {p.stock} unidades
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay productos con stock bajo</p>
        )}
      </div>

    </div>
  );
}