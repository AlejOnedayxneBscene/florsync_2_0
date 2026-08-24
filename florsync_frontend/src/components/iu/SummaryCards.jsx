export default function SummaryCards({ summary, view }) {
  const cards = [
    {
      value: summary.total_orders || 0,
      label: `Ventas realizadas `,
      prefix: "",
    },
    {
      value: `$${Number(summary.total_sales || 0).toLocaleString()}`,
      label: "Valor de ventas",
      prefix: "",
    },
  ];

  return (
    <div className="col-span-2 flex flex-col gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-[#0d3b2e] text-white rounded-xl px-6 py-5 flex items-center gap-6 flex-1"
        >
          <span className="text-2xl md:text-5xl font-bold leading-none text-white">
            {card.value}
          </span>
          <span className="text-sm text-white/60 leading-snug max-w-[120px]">
            {card.label}
          </span>
        </div>
      ))}
    </div>
  );
}