import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from "recharts";

export default function SellerChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="vendedor"
          tick={{ fontSize: 12 }}
        />

        <YAxis
          tickFormatter={(value) =>
            `$${value.toLocaleString()}`
          }
        />

        <Tooltip
          formatter={(value) => `$${value.toLocaleString()}`}
          contentStyle={{
            backgroundColor: "#1f2937",
            borderRadius: "10px",
            border: "none",
            color: "#fff",
          }}
        />

        <Bar
          dataKey="total_sales"
          fill="#6366f1"
          radius={[6, 6, 0, 0]}
        >
          <LabelList
            dataKey="total_sales"
            position="top"
            formatter={(value) =>
              `$${value.toLocaleString()}`
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}