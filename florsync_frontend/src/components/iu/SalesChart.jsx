import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function SalesChart({ data, view }) {
const chartData = data.chart_data ?? [];

  const getLabel = (v) => {
  if (!v) return v;
  if (/^\d{2}:\d{2}$/.test(v)) return v;                          // "14:00" → día
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {                            // "2026-04-03" → semana
    const d = new Date(v + "T00:00:00");
    return isNaN(d) ? v : DIAS[d.getDay() === 0 ? 6 : d.getDay() - 1];
  }
  if (/^\d{4}-\d{2}$/.test(v)) {                                  // "2026-04" → mes
    const [, month] = v.split("-");
    return MESES[parseInt(month) - 1];
  }
  console.log("=== SalesChart render ===");
  console.log("view:", view);
  console.log("primer date:", chartData[0]?.date);
  console.log("último date:", chartData[chartData.length - 1]?.date);
  return v;
};

  return (
    <div className="bg-gradient-to-br from-[#0f3d2e] to-[#0a2e22] text-white p-6 rounded-2xl shadow-lg border border-white/10">

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Ventas
        </h3>
        <span className="text-xs text-green-400 font-medium">
          {view === "day" ? "Diario" : view === "week" ? "Semanal" : "Mensual"}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

            <XAxis
              dataKey="date"
              interval={
                view === "day"
                  ? 2        // cada 2 horas
                  : view === "week"
                  ? 0        // mostrar todos los días
                  : 0        // mostrar todos los meses
              }
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickFormatter={getLabel}
            />

          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
          />

          <Tooltip
            cursor={{ stroke: "#4ecfa0", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              background: "rgba(10, 46, 34, 0.95)",
              border: "1px solid rgba(78,207,160,0.3)",
              borderRadius: 12,
              backdropFilter: "blur(6px)",
            }}
            labelStyle={{ color: "#4ecfa0", fontWeight: "bold" }}
            labelFormatter={getLabel}
            formatter={(v) => [`$${Number(v).toLocaleString()}`, "Ventas"]}
          />

          <Line
            type="monotone"
            dataKey="total_sales"
            stroke="#4ecfa0"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#4ecfa0", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}